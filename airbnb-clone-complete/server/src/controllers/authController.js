const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const createToken = require('../utils/createToken');

function cookieOptions() {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function sendAuthResponse(res, user, statusCode = 200) {
  const token = createToken(user._id);
  res.cookie('token', token, cookieOptions());
  return res.status(statusCode).json({
    success: true,
    message: 'Authentication successful.',
    token,
    user,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  // Never accept role from the client; new accounts always begin as guests.
  const user = await User.create({ name, email: normalizedEmail, password, role: 'guest' });
  return sendAuthResponse(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // Use the same error for unknown emails and wrong passwords.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  return sendAuthResponse(res, user);
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

const becomeHost = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'host') {
    req.user.role = 'host';
    await req.user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Your account can now manage property listings.',
    user: req.user,
  });
});


const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
      return res.status(422).json({ success: false, message: 'Name must contain 2 to 80 characters.' });
    }
    req.user.name = name.trim();
  }
  if (avatar !== undefined) {
    if (typeof avatar !== 'string' || avatar.length > 2000) {
      return res.status(422).json({ success: false, message: 'Avatar must be a URL string under 2000 characters.' });
    }
    req.user.avatar = avatar.trim();
  }
  await req.user.save();
  res.status(200).json({ success: true, message: 'Profile updated.', user: req.user });
});

const logout = asyncHandler(async (_req, res) => {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie('token', options);
  res.status(200).json({ success: true, message: 'You have been logged out.' });
});

function googleCallback(req, res) {
  const token = createToken(req.user._id);
  res.cookie('token', token, cookieOptions());
  const frontendURL = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.redirect(`${frontendURL}/auth/google/success`);
}

module.exports = { register, login, me, becomeHost, updateProfile, logout, googleCallback };
