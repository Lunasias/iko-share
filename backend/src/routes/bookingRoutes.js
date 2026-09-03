const express = require('express');
const router = express.Router();
const { createBooking, cancelBooking } = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', createBooking);
router.delete('/:id', cancelBooking);

module.exports = router;
