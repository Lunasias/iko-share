const express = require('express');
const router = express.Router();
const { getEvents, createEvent } = require('../controllers/eventController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.post('/', authenticateToken, requireAdmin, createEvent);

module.exports = router;
