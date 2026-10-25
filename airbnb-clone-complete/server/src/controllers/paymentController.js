const mongoose = require('mongoose');
const Stripe = require('stripe');
const Booking = require('../models/Booking');
const BookingDay = require('../models/BookingDay');
const asyncHandler = require('../utils/asyncHandler');

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

async function markBookingPaid(booking) {
  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.expiresAt = undefined;
  await booking.save();
  await BookingDay.updateMany({ booking: booking._id }, { $unset: { expiresAt: 1 } });
  return booking;
}

const createCheckoutSession = asyncHandler(async (req, res) => {
  const bookingId = req.body.bookingId;
  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({ success: false, message: 'A valid bookingId is required.' });
  }

  const booking = await Booking.findById(bookingId).populate('property', 'title images location price');
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only pay for your own booking.' });
  }
  if (booking.paymentStatus === 'paid' && booking.status === 'confirmed') {
    return res.status(200).json({ success: true, alreadyPaid: true, url: `${frontendUrl()}/booking-confirmation/${booking._id}` });
  }
  if (booking.status !== 'pending' || (booking.expiresAt && booking.expiresAt <= new Date())) {
    return res.status(409).json({ success: false, message: 'This booking hold has expired or is no longer payable. Please reserve again.' });
  }

  const stripe = getStripe();
  if (!stripe) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, message: 'Stripe is not configured. Set STRIPE_SECRET_KEY before accepting payments.' });
    }
    // Explicit development-only simulation so the capstone can be demonstrated without payment credentials.
    return res.status(200).json({
      success: true,
      demo: true,
      message: 'Stripe credentials are not configured; this is a development-only simulated checkout.',
      url: `${frontendUrl()}/booking-confirmation/${booking._id}?demo=1`,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'inr',
        unit_amount: Math.round(booking.totalPrice * 100),
        product_data: {
          name: booking.property?.title || 'Accommodation booking',
          description: `Stay from ${booking.checkIn.toISOString().slice(0, 10)} to ${booking.checkOut.toISOString().slice(0, 10)}`,
          ...(booking.property?.images?.[0] ? { images: [booking.property.images[0]] } : {}),
        },
      },
    }],
    metadata: { bookingId: booking._id.toString(), userId: req.user._id.toString() },
    success_url: `${frontendUrl()}/booking-confirmation/${booking._id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl()}/checkout-cancelled/${booking._id}`,
  });

  booking.stripeSessionId = session.id;
  await booking.save();
  res.status(200).json({ success: true, demo: false, url: session.url, sessionId: session.id });
});

const confirmCheckoutSession = asyncHandler(async (req, res) => {
  const sessionId = String(req.query.session_id || '');
  if (!sessionId) return res.status(400).json({ success: false, message: 'session_id is required.' });
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ success: false, message: 'Stripe is not configured.' });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') {
    return res.status(409).json({ success: false, message: 'Payment has not been completed.' });
  }
  if (session.metadata?.userId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'This checkout session does not belong to your account.' });
  }
  const booking = await Booking.findById(session.metadata?.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found for this payment.' });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You cannot confirm another user’s booking.' });
  }
  if (booking.status === 'cancelled') {
    if (booking.paymentStatus !== 'refunded' && session.payment_intent) {
      await stripe.refunds.create({ payment_intent: session.payment_intent, reason: 'requested_by_customer' }, { idempotencyKey: `cancelled-booking-refund-${booking._id}` });
      booking.paymentStatus = 'refunded';
      await booking.save();
    }
    return res.status(409).json({ success: false, message: 'This booking was cancelled. Any payment completed after cancellation has been refunded.' });
  }
  if (booking.status === 'pending' && booking.expiresAt && booking.expiresAt <= new Date()) {
    if (session.payment_intent) {
      await stripe.refunds.create({ payment_intent: session.payment_intent, reason: 'requested_by_customer' }, { idempotencyKey: `expired-booking-refund-${booking._id}` });
    }
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.expiresAt = undefined;
    await booking.save();
    await BookingDay.deleteMany({ booking: booking._id });
    return res.status(409).json({ success: false, message: 'The reservation hold expired before payment confirmation. Any payment has been refunded.' });
  }
  if (booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') await markBookingPaid(booking);
  res.status(200).json({ success: true, message: 'Payment confirmed.', data: booking });
});

const demoConfirm = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }
  const { bookingId } = req.body;
  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({ success: false, message: 'A valid bookingId is required.' });
  }
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only confirm your own demo booking.' });
  }
  if (booking.status !== 'pending' || (booking.expiresAt && booking.expiresAt <= new Date())) {
    return res.status(409).json({ success: false, message: 'This booking hold has expired. Please reserve again.' });
  }
  await markBookingPaid(booking);
  res.status(200).json({ success: true, demo: true, message: 'Demo payment marked as paid. No money was charged.', data: booking });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: 'Stripe webhook is not configured.' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ success: false, message: `Invalid Stripe webhook signature: ${error.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid' && session.metadata?.bookingId) {
      const booking = await Booking.findById(session.metadata.bookingId);
      if (booking && booking.user.toString() === String(session.metadata.userId)) {
        if (booking.status === 'pending' && (!booking.expiresAt || booking.expiresAt > new Date())) {
          await markBookingPaid(booking);
        } else if (booking.status !== 'confirmed' && booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'refunded' && session.payment_intent) {
          // A delayed payment after a cancelled/expired hold must not occupy dates without locks.
          await stripe.refunds.create(
            { payment_intent: session.payment_intent, reason: 'requested_by_customer' },
            { idempotencyKey: `late-booking-refund-${booking._id}` }
          );
          booking.paymentStatus = 'refunded';
          booking.status = 'cancelled';
          await booking.save();
        }
      }
    }
  }

  res.status(200).json({ received: true });
});

module.exports = { createCheckoutSession, confirmCheckoutSession, demoConfirm, stripeWebhook };
