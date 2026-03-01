const db = require('../../core/db');
const { writeAuditLog } = require('../../core/audit');

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
        movement_type,
        from_location_id,
        to_location_id,
        quantity,
        note,
        created_by
      ) VALUES (
        @book_id,
        @movement_type,
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

    return createMovement({
      ...movement,
      movement_type: 'MOVE',
    });
  });

  return tx(payload);
}

function adjustStockTx(payload) {
  const tx = db.transaction((movement) => {
    ensureStockRow(movement.book_id, movement.location_id);

    const stock = getStockRow(movement.book_id, movement.location_id);
    const stockBefore = stock ? stock.quantity : 0;

    let stockAfter = stockBefore;
    let movementType = 'ADJUST_IN';
    let fromLocationId = null;
    let toLocationId = movement.location_id;

    if (movement.direction === 'OUT') {
      stockAfter = stockBefore - movement.quantity;
      movementType = 'ADJUST_OUT';
      fromLocationId = movement.location_id;
      toLocationId = null;

      if (stockAfter < 0) {
        throw new Error('INSUFFICIENT_STOCK');
      }
    } else {
      stockAfter = stockBefore + movement.quantity;
    }

    updateStockQuantity(movement.book_id, movement.location_id, stockAfter);

    const movementId = createMovement({
      book_id: movement.book_id,
      movement_type: movementType,
      from_location_id: fromLocationId,
      to_location_id: toLocationId,
      quantity: movement.quantity,
      note: movement.note,
      created_by: movement.created_by,
    });

    writeAuditLog({
      actionType: 'CREATE',
      actorUserId: movement.created_by,
      entityType: 'stock_adjust',
      entityId: movementId,
      payload: {
        book_id: movement.book_id,
        location_id: movement.location_id,
        direction: movement.direction,
        quantity: movement.quantity,
        note: movement.note,
      },
    });

    return {
      movementId,
      stockBefore,
      stockAfter,
      movementType,
    };
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
  adjustStockTx,
};
