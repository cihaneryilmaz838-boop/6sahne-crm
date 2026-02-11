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
  const message = statusCode >= 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    error: message,
    details: err.details || null,
  });
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
};
