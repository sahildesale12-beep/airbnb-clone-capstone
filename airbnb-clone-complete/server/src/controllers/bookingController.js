const mongoose = require('mongoose');
const Stripe = require('stripe');
const Booking = require('../models/Booking');
const BookingDay = require('../models/BookingDay');
const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');
const expirePendingBookings = require('../utils/expirePendingBookings');
const { parseStay } = require('../utils/bookingDates');

const HOLD_MINUTES = 15;

function isActiveDayFilter(now = new Date()) {
  return {
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  };
}

const checkAvailability = asyncHandler(async (req, res) => {
  const { propertyId, checkIn, checkOut } = req.query;
  if (!propertyId || !mongoose.isValidObjectId(propertyId)) {
    return res.status(400).json({ success: false, message: 'A valid propertyId query parameter is required.' });
  }

  const property = await Property.findOne({ _id: propertyId, isPublished: true }).select('maxGuests');
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

  const stay = parseStay(checkIn, checkOut);
  const guests = req.query.guests === undefined ? 1 : Number(req.query.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 50) {
    return res.status(400).json({ success: false, message: 'guests must be an integer from 1 to 50.' });
  }

  await expirePendingBookings();
  const now = new Date();
  const occupied = await BookingDay.findOne({
    property: property._id,
    dateKey: { $in: stay.dateKeys },
    ...isActiveDayFilter(now),
  }).select('_id');

  const available = !occupied && guests <= property.maxGuests;
  res.status(200).json({
    success: true,
    available,
    nights: stay.nights,
    ...(guests > property.maxGuests ? { reason: `This property allows at most ${property.maxGuests} guests.` } : {}),
    ...(occupied ? { reason: 'The property is not available for all selected dates.' } : {}),
  });
});

const createBooking = asyncHandler(async (req, res) => {
  const { propertyId, checkIn: checkInValue, checkOut: checkOutValue, guests: guestsValue } = req.body;
  if (!propertyId || !mongoose.isValidObjectId(propertyId)) {
    return res.status(400).json({ success: false, message: 'A valid propertyId is required.' });
  }

  const property = await Property.findOne({ _id: propertyId, isPublished: true });
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
  if (property.host.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot book your own property.' });
  }

  const stay = parseStay(checkInValue, checkOutValue);
  const guests = Number(guestsValue);
  if (!Number.isInteger(guests) || guests < 1 || guests > property.maxGuests) {
    return res.status(400).json({
      success: false,
      message: `guests must be an integer from 1 to ${property.maxGuests}.`,
    });
  }

  await expirePendingBookings();
  const now = new Date();
  // Explicitly remove expired day locks. MongoDB TTL indexes run asynchronously.
  await BookingDay.deleteMany({
    property: property._id,
    dateKey: { $in: stay.dateKeys },
    expiresAt: { $lte: now },
  });

  // Ensure the unique property/date index is ready before reserving the nights.
  await BookingDay.init();

  const booking = await Booking.create({
    user: req.user._id,
    property: property._id,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests,
    totalPrice: Math.round(property.price * stay.nights * 100) / 100,
    paymentStatus: 'pending',
    status: 'pending',
    expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
  });

  try {
    // Unique property/date locks prevent overlapping holds even if two requests
    // arrive at the same time. If any night conflicts, rollback this whole hold.
    for (const dateKey of stay.dateKeys) {
      await BookingDay.create({
        property: property._id,
        booking: booking._id,
        dateKey,
        expiresAt: booking.expiresAt,
      });
    }
  } catch (error) {
    await BookingDay.deleteMany({ booking: booking._id });
    await Booking.deleteOne({ _id: booking._id });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'The property was just booked for one or more selected nights. Please choose different dates.',
      });
    }
    throw error;
  }

  const populated = await Booking.findById(booking._id)
    .populate('property', 'title images price location host')
    .populate('user', 'name email');

  res.status(201).json({
    success: true,
    message: `Dates held for ${HOLD_MINUTES} minutes. Complete payment in the payment step to confirm your booking.`,
    data: populated,
    priceBreakdown: {
      pricePerNight: property.price,
      nights: stay.nights,
      subtotal: property.price * stay.nights,
      serviceFee: 0,
      taxes: 0,
      total: property.price * stay.nights,
      currency: 'INR',
    },
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  await expirePendingBookings();
  const bookings = await Booking.find({ user: req.user._id })
    .populate({ path: 'property', select: 'title images price location host' })
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: bookings });
});

const getHostBookings = asyncHandler(async (req, res) => {
  await expirePendingBookings();
  const properties = await Property.find({ host: req.user._id }).select('_id');
  const ids = properties.map((property) => property._id);
  const bookings = await Booking.find({ property: { $in: ids } })
    .populate('user', 'name email avatar')
    .populate('property', 'title images location price')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: bookings });
});

const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only cancel your own bookings.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(200).json({ success: true, message: 'Booking is already cancelled.', data: booking });
  }
  if (booking.paymentStatus === 'paid') {
    if (process.env.STRIPE_SECRET_KEY && booking.stripeSessionId) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
      if (session.payment_intent) {
        await stripe.refunds.create({ payment_intent: session.payment_intent, reason: 'requested_by_customer' }, { idempotencyKey: `booking-cancel-refund-${booking._id}` });
      }
      booking.paymentStatus = 'refunded';
    } else if (process.env.NODE_ENV !== 'production') {
      // Development demo payments never charged money; mark a simulated refund.
      booking.paymentStatus = 'refunded';
    } else {
      return res.status(503).json({ success: false, message: 'Refund service is not configured. Contact the host/admin for help.' });
    }
  } else {
    booking.paymentStatus = 'failed';
  }

  booking.status = 'cancelled';
  booking.expiresAt = undefined;
  await booking.save();
  await BookingDay.deleteMany({ booking: booking._id });

  res.status(200).json({ success: true, message: booking.paymentStatus === 'refunded' ? 'Booking cancelled and refund processed (or simulated in development). Dates released.' : 'Booking cancelled and dates released.', data: booking });
});

module.exports = { checkAvailability, createBooking, getMyBookings, getHostBookings, cancelBooking };
