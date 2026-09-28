const express = require('express');
const router = express.Router();
const {
  submitVerificationRequest,
  getMyVerificationStatus,
} = require('../controllers/verificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/request', authenticateToken, submitVerificationRequest);
router.get('/my-status', authenticateToken, getMyVerificationStatus);

module.exports = router;
