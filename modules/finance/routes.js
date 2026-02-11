const express = require('express');
const repo = require('./repo');
const service = require('./service');
const { ROLES, requireRole } = require('../../core/auth');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

router.get('/', (req, res) => {
  const filters = {
    date_from: req.query.date_from || '',
    date_to: req.query.date_to || '',
    direction: req.query.direction || '',
    category_id: req.query.category_id || '',
    payment_method: req.query.payment_method || '',
    include_cancelled: req.query.include_cancelled === '1',
  };

  const transactions = repo.listTransactions(filters);
  const categories = repo.listCategories({ includeInactive: true });

  return res.render('finance/list', {
    title: 'Finance Ledger',
    filters,
    transactions,
    categories,
    directionValues: service.DIRECTION_VALUES,
    paymentMethodValues: service.PAYMENT_METHOD_VALUES,
    errors: [],
  });
});

router.get('/new', (req, res) => {
  const categories = repo.listCategories();

  return res.render('finance/new', {
    title: 'New Finance Transaction',
    categories,
    directionValues: service.DIRECTION_VALUES,
    paymentMethodValues: service.PAYMENT_METHOD_VALUES,
    errors: [],
    form: {
      direction: '',
      amount: '',
      currency: 'TRY',
      date: '',
      category_id: '',
      payment_method: '',
      note: '',
      ref_type: '',
      ref_id: '',
    },
  });
});

router.post('/', (req, res) => {
  const result = service.createTransaction(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('finance/new', {
      title: 'New Finance Transaction',
      categories: repo.listCategories(),
      directionValues: service.DIRECTION_VALUES,
      paymentMethodValues: service.PAYMENT_METHOD_VALUES,
      errors: result.errors,
      form: req.body,
    });
  }

  return res.redirect('/finance');
});

router.post('/:id/cancel', (req, res) => {
  const result = service.cancelTransaction(Number(req.params.id), req.body.cancel_reason, req.user);

  if (result.errors) {
    const filters = {
      date_from: req.query.date_from || '',
      date_to: req.query.date_to || '',
      direction: req.query.direction || '',
      category_id: req.query.category_id || '',
      payment_method: req.query.payment_method || '',
      include_cancelled: true,
    };

    return res.status(422).render('finance/list', {
      title: 'Finance Ledger',
      filters,
      transactions: repo.listTransactions(filters),
      categories: repo.listCategories({ includeInactive: true }),
      directionValues: service.DIRECTION_VALUES,
      paymentMethodValues: service.PAYMENT_METHOD_VALUES,
      errors: result.errors,
    });
  }

  return res.redirect('/finance?include_cancelled=1');
});

router.get('/categories', requireRole(ROLES.ADMIN), (req, res) => {
  return res.render('finance/categories', {
    title: 'Finance Categories',
    categories: repo.listCategories({ includeInactive: true }),
    errors: [],
  });
});

router.get('/categories/new', requireRole(ROLES.ADMIN), (req, res) => {
  return res.render('finance/category-new', {
    title: 'New Category',
    categories: repo.listCategories({ includeInactive: true }),
    directionValues: service.DIRECTION_VALUES,
    errors: [],
    form: {
      name: '',
      direction: '',
      parent_id: '',
    },
  });
});

router.post('/categories', requireRole(ROLES.ADMIN), (req, res) => {
  const result = service.createCategory(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('finance/category-new', {
      title: 'New Category',
      categories: repo.listCategories({ includeInactive: true }),
      directionValues: service.DIRECTION_VALUES,
      errors: result.errors,
      form: req.body,
    });
  }

  return res.redirect('/finance/categories');
});

module.exports = router;
