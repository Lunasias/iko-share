const express = require('express');
const router = express.Router();
const { getMyCars, addCar, deleteCar } = require('../controllers/carController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/my', getMyCars);
router.post('/', addCar);
router.delete('/:license_plate', deleteCar);

module.exports = router;
