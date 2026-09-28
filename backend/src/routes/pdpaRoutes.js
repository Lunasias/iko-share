const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  exportMyData,
  submitPdpaRequest,
  getMyPdpaRequests,
} = require('../controllers/pdpaController');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

// Optional auth helper: attaches user if token is present, but doesn't block guests
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || req.cookies?.token || req.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      req.user = decoded;
    } catch (e) {
      // Ignored for optional auth
    }
  }
  next();
};

// 1. One-click instant data export (requires login)
router.get('/my-data-export', authenticateToken, exportMyData);

// 2. Submit statutory PDPA request (guest or logged-in)
router.post('/requests', optionalAuth, submitPdpaRequest);

// 3. View user's submitted requests
router.get('/my-requests', authenticateToken, getMyPdpaRequests);

module.exports = router;
