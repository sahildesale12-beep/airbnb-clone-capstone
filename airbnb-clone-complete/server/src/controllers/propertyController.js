const mongoose = require('mongoose');
const Property = require('../models/Property');
const BookingDay = require('../models/BookingDay');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { parseStay } = require('../utils/bookingDates');
const expirePendingBookings = require('../utils/expirePendingBookings');

const EDITABLE_FIELDS = [
  'title', 'description', 'images', 'price', 'location', 'category',
  'propertyType', 'amenities', 'maxGuests', 'bedrooms', 'beds', 'baths', 'isPublished',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function pickPropertyFields(body, creating = false) {
  const payload = {};
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field];
  }

  if (payload.location && typeof payload.location === 'object') {
    payload.location = {
      city: payload.location.city,
      state: payload.location.state,
      country: payload.location.country || 'India',
      ...(payload.location.lat !== undefined ? { lat: payload.location.lat } : {}),
      ...(payload.location.lng !== undefined ? { lng: payload.location.lng } : {}),
    };
  }

  if (typeof payload.category === 'string') payload.category = payload.category.trim().toLowerCase();
  if (typeof payload.propertyType === 'string') payload.propertyType = payload.propertyType.trim().toLowerCase();
  if (Array.isArray(payload.amenities)) payload.amenities = [...new Set(payload.amenities.map((value) => String(value).trim()).filter(Boolean))];
  if (Array.isArray(payload.images)) payload.images = payload.images.map((value) => String(value).trim());

  if (creating && payload.isPublished === undefined) payload.isPublished = true;
  return payload;
}

function parseOptionalNumber(value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw badRequest(`${fieldName} must be a number between ${min} and ${max}.`);
  }
  return number;
}

async function unavailablePropertyIds(checkInValue, checkOutValue) {
  if (!checkInValue && !checkOutValue) return [];
  if (!checkInValue || !checkOutValue) {
    throw badRequest('Provide both checkIn and checkOut to filter by availability.');
  }

  await expirePendingBookings();
  const stay = parseStay(checkInValue, checkOutValue);
  const now = new Date();
  const occupied = await BookingDay.find({
    dateKey: { $in: stay.dateKeys },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: now } },
    ],
  }).distinct('property');
  return occupied;
}

const getProperties = asyncHandler(async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(req.query.limit) || 12)));
  const query = { isPublished: true };

  const minPrice = parseOptionalNumber(req.query.minPrice, 'minPrice', { min: 0 });
  const maxPrice = parseOptionalNumber(req.query.maxPrice, 'maxPrice', { min: 0 });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw badRequest('minPrice cannot be greater than maxPrice.');
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (req.query.guests !== undefined) {
    query.maxGuests = { $gte: parseOptionalNumber(req.query.guests, 'guests', { min: 1, max: 50 }) };
  }

  if (req.query.category) query.category = String(req.query.category).trim().toLowerCase();
  if (req.query.propertyType) query.propertyType = String(req.query.propertyType).trim().toLowerCase();

  const searchText = String(req.query.search || req.query.location || '').trim();
  if (searchText) {
    const regex = new RegExp(escapeRegex(searchText), 'i');
    query.$or = [
      { title: regex },
      { 'location.city': regex },
      { 'location.state': regex },
      { 'location.country': regex },
      { description: regex },
    ];
  }

  const unavailableIds = await unavailablePropertyIds(req.query.checkIn, req.query.checkOut);
  if (unavailableIds.length) query._id = { $nin: unavailableIds };

  const [items, total] = await Promise.all([
    Property.find(query)
      .populate('host', 'name avatar')
      .sort({ rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Property.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const getProperty = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }

  const property = await Property.findOne({ _id: req.params.id, isPublished: true })
    .populate('host', 'name avatar')
    .populate({
      path: 'reviews',
      options: { sort: { createdAt: -1 } },
      populate: { path: 'user', select: 'name avatar' },
    });

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found.' });
  }

  res.status(200).json({ success: true, data: property });
});

const getMyProperties = asyncHandler(async (req, res) => {
  const items = await Property.find({ host: req.user._id })
    .populate('host', 'name avatar')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: items });
});

const createProperty = asyncHandler(async (req, res) => {
  const payload = pickPropertyFields(req.body, true);
  const property = await Property.create({ ...payload, host: req.user._id });
  const populated = await property.populate('host', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Property listing created successfully.',
    data: populated,
  });
});

const updateProperty = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }

  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
  if (property.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only edit your own listings.' });
  }

  const payload = pickPropertyFields(req.body);
  for (const [key, value] of Object.entries(payload)) property.set(key, value);
  await property.save();
  await property.populate('host', 'name avatar');

  res.status(200).json({ success: true, message: 'Property listing updated.', data: property });
});

const deleteProperty = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }

  const property = await Property.findById(req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
  if (property.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });
  }

  await expirePendingBookings();
  const now = new Date();
  const activeBooking = await Booking.findOne({
    property: property._id,
    $or: [
      { status: 'confirmed', checkOut: { $gte: now } },
      { status: 'pending', expiresAt: { $gt: now } },
    ],
  }).select('_id');

  if (activeBooking) {
    return res.status(409).json({
      success: false,
      message: 'This listing has an active reservation and cannot be deleted yet.',
    });
  }

  const reviews = await Review.find({ property: property._id }).select('_id');
  if (reviews.length) {
    await Review.deleteMany({ property: property._id });
  }
  await User.updateMany({}, { $pull: { wishlist: property._id } });
  await BookingDay.deleteMany({ property: property._id });
  await Property.deleteOne({ _id: property._id });

  res.status(200).json({ success: true, message: 'Property listing deleted.' });
});

module.exports = { getProperties, getProperty, getMyProperties, createProperty, updateProperty, deleteProperty };
