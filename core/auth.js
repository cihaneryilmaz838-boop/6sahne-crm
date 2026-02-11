const ROLES = {
  PATRON: 1,
  STAFF: 2,
  ADMIN: 3,
};

function normalizeRole(raw) {
  const normalized = String(raw || '').trim().toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'STAFF' || normalized === 'PATRON') {
    return normalized;
  }
  return 'STAFF';
}

function attachCurrentUser(req, res, next) {
  const role = normalizeRole(req.query.role || req.headers['x-user-role']);
  const idByRole = { ADMIN: 1, STAFF: 2, PATRON: 3 };

  req.currentUser = {
    id: idByRole[role],
    username: role.toLowerCase(),
    role,
  };

  res.locals.currentUser = req.currentUser;
  next();
}

function requireRole(minRole) {
  return (req, res, next) => {
    const userRoleRank = ROLES[req.currentUser.role] || 0;
    const minRoleRank = ROLES[minRole] || Number.MAX_SAFE_INTEGER;

    if (userRoleRank < minRoleRank) {
      return res.status(403).send('<h1>403 Forbidden</h1><p>You do not have permission for this page.</p>');
    }

    return next();
  };
}

module.exports = {
  attachCurrentUser,
  requireRole,
  ROLES,
};
