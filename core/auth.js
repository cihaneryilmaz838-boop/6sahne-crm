const { AppError } = require('./errors');

const ROLES = Object.freeze({
  PATRON: 'Patron',
  STAFF: 'Staff',
  ADMIN: 'Admin',
});

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return next(new AppError('Unauthorized', 401));
  }
  req.user = req.session.user;
  return next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
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
