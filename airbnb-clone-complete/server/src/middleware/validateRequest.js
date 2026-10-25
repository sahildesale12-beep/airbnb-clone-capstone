const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(422).json({
    success: false,
    message: 'Please correct the invalid fields.',
    errors: result.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
    })),
  });
}

module.exports = validateRequest;
