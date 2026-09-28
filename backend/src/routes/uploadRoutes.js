const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadImage, getUploadedImage } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to accept file from any field name ('file', 'image', 'photo', 'document')
const handleImageUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'ขนาดไฟล์ภาพต้องไม่เกิน 10 MB' });
        }
        return res.status(400).json({ success: false, message: `ข้อผิดพลาดในการอัปโหลด: ${err.message}` });
      }
      return res.status(400).json({ success: false, message: 'ไม่สามารถประมวลผลไฟล์ที่อัปโหลดได้' });
    }

    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// Upload image (requires authentication) - accepts any multipart field name
router.post('/', authenticateToken, handleImageUpload, uploadImage);
router.post('/image', authenticateToken, handleImageUpload, uploadImage);

// Serve image publicly with HTTP caching
router.get('/file/:id', getUploadedImage);

module.exports = router;

