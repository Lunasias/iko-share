const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  joinTrip,
  getUserTrips,
  cancelTrip,
} = require('../controllers/tripController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', getTrips);
router.get('/my', authenticateToken, getUserTrips);
router.get('/:id', getTripById);
router.post('/', authenticateToken, createTrip);
router.post('/:id/join', authenticateToken, joinTrip);
router.delete('/:id', authenticateToken, cancelTrip);

module.exports = router;
