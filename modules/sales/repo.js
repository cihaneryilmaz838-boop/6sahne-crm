const db = require('../../core/db');

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_log (
    action_type,
    actor_user_id,
    entity_type,
    entity_id,
    reason,
    payload_json
  ) VALUES (
    @action_type,
    @actor_user_id,
    @entity_type,
    @entity_id,
    @reason,
    @payload_json
  )
`);

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
      `SELECT id, name, direction, is_active
       FROM categories
       WHERE is_active = 1
         AND direction = 'IN'
       ORDER BY name ASC, id ASC`
    )
    .all();
}

function listRecentSales(limit = 100) {
  return db
    .prepare(
      `SELECT
        s.id,
        s.book_id,
        s.location_id,
        s.quantity,
        s.total_amount,
        s.payment_method,
        s.created_at,
        s.is_cancelled,
        s.cancelled_at,
        s.cancel_reason,
        b.title AS book_title,
        l.name AS location_name
       FROM sales s
       JOIN books b ON b.id = s.book_id
       JOIN locations l ON l.id = s.location_id
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT ?`
    )
    .all(limit);
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

function getSaleById(id) {
  return db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
}

function findActiveFinanceTxBySaleId(saleId) {
  return db
    .prepare(
      `SELECT *
       FROM finance_transactions
       WHERE ref_type = 'sale'
         AND ref_id = ?
         AND direction = 'IN'
         AND is_cancelled = 0
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(saleId);
}

function writeAudit({ actionType, actorUserId, entityType, entityId, reason = null, payload = null }) {
  insertAuditStmt.run({
    action_type: actionType,
    actor_user_id: actorUserId,
    entity_type: entityType,
    entity_id: entityId,
    reason,
    payload_json: payload ? JSON.stringify(payload) : null,
  });
}

function cancelSaleWithEffects({ saleId, reason, currentUserId }) {
  const tx = db.transaction((input) => {
    const sale = getSaleById(input.saleId);
    if (!sale) {
      throw new Error('SALE_NOT_FOUND');
    }
    if (sale.is_cancelled) {
      throw new Error('SALE_ALREADY_CANCELLED');
    }

    db.prepare(
      `UPDATE sales
       SET is_cancelled = 1,
           cancelled_at = datetime('now'),
           cancelled_by = ?,
           cancel_reason = ?
       WHERE id = ?`
    ).run(input.currentUserId, input.reason, sale.id);

    ensureStockRow(sale.book_id, sale.location_id);
    const stock = getStockRow(sale.book_id, sale.location_id);
    const stockBefore = stock ? stock.quantity : 0;
    const stockAfter = stockBefore + sale.quantity;
    updateStockQuantity(sale.book_id, sale.location_id, stockAfter);

    const movementId = insertInventoryMovement({
      book_id: sale.book_id,
      from_location_id: null,
      to_location_id: sale.location_id,
      quantity: sale.quantity,
      note: `SALE_CANCEL ${sale.id}`,
      created_by: input.currentUserId,
    });

    const financeTx = findActiveFinanceTxBySaleId(sale.id);
    let cancelledFinanceTxId = null;
    if (financeTx) {
      db.prepare(
        `UPDATE finance_transactions
         SET is_cancelled = 1,
             cancelled_at = datetime('now'),
             cancelled_by = ?,
             cancel_reason = ?,
             updated_at = datetime('now'),
             updated_by = ?
         WHERE id = ?`
      ).run(input.currentUserId, input.reason, input.currentUserId, financeTx.id);

      cancelledFinanceTxId = financeTx.id;
    }

    writeAudit({
      actionType: 'CANCEL',
      actorUserId: input.currentUserId,
      entityType: 'sale',
      entityId: sale.id,
      reason: input.reason,
      payload: {
        stock_before: stockBefore,
        stock_after: stockAfter,
      },
    });

    writeAudit({
      actionType: 'CREATE',
      actorUserId: input.currentUserId,
      entityType: 'stock_tx',
      entityId: movementId,
      payload: {
        movement_type: 'SALE_CANCEL',
        sale_id: sale.id,
        book_id: sale.book_id,
        location_id: sale.location_id,
        quantity: sale.quantity,
      },
    });

    if (cancelledFinanceTxId) {
      writeAudit({
        actionType: 'CANCEL',
        actorUserId: input.currentUserId,
        entityType: 'finance_tx',
        entityId: cancelledFinanceTxId,
        reason: input.reason,
        payload: {
          ref_type: 'sale',
          ref_id: sale.id,
        },
      });
    }

    return {
      saleId: sale.id,
      movementId,
      financeTxId: cancelledFinanceTxId,
      financeTxMissing: !cancelledFinanceTxId,
    };
  });

  return tx({ saleId, reason, currentUserId });
}

module.exports = {
  listBooks,
  listLocations,
  listIncomeCategories,
  listRecentSales,
  getBookById,
  getLocationById,
  getCategoryById,
  ensureStockRow,
  getStockRow,
  createSaleWithEffects,
  cancelSaleWithEffects,
};
