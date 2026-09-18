const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { createSupportRequest, getSupportRequestStatus } = require('../controllers/supportController');

// Public route (the visitor forgot their password and cannot log in yet),
// therefore it is rate limited to keep the admin inbox clean.
const supportLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/requests', supportLimiter, createSupportRequest);
router.get('/requests/:id', supportLimiter, getSupportRequestStatus);

module.exports = router;