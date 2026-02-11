const { writeAuditLog } = require('../../core/audit');
const repo = require('./repo');

const PAYMENT_METHOD_VALUES = ['CASH', 'TRANSFER', 'CARD'];

function defaultSaleForm() {
  return {
    book_id: '',
    location_id: '',
    quantity: '1',
    unit_price: '',
    payment_method: 'CASH',
    category_id: '',
  };
}

function normalizePayload(body, currentUser) {
  const quantity = Number(body.quantity);
  const unitPrice = Number(body.unit_price);

  const payload = {
    book_id: Number(body.book_id),
    location_id: Number(body.location_id),
    quantity,
    unit_price: unitPrice,
    total_amount: quantity * unitPrice,
    payment_method: String(body.payment_method || '').toUpperCase(),
    category_id: Number(body.category_id),
    date: new Date().toISOString().slice(0, 10),
    created_by: currentUser.id,
  };

  const errors = [];

  if (!Number.isInteger(payload.book_id)) {
    errors.push('Book is required.');
  } else {
    const book = repo.getBookById(payload.book_id);
    if (!book || !book.is_active) {
      errors.push('Selected book was not found or is inactive.');
    }
  }

  if (!Number.isInteger(payload.location_id)) {
    errors.push('Location is required.');
  } else {
    const location = repo.getLocationById(payload.location_id);
    if (!location) {
      errors.push('Selected location was not found.');
    }
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    errors.push('Quantity must be a positive integer.');
  }

  if (!Number.isInteger(payload.unit_price) || payload.unit_price <= 0) {
    errors.push('Unit price must be a positive integer.');
  }

  if (!PAYMENT_METHOD_VALUES.includes(payload.payment_method)) {
    errors.push('Payment method must be CASH, TRANSFER, or CARD.');
  }

  if (!Number.isInteger(payload.category_id)) {
    errors.push('Finance category is required.');
  } else {
    const category = repo.getCategoryById(payload.category_id);
    if (!category || !category.is_active || category.direction !== 'IN') {
      errors.push('Selected finance category must be an active income category.');
    }
  }

  if (Number.isInteger(payload.book_id) && Number.isInteger(payload.location_id) && Number.isInteger(payload.quantity)) {
    repo.ensureStockRow(payload.book_id, payload.location_id);
    const stock = repo.getStockRow(payload.book_id, payload.location_id);
    const availableQty = stock ? stock.quantity : 0;

    if (availableQty < payload.quantity) {
      errors.push('Insufficient stock at selected location. Negative stock is not allowed.');
    }
  }

  return { payload, errors };
}

function createSale(body, currentUser) {
  const { payload, errors } = normalizePayload(body, currentUser);

  if (errors.length > 0) {
    return { errors };
  }

  try {
    const result = repo.createSaleWithEffects(payload);

    writeAuditLog({
      actionType: 'CREATE',
      actorUserId: currentUser.id,
      entityType: 'sale',
      entityId: result.saleId,
      payload,
    });

    writeAuditLog({
      actionType: 'CREATE',
      actorUserId: currentUser.id,
      entityType: 'stock_tx',
      entityId: result.movementId,
      payload: {
        movement_type: 'SALE_OUT',
        sale_id: result.saleId,
        book_id: payload.book_id,
        location_id: payload.location_id,
        quantity: payload.quantity,
        stock_before: result.stockBefore,
        stock_after: result.stockAfter,
      },
    });

    writeAuditLog({
      actionType: 'CREATE',
      actorUserId: currentUser.id,
      entityType: 'finance_tx',
      entityId: result.financeTxId,
      payload: {
        direction: 'IN',
        amount: payload.total_amount,
        category_id: payload.category_id,
        payment_method: payload.payment_method,
        ref_type: 'sale',
        ref_id: result.saleId,
      },
    });

    return {
      saleId: result.saleId,
    };
  } catch (error) {
    if (error && error.message === 'INSUFFICIENT_STOCK') {
      return {
        errors: ['Insufficient stock at selected location. Negative stock is not allowed.'],
      };
    }

    throw error;
  }
}

module.exports = {
  PAYMENT_METHOD_VALUES,
  defaultSaleForm,
  createSale,
};
