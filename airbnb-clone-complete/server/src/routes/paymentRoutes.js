const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createCheckoutSession,
  confirmCheckoutSession,
  demoConfirm,
} = require('../controllers/paymentController');

const router = express.Router();
router.post('/create-checkout-session', protect, createCheckoutSession);
router.get('/confirm-session', protect, confirmCheckoutSession);
router.post('/demo-confirm', protect, demoConfirm);
module.exports = router;
