const express = require('express');
const router = express.Router();
const { getTrips, getTripById, createTrip, getUserTrips } = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireDriverWithCar } = require('../middleware/driverMiddleware');

router.get('/', getTrips);
router.get('/my', authenticateToken, getUserTrips);
router.get('/:id', getTripById);
router.post('/', authenticateToken, requireDriverWithCar, createTrip);

module.exports = router;
