const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadImages } = require('../controllers/uploadController');

const router = express.Router();
router.post('/images', protect, authorizeRoles('host', 'admin'), upload.array('images', 10), uploadImages);
module.exports = router;
