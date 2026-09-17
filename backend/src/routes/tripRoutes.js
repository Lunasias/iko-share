const express = require('express');
const router = express.Router();
const { getTrips, getTripById, createTrip, completeTrip, deleteTrip, getUserTrips } = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', getTrips);
router.get('/my', authenticateToken, getUserTrips);
router.get('/:id', getTripById);
router.post('/', authenticateToken, createTrip);
router.put('/:id/complete', authenticateToken, completeTrip);
router.delete('/:id', authenticateToken, deleteTrip);

module.exports = router;
