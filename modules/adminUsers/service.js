const { ROLES } = require('../../core/auth');
const { hashPassword } = require('../../core/password');
const { writeAuditLog } = require('../../core/audit');
const repo = require('./repo');

const ALLOWED_ROLES = [ROLES.ADMIN, ROLES.STAFF, ROLES.PATRON];

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function normalizeActive(value) {
  return value ? 1 : 0;
}

function listUsers() {
  return repo.listUsers();
}

function getUserById(id) {
  return repo.findUserById(id);
}

function createUser(body, actorUser) {
  const payload = {
    username: String(body.username || '').trim(),
    password: String(body.password || ''),
    confirm_password: String(body.confirm_password || ''),
    role: normalizeRole(body.role),
    is_active: normalizeActive(body.is_active),
  };

  const errors = [];

  if (!payload.username) {
    errors.push('Username is required.');
  }
  if (!payload.password) {
    errors.push('Password is required.');
  }
  if (payload.password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (payload.password !== payload.confirm_password) {
    errors.push('Password confirmation does not match.');
  }
  if (!ALLOWED_ROLES.includes(payload.role)) {
    errors.push('Role must be ADMIN, STAFF, or PATRON.');
  }
  if (payload.username && repo.findUserByUsername(payload.username)) {
    errors.push('Username is already taken.');
  }

  if (errors.length > 0) {
    return { errors };
  }

  const securePassword = hashPassword(payload.password);
  const userId = repo.createUser({
    username: payload.username,
    role: payload.role,
    is_active: payload.is_active,
    password_hash: securePassword.hash,
    password_salt: securePassword.salt,
  });

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: actorUser.id,
    entityType: 'user',
    entityId: userId,
  });

  return { success: true, id: userId };
}

function updateUser(id, body, actorUser) {
  const targetUser = repo.findUserById(id);
  if (!targetUser) {
    return { notFound: true };
  }

  const role = normalizeRole(body.role);
  const isActive = normalizeActive(body.is_active);
  const errors = [];

  if (!ALLOWED_ROLES.includes(role)) {
    errors.push('Role must be ADMIN, STAFF, or PATRON.');
  }

  if (Number(actorUser.id) === Number(id) && isActive === 0) {
    errors.push('You cannot deactivate your own account.');
  }

  if (errors.length > 0) {
    return { errors, user: targetUser };
  }

  repo.updateUserRoleAndActive({
    id,
    role,
    is_active: isActive,
  });

  if (Number(actorUser.id) === Number(id)) {
    actorUser.role = role;
  }

  writeAuditLog({
    actionType: 'UPDATE',
    actorUserId: actorUser.id,
    entityType: 'user',
    entityId: id,
  });

  return { success: true };
}

function resetPassword(id, body, actorUser) {
  const targetUser = repo.findUserById(id);
  if (!targetUser) {
    return { notFound: true };
  }

  const newPassword = String(body.new_password || '');
  const confirmNewPassword = String(body.confirm_new_password || '');
  const errors = [];

  if (!newPassword) {
    errors.push('New password is required.');
  }
  if (newPassword.length < 8) {
    errors.push('New password must be at least 8 characters.');
  }
  if (newPassword !== confirmNewPassword) {
    errors.push('Password confirmation does not match.');
  }

  if (errors.length > 0) {
    return { errors, user: targetUser };
  }

  const securePassword = hashPassword(newPassword);
  repo.updateUserPassword({
    id,
    password_hash: securePassword.hash,
    password_salt: securePassword.salt,
  });

  writeAuditLog({
    actionType: 'UPDATE',
    actorUserId: actorUser.id,
    entityType: 'user',
    entityId: id,
    reason: 'admin_password_reset',
  });

  return { success: true };
}

module.exports = {
  ALLOWED_ROLES,
  listUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
};
