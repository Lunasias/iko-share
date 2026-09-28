const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadImage, getUploadedImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
});

// Upload image (requires authentication) - accepts multipart field 'file' or 'image'
router.post('/', authenticateToken, upload.single('file'), uploadImage);
router.post('/image', authenticateToken, upload.single('image'), uploadImage);

// Serve image publicly with HTTP caching
router.get('/file/:id', getUploadedImage);

module.exports = router;
