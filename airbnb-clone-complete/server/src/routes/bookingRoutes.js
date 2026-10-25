const express = require('express');
const {
  checkAvailability,
  createBooking,
  getMyBookings,
  getHostBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { createBookingValidation } = require('../validators/bookingValidators');

const router = express.Router();

router.get('/check-availability', checkAvailability);
router.get('/my', protect, getMyBookings);
router.get('/host', protect, authorizeRoles('host', 'admin'), getHostBookings);
router.post('/', protect, createBookingValidation, validateRequest, createBooking);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
