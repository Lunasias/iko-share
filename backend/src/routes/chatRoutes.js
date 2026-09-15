const express = require('express');
const router = express.Router();
const { getTripMessages, sendMessage, reportMessage } = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/trips/:id', getTripMessages);
router.post('/trips/:id', sendMessage);
router.post('/messages/:id/report', reportMessage);

module.exports = router;
