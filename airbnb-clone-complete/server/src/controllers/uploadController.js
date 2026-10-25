const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('../utils/asyncHandler');

const cloudinaryConfigured = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function uploadBufferToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'staybnb/properties', resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });
}

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'Select at least one image to upload.' });
  }

  const urls = [];
  for (const file of req.files) {
    if (cloudinaryConfigured()) {
      urls.push(await uploadBufferToCloudinary(file.buffer, file.mimetype));
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, message: 'Configure Cloudinary before uploading images in production.' });
      }
      const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' })[file.mimetype] || '.img';
      const filename = `${crypto.randomUUID()}${extension}`;
      const destination = path.resolve(__dirname, '../../public/uploads', filename);
      await fs.writeFile(destination, file.buffer);
      urls.push(`${req.protocol}://${req.get('host')}/uploads/${filename}`);
    }
  }

  res.status(201).json({
    success: true,
    message: cloudinaryConfigured() ? 'Images uploaded to Cloudinary.' : 'Images saved to local development storage.',
    data: urls,
    storage: cloudinaryConfigured() ? 'cloudinary' : 'local-development',
  });
});

module.exports = { uploadImages };
