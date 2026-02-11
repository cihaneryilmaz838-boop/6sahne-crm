const express = require('express');
const { ROLES, requireRole } = require('../../core/auth');
const repo = require('./repo');
const service = require('./service');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

router.get('/', (req, res) => {
  const books = repo.listBooks();
  const selectedBookId = Number(req.query.book_id) || (books[0] ? books[0].id : null);
  const selectedBook = selectedBookId ? repo.getBookById(selectedBookId) : null;
  const stockByLocation = selectedBookId ? repo.listStockByBookId(selectedBookId) : [];

  return res.render('inventory/index', {
    title: 'Inventory',
    books,
    selectedBookId,
    selectedBook,
    stockByLocation,
  });
});

router.get('/move', (req, res) => {
  return res.render('inventory/move', {
    title: 'Move Stock',
    books: repo.listBooks().filter((book) => book.is_active),
    locations: repo.listLocations(),
    form: service.defaultMoveForm(),
    errors: [],
  });
});

router.post('/move', (req, res) => {
  const result = service.moveStock(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('inventory/move', {
      title: 'Move Stock',
      books: repo.listBooks().filter((book) => book.is_active),
      locations: repo.listLocations(),
      form: req.body,
      errors: result.errors,
    });
  }

  return res.redirect(`/inventory?book_id=${req.body.book_id}`);
});

router.get('/locations', (req, res) => {
  return res.render('inventory/locations', {
    title: 'Locations',
    locations: repo.listLocations(),
    errors: [],
    form: { name: '' },
  });
});

router.post('/locations', (req, res) => {
  const result = service.createLocation(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('inventory/locations', {
      title: 'Locations',
      locations: repo.listLocations(),
      errors: result.errors,
      form: req.body,
    });
  }

  return res.redirect('/inventory/locations');
});

module.exports = router;
