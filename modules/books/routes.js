const express = require('express');
const { ROLES, requireRole } = require('../../core/auth');
const repo = require('./repo');
const service = require('./service');

const router = express.Router();

router.use(requireRole(ROLES.STAFF, ROLES.ADMIN));

router.get('/', (req, res) => {
  const search = String(req.query.search || '').trim();
  const books = repo.listBooks(search);

  return res.render('books/list', {
    title: 'Books',
    search,
    books,
  });
});

router.get('/new', (req, res) => {
  return res.render('books/new', {
    title: 'New Book',
    form: service.defaultBookForm(),
    errors: [],
  });
});

router.post('/', (req, res) => {
  const result = service.createBook(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('books/new', {
      title: 'New Book',
      form: { ...service.defaultBookForm(), ...req.body },
      errors: result.errors,
    });
  }

  return res.redirect(`/books/${result.id}`);
});

router.get('/:id', (req, res) => {
  const bookId = Number(req.params.id);
  const book = repo.getBookById(bookId);

  if (!book) {
    return res.status(404).send('Book not found');
  }

  return res.render('books/detail', {
    title: `Book #${bookId}`,
    book,
    errors: [],
  });
});

router.post('/:id', (req, res) => {
  const bookId = Number(req.params.id);
  const result = service.updateBook(bookId, req.body, req.user);

  if (result.notFound) {
    return res.status(404).send('Book not found');
  }

  if (result.errors) {
    return res.status(422).render('books/detail', {
      title: `Book #${bookId}`,
      book: {
        id: bookId,
        ...req.body,
        is_active: req.body.is_active === '0' ? 0 : 1,
      },
      errors: result.errors,
    });
  }

  return res.redirect(`/books/${bookId}`);
});

module.exports = router;
