const express = require('express');
const router = express.Router();
const { getTripMessages, sendMessage } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/trips/:id', getTripMessages);
router.post('/trips/:id', sendMessage);

module.exports = router;
