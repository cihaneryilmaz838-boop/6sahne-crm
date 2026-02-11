const db = require('../../core/db');

function listStudents(search = '') {
  const q = String(search || '').trim();
  if (!q) {
    return db
      .prepare(
        `SELECT *
         FROM students
         ORDER BY created_at DESC, id DESC`
      )
      .all();
  }

  const like = `%${q}%`;
  return db
    .prepare(
      `SELECT *
       FROM students
       WHERE full_name LIKE ? OR guardian1_phone LIKE ? OR guardian2_phone LIKE ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(like, like, like);
}

function getStudentById(id) {
  return db.prepare('SELECT * FROM students WHERE id = ?').get(id);
}

function getStudentCourses(studentId) {
  return db
    .prepare('SELECT * FROM student_courses WHERE student_id = ? ORDER BY course_name ASC')
    .all(studentId);
}

function getPaymentPlanByStudentId(studentId) {
  return db.prepare('SELECT * FROM student_payment_plans WHERE student_id = ?').get(studentId);
}

function getInstallmentsByPlanId(planId) {
  return db
    .prepare('SELECT * FROM student_installments WHERE payment_plan_id = ? ORDER BY installment_order ASC')
    .all(planId);
}

function getStudentPaymentTransactions(studentId) {
  return db
    .prepare(
      `SELECT ft.*, c.name AS category_name
       FROM finance_transactions ft
       JOIN categories c ON c.id = ft.category_id
       WHERE ft.direction = 'IN'
         AND ft.ref_type = 'student'
         AND ft.ref_id = ?
         AND ft.is_cancelled = 0
       ORDER BY ft.date ASC, ft.id ASC`
    )
    .all(studentId);
}

function createStudentWithPlan({ student, courses, paymentPlan, installments }) {
  const tx = db.transaction(() => {
    const studentResult = db
      .prepare(
        `INSERT INTO students (
          full_name, birth_date, school, status, first_registration_date,
          guardian1_name, guardian1_phone, guardian2_name, guardian2_phone,
          invoice_address, contact_preference, talent_notes, sports,
          allergy_notes, health_notes, meal_preference
        ) VALUES (
          @full_name, @birth_date, @school, @status, @first_registration_date,
          @guardian1_name, @guardian1_phone, @guardian2_name, @guardian2_phone,
          @invoice_address, @contact_preference, @talent_notes, @sports,
          @allergy_notes, @health_notes, @meal_preference
        )`
      )
      .run(student);

    const studentId = Number(studentResult.lastInsertRowid);

    const insertCourse = db.prepare(
      'INSERT INTO student_courses (student_id, course_name) VALUES (?, ?)'
    );
    for (const courseName of courses) {
      insertCourse.run(studentId, courseName);
    }

    const planResult = db
      .prepare(
        `INSERT INTO student_payment_plans (student_id, total_fee, plan_type)
         VALUES (@student_id, @total_fee, @plan_type)`
      )
      .run({
        student_id: studentId,
        total_fee: paymentPlan.total_fee,
        plan_type: paymentPlan.plan_type,
      });

    const paymentPlanId = Number(planResult.lastInsertRowid);

    const insertInstallment = db.prepare(
      `INSERT INTO student_installments (payment_plan_id, due_date, installment_order)
       VALUES (?, ?, ?)`
    );

    installments.forEach((dueDate, index) => {
      insertInstallment.run(paymentPlanId, dueDate, index + 1);
    });

    return { studentId, paymentPlanId };
  });

  return tx();
}

function createStudentPaymentTransaction(payload) {
  const result = db
    .prepare(
      `INSERT INTO finance_transactions
      (direction, amount, currency, date, category_id, payment_method, note, ref_type, ref_id, created_by, updated_by)
      VALUES
      ('IN', @amount, 'TRY', @date, @category_id, @payment_method, @note, 'student', @ref_id, @created_by, @updated_by)`
    )
    .run(payload);

  return Number(result.lastInsertRowid);
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function listIncomeCategories() {
  return db
    .prepare("SELECT * FROM categories WHERE direction = 'IN' AND is_active = 1 ORDER BY name ASC")
    .all();
}

module.exports = {
  listStudents,
  getStudentById,
  getStudentCourses,
  getPaymentPlanByStudentId,
  getInstallmentsByPlanId,
  getStudentPaymentTransactions,
  createStudentWithPlan,
  createStudentPaymentTransaction,
  getCategoryById,
  listIncomeCategories,
};
