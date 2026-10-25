const mongoose = require('mongoose');

// One document per booked night. The unique property/date index prevents two
// requests (including requests on separate server processes) from reserving
// the same night at the same time.
const bookingDaySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    // YYYY-MM-DD in UTC; checkout day itself is not reserved.
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    // Pending reservations automatically expire. Confirmed reservations have
    // this field removed and are not affected by the TTL index.
    expiresAt: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

bookingDaySchema.index({ property: 1, dateKey: 1 }, { unique: true });
bookingDaySchema.index({ booking: 1 });
bookingDaySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BookingDay', bookingDaySchema);
