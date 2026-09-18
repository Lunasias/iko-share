const express = require('express');
const router = express.Router();
const { getTrips, getTripById, createTrip, completeTrip, deleteTrip, kickPassenger, getUserTrips } = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', getTrips);
router.get('/my', authenticateToken, getUserTrips);
router.get('/:id', getTripById);
router.post('/', authenticateToken, createTrip);
router.put('/:id/complete', authenticateToken, completeTrip);
// Room head (trip owner) or admin removes a member from the party.
router.delete('/:id/passengers/:userId', authenticateToken, kickPassenger);
router.delete('/:id', authenticateToken, deleteTrip);

module.exports = router;
