const db = require('../../core/db');

function listBooks(search = '') {
  const query = String(search || '').trim();

  if (!query) {
    return db
      .prepare(
        `SELECT *
         FROM books
         ORDER BY created_at DESC, id DESC`
      )
      .all();
  }

  const like = `%${query}%`;
  return db
    .prepare(
      `SELECT *
       FROM books
       WHERE title LIKE ? OR author LIKE ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(like, like);
}

function getBookById(bookId) {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
}

function createBook(book) {
  const result = db
    .prepare(
      `INSERT INTO books (title, author, publisher, isbn, unit_price, is_active)
       VALUES (@title, @author, @publisher, @isbn, @unit_price, @is_active)`
    )
    .run(book);

  return Number(result.lastInsertRowid);
}

function updateBook(bookId, book) {
  db.prepare(
    `UPDATE books
     SET title = @title,
         author = @author,
         publisher = @publisher,
         isbn = @isbn,
         unit_price = @unit_price,
         is_active = @is_active,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id: bookId,
    ...book,
  });
}

module.exports = {
  listBooks,
  getBookById,
  createBook,
  updateBook,
};
