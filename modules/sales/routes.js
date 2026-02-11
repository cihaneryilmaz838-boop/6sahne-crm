const express = require('express');
const { ROLES, requireRole } = require('../../core/auth');
const repo = require('./repo');
const service = require('./service');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

router.get('/new', (req, res) => {
  return res.render('sales/new', {
    title: 'New Sale',
    books: repo.listBooks().filter((book) => book.is_active),
    locations: repo.listLocations(),
    categories: repo.listIncomeCategories(),
    paymentMethods: service.PAYMENT_METHOD_VALUES,
    errors: [],
    form: service.defaultSaleForm(),
    savedSaleId: req.query.sale_id || null,
  });
});

router.post('/', (req, res) => {
  const result = service.createSale(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('sales/new', {
      title: 'New Sale',
      books: repo.listBooks().filter((book) => book.is_active),
      locations: repo.listLocations(),
      categories: repo.listIncomeCategories(),
      paymentMethods: service.PAYMENT_METHOD_VALUES,
      errors: result.errors,
      form: req.body,
      savedSaleId: null,
    });
  }

  return res.redirect(`/sales/new?sale_id=${result.saleId}`);
});

module.exports = router;
