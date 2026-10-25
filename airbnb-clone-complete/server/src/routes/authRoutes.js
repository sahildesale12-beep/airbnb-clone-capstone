const express = require('express');
const passport = require('passport');
const { register, login, me, becomeHost, updateProfile, logout, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { registerValidation, loginValidation } = require('../validators/authValidators');
const { isGoogleConfigured } = require('../config/passport');

const router = express.Router();

function requireGoogleOAuth(_req, res, next) {
  if (!isGoogleConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Google login is not configured. Add Google OAuth credentials to server/.env.',
    });
  }
  return next();
}

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/me', protect, me);
router.post('/become-host', protect, becomeHost);
router.patch('/profile', protect, updateProfile);
router.post('/logout', logout);

// Optional Google OAuth. The express-session middleware stores the one-time OAuth state.
router.get(
  '/google',
  requireGoogleOAuth,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  requireGoogleOAuth,
  passport.authenticate('google', {
    failureRedirect: `${(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/login?error=google_auth_failed`,
    session: false,
  }),
  googleCallback
);

module.exports = router;
