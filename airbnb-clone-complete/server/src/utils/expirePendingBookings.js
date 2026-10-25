const Booking = require('../models/Booking');
const BookingDay = require('../models/BookingDay');

// TTL deletion is asynchronous in MongoDB. Explicit cleanup makes expired
// holds available immediately on the next API request.
async function expirePendingBookings() {
  const now = new Date();
  const expired = await Booking.find({
    status: 'pending',
    expiresAt: { $lte: now },
  }).select('_id');

  if (!expired.length) return;

  const ids = expired.map((booking) => booking._id);
  await BookingDay.deleteMany({ booking: { $in: ids } });
  await Booking.updateMany(
    { _id: { $in: ids }, status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'cancelled', paymentStatus: 'failed' }, $unset: { expiresAt: 1 } }
  );
}

module.exports = expirePendingBookings;
