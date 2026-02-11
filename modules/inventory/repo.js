const db = require('../../core/db');

function listBooks() {
  return db
    .prepare(
      `SELECT id, title, author, is_active
       FROM books
       ORDER BY is_active DESC, title ASC, id ASC`
    )
    .all();
}

function getBookById(bookId) {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
}

function listLocations() {
  return db.prepare('SELECT * FROM locations ORDER BY name ASC, id ASC').all();
}

function getLocationById(locationId) {
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(locationId);
}

function createLocation(name) {
  const result = db
    .prepare(
      `INSERT INTO locations (name)
       VALUES (?)`
    )
    .run(name);

  return Number(result.lastInsertRowid);
}

function getLocationByName(name) {
  return db.prepare('SELECT * FROM locations WHERE name = ?').get(name);
}

function listStockByBookId(bookId) {
  return db
    .prepare(
      `SELECT l.id AS location_id,
              l.name AS location_name,
              COALESCE(s.quantity, 0) AS quantity,
              s.updated_at
       FROM locations l
       LEFT JOIN inventory_stock s
         ON s.location_id = l.id
        AND s.book_id = ?
       ORDER BY l.name ASC, l.id ASC`
    )
    .all(bookId);
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

function createMovement(payload) {
  const result = db
    .prepare(
      `INSERT INTO inventory_movements (
        book_id,
        from_location_id,
        to_location_id,
        quantity,
        note,
        created_by
      ) VALUES (
        @book_id,
        @from_location_id,
        @to_location_id,
        @quantity,
        @note,
        @created_by
      )`
    )
    .run(payload);

  return Number(result.lastInsertRowid);
}

function moveStock(payload) {
  const tx = db.transaction((movement) => {
    if (movement.from_location_id) {
      ensureStockRow(movement.book_id, movement.from_location_id);
      const fromStock = getStockRow(movement.book_id, movement.from_location_id);
      updateStockQuantity(movement.book_id, movement.from_location_id, fromStock.quantity - movement.quantity);
    }

    if (movement.to_location_id) {
      ensureStockRow(movement.book_id, movement.to_location_id);
      const toStock = getStockRow(movement.book_id, movement.to_location_id);
      updateStockQuantity(movement.book_id, movement.to_location_id, toStock.quantity + movement.quantity);
    }

    return createMovement(movement);
  });

  return tx(payload);
}

module.exports = {
  listBooks,
  getBookById,
  listLocations,
  getLocationById,
  createLocation,
  getLocationByName,
  listStockByBookId,
  getStockRow,
  ensureStockRow,
  moveStock,
};
