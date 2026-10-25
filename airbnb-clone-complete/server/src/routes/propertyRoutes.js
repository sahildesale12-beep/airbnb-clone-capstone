const express = require('express');
const {
  getProperties,
  getProperty,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { createReview } = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { createPropertyValidation, updatePropertyValidation } = require('../validators/propertyValidators');
const { createReviewValidation } = require('../validators/reviewValidators');

const router = express.Router();

// Static paths must be declared before /:id.
router.get('/', getProperties);
router.get('/host/mine', protect, authorizeRoles('host', 'admin'), getMyProperties);
router.post('/', protect, authorizeRoles('host', 'admin'), createPropertyValidation, validateRequest, createProperty);
router.get('/:id', getProperty);
router.put('/:id', protect, authorizeRoles('host', 'admin'), updatePropertyValidation, validateRequest, updateProperty);
router.delete('/:id', protect, authorizeRoles('host', 'admin'), deleteProperty);
router.post('/:id/reviews', protect, createReviewValidation, validateRequest, createReview);

module.exports = router;
