// Wrap async route handlers so thrown/rejected errors reach Express error middleware.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
