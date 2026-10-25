const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 6000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 20,
        message: 'A property can have at most 20 images',
      },
    },
    price: { type: Number, required: true, min: 1 },
    location: { type: locationSchema, required: true },
    category: { type: String, required: true, trim: true, lowercase: true },
    propertyType: {
      type: String,
      enum: ['home', 'apartment', 'guesthouse', 'hotel', 'unique-stay', 'villa', 'cabin'],
      default: 'home',
    },
    amenities: { type: [String], default: [] },
    maxGuests: { type: Number, required: true, min: 1, max: 50 },
    bedrooms: { type: Number, default: 1, min: 0, max: 50 },
    beds: { type: Number, default: 1, min: 1, max: 100 },
    baths: { type: Number, default: 1, min: 0, max: 50 },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

propertySchema.index({ 'location.city': 1, category: 1, price: 1 });
propertySchema.index({ title: 'text', description: 'text', 'location.city': 'text', 'location.state': 'text' });

module.exports = mongoose.model('Property', propertySchema);
