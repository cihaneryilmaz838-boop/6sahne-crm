const repo = require('./repo');
const { writeAuditLog } = require('../../core/audit');

const STUDENT_STATUS = ['ACTIVE', 'INACTIVE'];
const CONTACT_PREFERENCES = ['', 'WHATSAPP', 'CALL'];
const PLAN_TYPES = ['CASH', 'INST_2', 'INST_3', 'INST_4'];
const PAYMENT_METHOD_VALUES = ['CASH', 'TRANSFER', 'CARD'];

function installmentCountForPlanType(planType) {
  switch (planType) {
    case 'INST_2':
      return 2;
    case 'INST_3':
      return 3;
    case 'INST_4':
      return 4;
    case 'CASH':
    default:
      return 0;
  }
}

function parseCourses(raw) {
  return String(raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStudentCreateInput(body, currentUser) {
  const student = {
    full_name: String(body.full_name || '').trim(),
    birth_date: String(body.birth_date || '').trim() || null,
    school: String(body.school || '').trim() || null,
    status: String(body.status || 'ACTIVE').toUpperCase(),
    first_registration_date: String(body.first_registration_date || '').trim(),
    guardian1_name: String(body.guardian1_name || '').trim() || null,
    guardian1_phone: String(body.guardian1_phone || '').trim(),
    guardian2_name: String(body.guardian2_name || '').trim() || null,
    guardian2_phone: String(body.guardian2_phone || '').trim() || null,
    invoice_address: String(body.invoice_address || '').trim() || null,
    contact_preference: String(body.contact_preference || '').toUpperCase(),
    talent_notes: String(body.talent_notes || '').trim() || null,
    sports: String(body.sports || '').trim() || null,
    allergy_notes: String(body.allergy_notes || '').trim() || null,
    health_notes: String(body.health_notes || '').trim() || null,
    meal_preference: String(body.meal_preference || '').trim() || null,
  };

  if (!student.contact_preference) {
    student.contact_preference = null;
  }

  const paymentPlan = {
    total_fee: Number(body.total_fee),
    plan_type: String(body.plan_type || '').toUpperCase(),
  };

  const requestedInstallmentCount = installmentCountForPlanType(paymentPlan.plan_type);
  const dueDates = [];
  for (let i = 1; i <= 4; i += 1) {
    const value = String(body[`installment_due_date_${i}`] || '').trim();
    if (value) {
      dueDates.push(value);
    }
  }

  const courses = parseCourses(body.course_names);

  const errors = [];
  if (!student.full_name) {
    errors.push('Full name is required.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(student.first_registration_date)) {
    errors.push('First registration date must be YYYY-MM-DD.');
  }
  if (student.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(student.birth_date)) {
    errors.push('Birth date must be YYYY-MM-DD.');
  }
  if (!STUDENT_STATUS.includes(student.status)) {
    errors.push('Status must be ACTIVE or INACTIVE.');
  }
  if (!student.guardian1_phone) {
    errors.push('Guardian 1 phone is required.');
  }
  if (!CONTACT_PREFERENCES.includes(student.contact_preference || '')) {
    errors.push('Contact preference must be WHATSAPP or CALL if set.');
  }
  if (!Number.isInteger(paymentPlan.total_fee) || paymentPlan.total_fee < 0) {
    errors.push('Total fee must be a non-negative integer (kuruş).');
  }
  if (!PLAN_TYPES.includes(paymentPlan.plan_type)) {
    errors.push('Plan type must be CASH, INST_2, INST_3, or INST_4.');
  }

  dueDates.forEach((dueDate, idx) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      errors.push(`Installment #${idx + 1} due date must be YYYY-MM-DD.`);
    }
  });

  if (paymentPlan.plan_type === 'CASH') {
    if (dueDates.length > 1) {
      errors.push('CASH plan can have at most one due date.');
    }
  } else if (requestedInstallmentCount !== dueDates.length) {
    errors.push(`Plan ${paymentPlan.plan_type} requires exactly ${requestedInstallmentCount} due dates.`);
  }

  return {
    payload: {
      student,
      courses,
      paymentPlan,
      installments: dueDates,
      actorUserId: currentUser.id,
    },
    errors,
  };
}

function createStudent(body, currentUser) {
  const { payload, errors } = normalizeStudentCreateInput(body, currentUser);
  if (errors.length > 0) {
    return { errors };
  }

  const created = repo.createStudentWithPlan(payload);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'student',
    entityId: created.studentId,
    payload: {
      student: payload.student,
      courses: payload.courses,
      paymentPlan: payload.paymentPlan,
      installments: payload.installments,
    },
  });

  return { id: created.studentId };
}

function getStudentDetail(studentId) {
  const student = repo.getStudentById(studentId);
  if (!student) {
    return null;
  }

  const courses = repo.getStudentCourses(studentId);
  const paymentPlan = repo.getPaymentPlanByStudentId(studentId);
  const installments = paymentPlan ? repo.getInstallmentsByPlanId(paymentPlan.id) : [];
  const payments = repo.getStudentPaymentTransactions(studentId);

  const paidAmount = payments.reduce((sum, tx) => sum + tx.amount, 0);
  const totalFee = paymentPlan ? paymentPlan.total_fee : 0;
  const remaining = totalFee - paidAmount;

  const installmentSchedule = buildInstallmentSchedule(installments, totalFee, paidAmount);

  return {
    student,
    courses,
    paymentPlan,
    payments,
    summary: {
      totalFee,
      paidAmount,
      remaining,
      isOverpaid: remaining < 0,
    },
    installmentSchedule,
  };
}

function buildInstallmentSchedule(installments, totalFee, paidAmount) {
  if (!installments.length) {
    return [];
  }

  const installmentCount = installments.length;
  const baseAmount = Math.floor(totalFee / installmentCount);
  const remainder = totalFee % installmentCount;

  let remainingPaid = paidAmount;
  const today = new Date().toISOString().slice(0, 10);

  return installments
    .slice()
    .sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
    .map((inst, idx) => {
      const installmentAmount = baseAmount + (idx < remainder ? 1 : 0);
      const coveredAmount = Math.min(installmentAmount, Math.max(remainingPaid, 0));
      remainingPaid -= coveredAmount;
      const unpaidAmount = installmentAmount - coveredAmount;
      const isOverdue = inst.due_date < today && unpaidAmount > 0;

      return {
        ...inst,
        installmentAmount,
        coveredAmount,
        unpaidAmount,
        isOverdue,
      };
    });
}

function createStudentPayment(studentId, body, currentUser) {
  const student = repo.getStudentById(studentId);
  if (!student) {
    return { errors: ['Student not found.'] };
  }

  const payload = {
    amount: Number(body.amount),
    date: String(body.date || '').trim(),
    category_id: Number(body.category_id),
    payment_method: String(body.payment_method || '').toUpperCase(),
    note: String(body.note || '').trim() || null,
    ref_id: studentId,
    created_by: currentUser.id,
    updated_by: currentUser.id,
  };

  const errors = [];
  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    errors.push('Amount must be a positive integer (kuruş).');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    errors.push('Date must be YYYY-MM-DD.');
  }
  if (!PAYMENT_METHOD_VALUES.includes(payload.payment_method)) {
    errors.push('Payment method must be CASH, TRANSFER, or CARD.');
  }

  const category = repo.getCategoryById(payload.category_id);
  if (!category || !category.is_active) {
    errors.push('Selected category is not active.');
  } else if (category.direction !== 'IN') {
    errors.push('Selected category must be an IN category.');
  }

  if (errors.length > 0) {
    return { errors };
  }

  const txId = repo.createStudentPaymentTransaction(payload);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'finance_tx',
    entityId: txId,
    payload: { ...payload, direction: 'IN', ref_type: 'student' },
  });

  return { success: true };
}

module.exports = {
  STUDENT_STATUS,
  CONTACT_PREFERENCES,
  PLAN_TYPES,
  PAYMENT_METHOD_VALUES,
  installmentCountForPlanType,
  createStudent,
  getStudentDetail,
  createStudentPayment,
};
