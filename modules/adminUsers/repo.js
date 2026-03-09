const db = require('../../core/db');

function listUsers() {
  return db
    .prepare(
      `SELECT id, username, role, is_active, created_at
       FROM users
       ORDER BY id ASC`
    )
    .all();
}

function findUserById(id) {
  return db
    .prepare(
      `SELECT id, username, role, is_active, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`
    )
    .get(id);
}

function findUserByUsername(username) {
  return db
    .prepare(
      `SELECT id, username
       FROM users
       WHERE username = ?
       LIMIT 1`
    )
    .get(username);
}

function createUser({ username, role, is_active, password_hash, password_salt }) {
  const result = db
    .prepare(
      `INSERT INTO users (username, role, is_active, password_hash, password_salt)
       VALUES (@username, @role, @is_active, @password_hash, @password_salt)`
    )
    .run({ username, role, is_active, password_hash, password_salt });

  return Number(result.lastInsertRowid);
}

function updateUserRoleAndActive({ id, role, is_active }) {
  db
    .prepare(
      `UPDATE users
       SET role = @role,
           is_active = @is_active
       WHERE id = @id`
    )
    .run({ id, role, is_active });
}

function updateUserPassword({ id, password_hash, password_salt }) {
  db
    .prepare(
      `UPDATE users
       SET password_hash = @password_hash,
           password_salt = @password_salt
       WHERE id = @id`
    )
    .run({ id, password_hash, password_salt });
}

module.exports = {
  listUsers,
  findUserById,
  findUserByUsername,
  createUser,
  updateUserRoleAndActive,
  updateUserPassword,
};
