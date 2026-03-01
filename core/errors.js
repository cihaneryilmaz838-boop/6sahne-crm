class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  if (statusCode === 403 && err.details && err.details.code === 'CSRF_INVALID') {
    if (req.accepts('html')) {
      return res.status(403).send('<h1>403 Forbidden</h1><p>Security check failed. Please go back, refresh the page, and submit the form again.</p>');
    }

    return res.status(403).json({
      error: 'Security check failed. Please refresh and try again.',
      details: err.details,
    });
  }

  const message = statusCode >= 500 ? 'Internal Server Error' : err.message;

  return res.status(statusCode).json({
    error: message,
    details: err.details || null,
  });
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
};
