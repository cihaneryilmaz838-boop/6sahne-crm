const express = require('express');
const { ROLES, requireRole } = require('../../core/auth');
const repo = require('./repo');
const service = require('./service');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

function pullFlash(req) {
  const flash = req.session.flash || null;
  req.session.flash = null;
  return flash;
}

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

router.get('/', (req, res) => {
  return res.render('sales/index', {
    title: 'Sales',
    sales: service.listSales(),
    flash: pullFlash(req),
  });
});

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

router.post('/:id/cancel', (req, res) => {
  const result = service.cancelSale(req.params.id, req.body.cancel_reason, req.user);

  if (result.errors) {
    setFlash(req, 'error', result.errors[0]);
    return res.redirect('/sales');
  }

  if (result.warning) {
    setFlash(req, 'warning', result.warning);
    return res.redirect('/sales');
  }

  setFlash(req, 'success', `Sale #${result.saleId} cancelled successfully.`);
  return res.redirect('/sales');
});

module.exports = router;
