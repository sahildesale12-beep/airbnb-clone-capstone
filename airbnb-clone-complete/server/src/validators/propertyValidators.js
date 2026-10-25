const { body } = require('express-validator');

const createPropertyValidation = [
  body('title').isString().trim().isLength({ min: 8, max: 120 }).withMessage('Title must contain 8 to 120 characters.'),
  body('description').isString().trim().isLength({ min: 20, max: 6000 }).withMessage('Description must contain 20 to 6000 characters.'),
  body('price').isFloat({ min: 1, max: 10000000 }).withMessage('Price must be at least ₹1.'),
  body('location').isObject().withMessage('location must be an object.'),
  body('location.city').isString().trim().notEmpty().withMessage('City is required.'),
  body('location.state').isString().trim().notEmpty().withMessage('State is required.'),
  body('location.country').optional().isString().trim().notEmpty().withMessage('Country cannot be empty.'),
  body('location.lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
  body('location.lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
  body('category').isString().trim().notEmpty().withMessage('Category is required.'),
  body('propertyType').optional().isIn(['home', 'apartment', 'guesthouse', 'hotel', 'unique-stay', 'villa', 'cabin']).withMessage('Invalid propertyType.'),
  body('images').optional().isArray({ max: 20 }).withMessage('images must be an array of at most 20 image URLs.'),
  body('images.*').optional().isString().isLength({ max: 2000 }).withMessage('Each image must be a URL string.'),
  body('amenities').optional().isArray({ max: 50 }).withMessage('amenities must be an array with at most 50 entries.'),
  body('amenities.*').optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage('Each amenity must contain 1 to 80 characters.'),
  body('maxGuests').isInt({ min: 1, max: 50 }).withMessage('maxGuests must be between 1 and 50.'),
  body('bedrooms').optional().isInt({ min: 0, max: 50 }).withMessage('bedrooms must be between 0 and 50.'),
  body('beds').optional().isInt({ min: 1, max: 100 }).withMessage('beds must be between 1 and 100.'),
  body('baths').optional().isFloat({ min: 0, max: 50 }).withMessage('baths must be between 0 and 50.'),
];

const updatePropertyValidation = [
  body('title').optional().isString().trim().isLength({ min: 8, max: 120 }).withMessage('Title must contain 8 to 120 characters.'),
  body('description').optional().isString().trim().isLength({ min: 20, max: 6000 }).withMessage('Description must contain 20 to 6000 characters.'),
  body('price').optional().isFloat({ min: 1, max: 10000000 }).withMessage('Price must be at least ₹1.'),
  body('location').optional().isObject().withMessage('location must be an object.'),
  body('location.city').optional().isString().trim().notEmpty().withMessage('City cannot be empty.'),
  body('location.state').optional().isString().trim().notEmpty().withMessage('State cannot be empty.'),
  body('location.country').optional().isString().trim().notEmpty().withMessage('Country cannot be empty.'),
  body('location.lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
  body('location.lng').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
  body('category').optional().isString().trim().notEmpty().withMessage('Category cannot be empty.'),
  body('propertyType').optional().isIn(['home', 'apartment', 'guesthouse', 'hotel', 'unique-stay', 'villa', 'cabin']).withMessage('Invalid propertyType.'),
  body('images').optional().isArray({ max: 20 }).withMessage('images must be an array of at most 20 image URLs.'),
  body('images.*').optional().isString().isLength({ max: 2000 }).withMessage('Each image must be a URL string.'),
  body('amenities').optional().isArray({ max: 50 }).withMessage('amenities must be an array with at most 50 entries.'),
  body('amenities.*').optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage('Each amenity must contain 1 to 80 characters.'),
  body('maxGuests').optional().isInt({ min: 1, max: 50 }).withMessage('maxGuests must be between 1 and 50.'),
  body('bedrooms').optional().isInt({ min: 0, max: 50 }).withMessage('bedrooms must be between 0 and 50.'),
  body('beds').optional().isInt({ min: 1, max: 100 }).withMessage('beds must be between 1 and 100.'),
  body('baths').optional().isFloat({ min: 0, max: 50 }).withMessage('baths must be between 0 and 50.'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be true or false.'),
];

module.exports = { createPropertyValidation, updatePropertyValidation };
