const express = require('express');
const router = express.Router();
const { getTripMemories, addTripMemory } = require('../controllers/memoryController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/trip/:tripId', getTripMemories);
router.post('/trip/:tripId', authenticateToken, addTripMemory);

module.exports = router;
