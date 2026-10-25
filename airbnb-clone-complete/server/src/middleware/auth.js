const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  const token = bearerToken || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'airbnb-clone-api',
      audience: 'airbnb-clone-client',
    });
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Your session is invalid or has expired. Please log in again.' });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ success: false, message: 'The account for this session no longer exists.' });
  }

  req.user = user;
  next();
});

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication is required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { protect, authorizeRoles };
