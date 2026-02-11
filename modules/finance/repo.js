const db = require('../../core/db');

function buildFilterQuery(filters) {
  const clauses = [];
  const params = [];

  if (filters.date_from) {
    clauses.push('ft.date >= ?');
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    clauses.push('ft.date <= ?');
    params.push(filters.date_to);
  }
  if (filters.direction) {
    clauses.push('ft.direction = ?');
    params.push(filters.direction);
  }
  if (filters.category_id) {
    clauses.push('ft.category_id = ?');
    params.push(Number(filters.category_id));
  }
  if (filters.payment_method) {
    clauses.push('ft.payment_method = ?');
    params.push(filters.payment_method);
  }
  if (!filters.include_cancelled) {
    clauses.push('ft.is_cancelled = 0');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return { whereSql, params };
}

function listTransactions(filters = {}) {
  const { whereSql, params } = buildFilterQuery(filters);

  return db
    .prepare(
      `SELECT ft.*, c.name AS category_name
       FROM finance_transactions ft
       JOIN categories c ON c.id = ft.category_id
       ${whereSql}
       ORDER BY ft.date DESC, ft.id DESC`
    )
    .all(...params);
}

function getTransactionById(id) {
  return db.prepare('SELECT * FROM finance_transactions WHERE id = ?').get(id);
}

function createTransaction(payload) {
  const result = db
    .prepare(
      `INSERT INTO finance_transactions
      (direction, amount, currency, date, category_id, payment_method, note, ref_type, ref_id, created_by, updated_by)
      VALUES
      (@direction, @amount, @currency, @date, @category_id, @payment_method, @note, @ref_type, @ref_id, @created_by, @updated_by)`
    )
    .run(payload);

  return result.lastInsertRowid;
}

function cancelTransaction(id, { cancelled_by, cancel_reason }) {
  return db
    .prepare(
      `UPDATE finance_transactions
       SET is_cancelled = 1,
           cancelled_at = datetime('now'),
           cancelled_by = ?,
           cancel_reason = ?,
           updated_at = datetime('now'),
           updated_by = ?
       WHERE id = ? AND is_cancelled = 0`
    )
    .run(cancelled_by, cancel_reason, cancelled_by, id);
}

function listCategories({ includeInactive = false, direction = null } = {}) {
  const clauses = [];
  const params = [];

  if (!includeInactive) {
    clauses.push('is_active = 1');
  }

  if (direction) {
    clauses.push('direction = ?');
    params.push(direction);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return db
    .prepare(`SELECT * FROM categories ${whereSql} ORDER BY direction, name ASC`)
    .all(...params);
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function createCategory(payload) {
  const result = db
    .prepare(
      `INSERT INTO categories (name, direction, parent_id)
       VALUES (@name, @direction, @parent_id)`
    )
    .run(payload);

  return result.lastInsertRowid;
}

module.exports = {
  listTransactions,
  getTransactionById,
  createTransaction,
  cancelTransaction,
  listCategories,
  getCategoryById,
  createCategory,
};
