const { AppError } = require('./errors');

const ROLES = Object.freeze({
  PATRON: 'PATRON',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
});

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return next(new AppError('Unauthorized', 401));
  }

  req.user = {
    ...req.session.user,
    role: normalizeRole(req.session.user.role),
  };
  req.session.user.role = req.user.role;
  return next();
}

function requireRole(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const currentRole = normalizeRole(req.user.role);
    if (!normalizedAllowedRoles.includes(currentRole)) {
      return next(new AppError('Forbidden', 403));
    }

    return next();
  };
}

module.exports = {
  ROLES,
  requireAuth,
  requireRole,
};
