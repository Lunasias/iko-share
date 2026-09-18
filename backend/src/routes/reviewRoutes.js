const express = require('express');
const router = express.Router();
const { createReview, getMyTripReviews, getUserReviews } = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/user/:userId', getUserReviews);
// Reviews the current user already wrote inside one trip (1 review per member per trip).
router.get('/trip/:tripId/mine', authenticateToken, getMyTripReviews);
router.post('/', authenticateToken, createReview);

module.exports = router;
