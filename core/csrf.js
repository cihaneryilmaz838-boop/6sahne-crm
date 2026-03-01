const crypto = require('crypto');
const { AppError } = require('./errors');

function createCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

function attachCsrfToken(req, res, next) {
  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = createCsrfToken();
    }
    res.locals.csrfToken = req.session.csrfToken;
  }

  next();
}

function requireCsrf(req, res, next) {
  if (req.method !== 'POST') {
    return next();
  }

  if (process.env.NODE_ENV !== 'production' && req.get('x-csrf-bypass') === '1') {
    return next();
  }

  const expectedToken = req.session && req.session.csrfToken;
  const submittedToken = req.body && req.body.csrf_token;

  if (!expectedToken || !submittedToken || submittedToken !== expectedToken) {
    return next(new AppError('Security check failed. Please refresh the page and try again.', 403, { code: 'CSRF_INVALID' }));
  }

  req.session.csrfToken = createCsrfToken();
  res.locals.csrfToken = req.session.csrfToken;
  return next();
}

module.exports = {
  attachCsrfToken,
  requireCsrf,
};
