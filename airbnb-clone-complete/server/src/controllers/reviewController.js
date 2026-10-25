const mongoose = require('mongoose');
const Property = require('../models/Property');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

const createReview = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;
  if (!mongoose.isValidObjectId(propertyId)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }

  const property = await Property.findOne({ _id: propertyId, isPublished: true });
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
  if (property.host.toString() === req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Hosts cannot review their own property.' });
  }

  // Only a guest with a completed, paid stay can leave a verified review.
  const completedBooking = await Booking.findOne({
    user: req.user._id,
    property: property._id,
    status: 'confirmed',
    paymentStatus: 'paid',
    checkOut: { $lte: new Date() },
  }).select('_id');

  if (!completedBooking) {
    return res.status(403).json({
      success: false,
      message: 'You can review this property after completing a paid stay.',
    });
  }

  const review = await Review.create({
    user: req.user._id,
    property: property._id,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  property.reviews.addToSet(review._id);
  const aggregate = await Review.aggregate([
    { $match: { property: property._id } },
    { $group: { _id: '$property', average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  property.rating = aggregate.length ? Math.round(aggregate[0].average * 10) / 10 : 0;
  await property.save();

  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, message: 'Review submitted.', data: review });
});

module.exports = { createReview };
