const express = require('express');
const router = express.Router();
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/user/:userId', getUserReviews);
router.post('/', authenticateToken, createReview);

module.exports = router;
