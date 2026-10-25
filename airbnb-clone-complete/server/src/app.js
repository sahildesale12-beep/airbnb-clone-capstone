const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { stripeWebhook } = require('./controllers/paymentController');
const { configurePassport } = require('./config/passport');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by the CORS policy.'));
  },
  credentials: true,
}));

// Stripe needs the raw request body to validate webhook signatures. Keep this before express.json().
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// OAuth state session; the application itself uses JWTs.
app.use(session({
  name: 'staybnb.oauth.sid',
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'development-only-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ client: mongoose.connection.getClient(), collectionName: 'sessions', ttl: 10 * 60 }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge: 10 * 60 * 1000,
  },
}));

configurePassport(passport);
app.use(passport.initialize());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

app.use('/uploads', express.static(path.resolve(__dirname, '../public/uploads'), { maxAge: '1d' }));
app.get('/', (_req, res) => res.json({ success: true, message: 'Airbnb Clone API is running.', version: '1.0.0' }));
app.get('/api/health', (_req, res) => res.status(200).json({ success: true, service: 'airbnb-clone-api', status: 'ok' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
