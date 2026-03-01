const { writeAuditLog } = require('../../core/audit');
const repo = require('./repo');

function normalizeLocationName(value) {
  return String(value || '').trim().toUpperCase();
}

function createLocation(body, currentUser) {
  const name = normalizeLocationName(body.name);
  const errors = [];

  if (!name) {
    errors.push('Location name is required.');
  }

  if (repo.getLocationByName(name)) {
    errors.push('Location name must be unique.');
  }

  if (errors.length > 0) {
    return { errors };
  }

  const id = repo.createLocation(name);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'location',
    entityId: id,
    payload: { name },
  });

  return { id };
}

function normalizeMovePayload(body, currentUser) {
  const payload = {
    book_id: Number(body.book_id),
    from_location_id: body.from_location_id ? Number(body.from_location_id) : null,
    to_location_id: body.to_location_id ? Number(body.to_location_id) : null,
    quantity: Number(body.quantity),
    note: body.note ? String(body.note).trim() : null,
    created_by: currentUser.id,
  };

  const errors = [];

  if (!Number.isInteger(payload.book_id)) {
    errors.push('Book is required.');
  } else {
    const book = repo.getBookById(payload.book_id);
    if (!book) {
      errors.push('Selected book was not found.');
    }
  }

  if (!payload.from_location_id && !payload.to_location_id) {
    errors.push('At least one location (from or to) is required.');
  }

  if (payload.from_location_id && !Number.isInteger(payload.from_location_id)) {
    errors.push('From location is invalid.');
  }

  if (payload.to_location_id && !Number.isInteger(payload.to_location_id)) {
    errors.push('To location is invalid.');
  }

  if (payload.from_location_id && payload.to_location_id && payload.from_location_id === payload.to_location_id) {
    errors.push('From and to locations must be different.');
  }

  if (payload.from_location_id) {
    const fromLocation = repo.getLocationById(payload.from_location_id);
    if (!fromLocation) {
      errors.push('From location was not found.');
    }
  }

  if (payload.to_location_id) {
    const toLocation = repo.getLocationById(payload.to_location_id);
    if (!toLocation) {
      errors.push('To location was not found.');
    }
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    errors.push('Quantity must be a positive integer.');
  }

  if (
    Number.isInteger(payload.book_id) &&
    payload.from_location_id &&
    Number.isInteger(payload.quantity) &&
    payload.quantity > 0
  ) {
    repo.ensureStockRow(payload.book_id, payload.from_location_id);
    const fromStock = repo.getStockRow(payload.book_id, payload.from_location_id);
    if (!fromStock || fromStock.quantity < payload.quantity) {
      errors.push('Insufficient stock in from location. Negative stock is not allowed.');
    }
  }

  return { payload, errors };
}

function moveStock(body, currentUser) {
  const { payload, errors } = normalizeMovePayload(body, currentUser);

  if (errors.length > 0) {
    return { errors };
  }

  const movementId = repo.moveStock(payload);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'stock_tx',
    entityId: movementId,
    payload,
  });

  return { movementId };
}

function defaultMoveForm() {
  return {
    book_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: '',
    note: '',
  };
}

function defaultAdjustForm() {
  return {
    book_id: '',
    location_id: '',
    direction: 'IN',
    quantity: '1',
    note: '',
  };
}

function normalizeAdjustPayload(body, currentUser) {
  const payload = {
    book_id: Number(body.book_id),
    location_id: Number(body.location_id),
    direction: String(body.direction || '').toUpperCase(),
    quantity: Number(body.quantity),
    note: String(body.note || '').trim(),
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

  if (!['IN', 'OUT'].includes(payload.direction)) {
    errors.push('Direction must be IN or OUT.');
  }

  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    errors.push('Quantity must be a positive integer.');
  }

  if (!payload.note || payload.note.length < 3) {
    errors.push('Note is required and must be at least 3 characters.');
  }

  if (
    Number.isInteger(payload.book_id) &&
    Number.isInteger(payload.location_id) &&
    payload.direction === 'OUT' &&
    Number.isInteger(payload.quantity) &&
    payload.quantity > 0
  ) {
    repo.ensureStockRow(payload.book_id, payload.location_id);
    const stock = repo.getStockRow(payload.book_id, payload.location_id);
    const availableQty = stock ? stock.quantity : 0;

    if (availableQty < payload.quantity) {
      errors.push('Insufficient stock at selected location. Negative stock is not allowed.');
    }
  }

  return { payload, errors };
}

function adjustStock(body, currentUser) {
  const { payload, errors } = normalizeAdjustPayload(body, currentUser);

  if (errors.length > 0) {
    return { errors };
  }

  try {
    const result = repo.adjustStockTx(payload);
    return {
      movementId: result.movementId,
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
  createLocation,
  moveStock,
  defaultMoveForm,
  defaultAdjustForm,
  adjustStock,
};
