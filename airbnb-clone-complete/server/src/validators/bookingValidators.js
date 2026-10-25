const { body } = require('express-validator');

const createBookingValidation = [
  body('propertyId').isMongoId().withMessage('propertyId must be a valid property ID.'),
  body('checkIn').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('checkIn must use YYYY-MM-DD format.'),
  body('checkOut').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('checkOut must use YYYY-MM-DD format.'),
  body('guests').isInt({ min: 1, max: 50 }).withMessage('guests must be an integer from 1 to 50.'),
];

module.exports = { createBookingValidation };
