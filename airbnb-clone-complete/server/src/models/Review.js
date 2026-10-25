const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1500 },
  },
  { timestamps: true }
);

// One review per user for each property; the API can later allow edits to that review.
reviewSchema.index({ user: 1, property: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
