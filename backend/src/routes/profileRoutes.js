const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/public/:userId', getPublicProfile);
router.get('/', authenticateToken, getProfile);
router.put('/', authenticateToken, updateProfile);

module.exports = router;
