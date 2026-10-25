function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'An unexpected server error occurred.';

  if (error.name === 'MulterError') {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'An image exceeds the 5 MB upload limit.'
      : 'The uploaded files could not be accepted.';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed.';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'The supplied identifier or value is invalid.';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    message = `An account or record with this ${field} already exists.`;
  }

  if (statusCode >= 500) console.error(error);

  const response = { success: false, message };
  if (process.env.NODE_ENV !== 'production' && error.details) response.details = error.details;

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
