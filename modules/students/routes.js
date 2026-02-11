const express = require('express');
const { ROLES, requireRole } = require('../../core/auth');
const repo = require('./repo');
const service = require('./service');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

function defaultCreateForm() {
  return {
    full_name: '',
    birth_date: '',
    school: '',
    status: 'ACTIVE',
    first_registration_date: '',
    guardian1_name: '',
    guardian1_phone: '',
    guardian2_name: '',
    guardian2_phone: '',
    invoice_address: '',
    contact_preference: '',
    course_names: '',
    talent_notes: '',
    sports: '',
    allergy_notes: '',
    health_notes: '',
    meal_preference: '',
    total_fee: '',
    plan_type: 'CASH',
    installment_due_date_1: '',
    installment_due_date_2: '',
    installment_due_date_3: '',
    installment_due_date_4: '',
  };
}

router.get('/', (req, res) => {
  const search = String(req.query.search || '').trim();
  const students = repo.listStudents(search);

  return res.render('students/list', {
    title: 'Students',
    search,
    students,
  });
});

router.get('/new', (req, res) => {
  return res.render('students/new', {
    title: 'New Student',
    form: defaultCreateForm(),
    errors: [],
    statuses: service.STUDENT_STATUS,
    contactPreferences: service.CONTACT_PREFERENCES.filter(Boolean),
    planTypes: service.PLAN_TYPES,
  });
});

router.post('/', (req, res) => {
  const result = service.createStudent(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('students/new', {
      title: 'New Student',
      form: { ...defaultCreateForm(), ...req.body },
      errors: result.errors,
      statuses: service.STUDENT_STATUS,
      contactPreferences: service.CONTACT_PREFERENCES.filter(Boolean),
      planTypes: service.PLAN_TYPES,
    });
  }

  return res.redirect(`/students/${result.id}`);
});

router.get('/:id', (req, res) => {
  const studentId = Number(req.params.id);
  const detail = service.getStudentDetail(studentId);

  if (!detail) {
    return res.status(404).send('Student not found');
  }

  return res.render('students/detail', {
    title: `Student #${studentId}`,
    detail,
    categories: repo.listIncomeCategories(),
    paymentMethods: service.PAYMENT_METHOD_VALUES,
    paymentForm: {
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      category_id: '',
      payment_method: '',
      note: '',
    },
    errors: [],
  });
});

router.post('/:id/payment', (req, res) => {
  const studentId = Number(req.params.id);
  const result = service.createStudentPayment(studentId, req.body, req.user);

  if (result.errors) {
    const detail = service.getStudentDetail(studentId);
    if (!detail) {
      return res.status(404).send('Student not found');
    }

    return res.status(422).render('students/detail', {
      title: `Student #${studentId}`,
      detail,
      categories: repo.listIncomeCategories(),
      paymentMethods: service.PAYMENT_METHOD_VALUES,
      paymentForm: req.body,
      errors: result.errors,
    });
  }

  return res.redirect(`/students/${studentId}`);
});

module.exports = router;
