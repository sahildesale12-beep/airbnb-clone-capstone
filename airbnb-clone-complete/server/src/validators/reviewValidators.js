const { body } = require('express-validator');

const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be an integer from 1 to 5.'),
  body('comment').isString().trim().isLength({ min: 3, max: 1500 }).withMessage('comment must contain 3 to 1500 characters.'),
];

module.exports = { createReviewValidation };
