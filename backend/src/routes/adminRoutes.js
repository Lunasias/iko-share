const express = require('express');
const router = express.Router();
const { getAdminStats, getAllUsers, deleteUser, deleteTrip } = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.delete('/trips/:id', deleteTrip);

module.exports = router;
