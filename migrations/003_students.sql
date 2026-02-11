CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  birth_date TEXT,
  school TEXT,
  status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  first_registration_date TEXT NOT NULL,
  guardian1_name TEXT,
  guardian1_phone TEXT NOT NULL,
  guardian2_name TEXT,
  guardian2_phone TEXT,
  invoice_address TEXT,
  contact_preference TEXT,
  talent_notes TEXT,
  sports TEXT,
  allergy_notes TEXT,
  health_notes TEXT,
  meal_preference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_students_full_name ON students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_guardian1_phone ON students(guardian1_phone);
CREATE INDEX IF NOT EXISTS idx_students_guardian2_phone ON students(guardian2_phone);

CREATE TABLE IF NOT EXISTS student_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_courses_student_id ON student_courses(student_id);

CREATE TABLE IF NOT EXISTS student_payment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  total_fee INTEGER NOT NULL CHECK(total_fee >= 0),
  plan_type TEXT NOT NULL CHECK(plan_type IN ('CASH', 'INST_2', 'INST_3', 'INST_4')),
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_payment_plans_student_id ON student_payment_plans(student_id);

CREATE TABLE IF NOT EXISTS student_installments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_plan_id INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  installment_order INTEGER NOT NULL CHECK(installment_order >= 1),
  FOREIGN KEY(payment_plan_id) REFERENCES student_payment_plans(id) ON DELETE CASCADE,
  UNIQUE(payment_plan_id, installment_order)
);

CREATE INDEX IF NOT EXISTS idx_student_installments_payment_plan_id ON student_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_student_installments_due_date ON student_installments(due_date);
