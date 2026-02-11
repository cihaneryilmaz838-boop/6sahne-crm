const db = require('../../core/db');

function listBooks() {
  return db
    .prepare(
      `SELECT id, title, unit_price, is_active
       FROM books
       ORDER BY is_active DESC, title ASC, id ASC`
    )
    .all();
}

function listLocations() {
  return db.prepare('SELECT id, name FROM locations ORDER BY name ASC, id ASC').all();
}

function listIncomeCategories() {
  return db
    .prepare(
      `SELECT id, name, direction
       FROM categories
       WHERE is_active = 1
         AND direction = 'IN'
       ORDER BY name ASC, id ASC`
    )
    .all();
}

function getBookById(id) {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
}

function getLocationById(id) {
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function getStockRow(bookId, locationId) {
  return db
    .prepare(
      `SELECT *
       FROM inventory_stock
       WHERE book_id = ? AND location_id = ?`
    )
    .get(bookId, locationId);
}

function ensureStockRow(bookId, locationId) {
  db.prepare(
    `INSERT OR IGNORE INTO inventory_stock (book_id, location_id, quantity)
     VALUES (?, ?, 0)`
  ).run(bookId, locationId);
}

function updateStockQuantity(bookId, locationId, quantity) {
  db.prepare(
    `UPDATE inventory_stock
     SET quantity = ?,
         updated_at = datetime('now')
     WHERE book_id = ? AND location_id = ?`
  ).run(quantity, bookId, locationId);
}

function insertSale(payload) {
  const result = db
    .prepare(
      `INSERT INTO sales (book_id, location_id, quantity, unit_price, total_amount, payment_method, created_by)
       VALUES (@book_id, @location_id, @quantity, @unit_price, @total_amount, @payment_method, @created_by)`
    )
    .run(payload);

  return Number(result.lastInsertRowid);
}

function insertInventoryMovement(payload) {
  const result = db
    .prepare(
      `INSERT INTO inventory_movements (book_id, from_location_id, to_location_id, quantity, note, created_by)
       VALUES (@book_id, @from_location_id, @to_location_id, @quantity, @note, @created_by)`
    )
    .run(payload);

  return Number(result.lastInsertRowid);
}

function insertFinanceTransaction(payload) {
  const result = db
    .prepare(
      `INSERT INTO finance_transactions
       (direction, amount, currency, date, category_id, payment_method, note, ref_type, ref_id, created_by, updated_by)
       VALUES
       (@direction, @amount, @currency, @date, @category_id, @payment_method, @note, @ref_type, @ref_id, @created_by, @updated_by)`
    )
    .run(payload);

  return Number(result.lastInsertRowid);
}

function createSaleWithEffects(payload) {
  const tx = db.transaction((salePayload) => {
    ensureStockRow(salePayload.book_id, salePayload.location_id);

    const stock = getStockRow(salePayload.book_id, salePayload.location_id);
    const stockBefore = stock ? stock.quantity : 0;

    if (stockBefore < salePayload.quantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    const stockAfter = stockBefore - salePayload.quantity;
    updateStockQuantity(salePayload.book_id, salePayload.location_id, stockAfter);

    const saleId = insertSale(salePayload);

    const movementId = insertInventoryMovement({
      book_id: salePayload.book_id,
      from_location_id: salePayload.location_id,
      to_location_id: null,
      quantity: salePayload.quantity,
      note: `SALE_OUT sale_id=${saleId}`,
      created_by: salePayload.created_by,
    });

    const financeTxId = insertFinanceTransaction({
      direction: 'IN',
      amount: salePayload.total_amount,
      currency: 'TRY',
      date: salePayload.date,
      category_id: salePayload.category_id,
      payment_method: salePayload.payment_method,
      note: `Sale #${saleId}`,
      ref_type: 'sale',
      ref_id: saleId,
      created_by: salePayload.created_by,
      updated_by: salePayload.created_by,
    });

    return {
      saleId,
      movementId,
      financeTxId,
      stockBefore,
      stockAfter,
    };
  });

  return tx(payload);
}

module.exports = {
  listBooks,
  listLocations,
  listIncomeCategories,
  getBookById,
  getLocationById,
  getCategoryById,
  ensureStockRow,
  getStockRow,
  createSaleWithEffects,
};
