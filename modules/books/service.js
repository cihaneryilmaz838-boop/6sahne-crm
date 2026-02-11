const repo = require('./repo');
const { writeAuditLog } = require('../../core/audit');

function normalizeBookInput(body) {
  const data = {
    title: String(body.title || '').trim(),
    author: String(body.author || '').trim() || null,
    publisher: String(body.publisher || '').trim() || null,
    isbn: String(body.isbn || '').trim() || null,
    unit_price: Number(body.unit_price),
    is_active: body.is_active === '0' ? 0 : 1,
  };

  const errors = [];
  if (!data.title) {
    errors.push('Title is required.');
  }
  if (!Number.isInteger(data.unit_price) || data.unit_price < 0) {
    errors.push('Unit price must be an integer (kuruş) and cannot be negative.');
  }

  return { data, errors };
}

function defaultBookForm() {
  return {
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    unit_price: '',
    is_active: '1',
  };
}

function createBook(body, currentUser) {
  const { data, errors } = normalizeBookInput(body);
  if (errors.length > 0) {
    return { errors };
  }

  const id = repo.createBook(data);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'book',
    entityId: id,
    payload: data,
  });

  return { id };
}

function updateBook(bookId, body, currentUser) {
  const existing = repo.getBookById(bookId);
  if (!existing) {
    return { notFound: true };
  }

  const { data, errors } = normalizeBookInput(body);
  if (errors.length > 0) {
    return { errors };
  }

  repo.updateBook(bookId, data);

  writeAuditLog({
    actionType: 'UPDATE',
    actorUserId: currentUser.id,
    entityType: 'book',
    entityId: bookId,
    payload: {
      before: {
        title: existing.title,
        author: existing.author,
        publisher: existing.publisher,
        isbn: existing.isbn,
        unit_price: existing.unit_price,
        is_active: existing.is_active,
      },
      after: data,
    },
  });

  return { success: true };
}

module.exports = {
  createBook,
  updateBook,
  defaultBookForm,
};
