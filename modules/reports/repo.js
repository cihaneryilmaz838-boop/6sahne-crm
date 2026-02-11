const db = require('../../core/db');

function getFinanceSummary({ today, monthPrefix }) {
  const totals = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN amount END), 0) AS total_out
       FROM finance_transactions
       WHERE is_cancelled = 0`
    )
    .get();

  const todayTotals = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount END), 0) AS today_in,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN amount END), 0) AS today_out
       FROM finance_transactions
       WHERE is_cancelled = 0
         AND date = ?`
    )
    .get(today);

  const monthTotals = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN amount END), 0) AS month_in,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN amount END), 0) AS month_out
       FROM finance_transactions
       WHERE is_cancelled = 0
         AND substr(date, 1, 7) = ?`
    )
    .get(monthPrefix);

  return {
    ...totals,
    ...todayTotals,
    ...monthTotals,
  };
}

function listStudentBalancesWithRemaining() {
  return db
    .prepare(
      `SELECT
        s.id,
        s.full_name,
        spp.total_fee,
        COALESCE(sp.paid_amount, 0) AS paid_amount,
        spp.total_fee - COALESCE(sp.paid_amount, 0) AS remaining_amount,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM student_installments si
            WHERE si.payment_plan_id = spp.id
              AND si.due_date < date('now')
          )
          AND (spp.total_fee - COALESCE(sp.paid_amount, 0)) > 0
          THEN 1
          ELSE 0
        END AS is_overdue
       FROM students s
       JOIN student_payment_plans spp ON spp.student_id = s.id
       LEFT JOIN (
         SELECT ref_id AS student_id, SUM(amount) AS paid_amount
         FROM finance_transactions
         WHERE direction = 'IN'
           AND ref_type = 'student'
           AND is_cancelled = 0
         GROUP BY ref_id
       ) sp ON sp.student_id = s.id
       WHERE (spp.total_fee - COALESCE(sp.paid_amount, 0)) > 0
       ORDER BY remaining_amount DESC, s.full_name ASC, s.id ASC`
    )
    .all();
}

function listBookStockSummary() {
  return db
    .prepare(
      `SELECT
        b.id,
        b.title,
        COALESCE(SUM(i.quantity), 0) AS total_quantity
       FROM books b
       LEFT JOIN inventory_stock i ON i.book_id = b.id
       GROUP BY b.id, b.title
       ORDER BY b.title ASC, b.id ASC`
    )
    .all();
}

function listRecentSales(limit = 20) {
  return db
    .prepare(
      `SELECT
        s.id,
        s.created_at,
        b.title AS book_title,
        s.quantity,
        s.total_amount,
        s.payment_method
       FROM sales s
       JOIN books b ON b.id = s.book_id
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT ?`
    )
    .all(limit);
}

module.exports = {
  getFinanceSummary,
  listStudentBalancesWithRemaining,
  listBookStockSummary,
  listRecentSales,
};
