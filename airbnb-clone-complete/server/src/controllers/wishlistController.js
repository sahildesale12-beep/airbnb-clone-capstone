const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const asyncHandler = require('../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('wishlist')
    .populate({
      path: 'wishlist',
      match: { isPublished: true },
      populate: { path: 'host', select: 'name avatar' },
    });

  const properties = (user?.wishlist || []).filter(Boolean);
  res.status(200).json({ success: true, data: properties });
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  if (!mongoose.isValidObjectId(propertyId)) {
    return res.status(400).json({ success: false, message: 'Invalid property ID.' });
  }

  const property = await Property.findOne({ _id: propertyId, isPublished: true }).select('_id');
  if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

  const user = await User.findById(req.user._id);
  const isAlreadySaved = user.wishlist.some((id) => id.toString() === propertyId);

  if (isAlreadySaved) user.wishlist.pull(property._id);
  else user.wishlist.addToSet(property._id);

  await user.save();
  res.status(200).json({
    success: true,
    isWishlisted: !isAlreadySaved,
    message: isAlreadySaved ? 'Property removed from wishlist.' : 'Property added to wishlist.',
  });
});

module.exports = { getWishlist, toggleWishlist };
