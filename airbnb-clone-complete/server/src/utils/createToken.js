const jwt = require('jsonwebtoken');

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'airbnb-clone-api',
    audience: 'airbnb-clone-client',
  });
}

module.exports = createToken;
