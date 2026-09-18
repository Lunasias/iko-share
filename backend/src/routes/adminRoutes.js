const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  updateUserAdminAccess,
  deleteUser,
  deleteUserByEmail,
  deleteTrip,
  getReports,
  updateReportStatus,
  deleteReport,
  deleteReportedMessage,
  getSupportRequests,
  updateSupportRequest,
  deleteSupportRequest,
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/admin-access', updateUserAdminAccess);
router.delete('/users-by-email/:email', deleteUserByEmail);
router.delete('/users/:id', deleteUser);
router.delete('/trips/:id', deleteTrip);

// Reports sent from the trip chat (คำหยาบ / ข้อความไม่เหมาะสม)
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);
router.delete('/reports/:id', deleteReport);
router.delete('/messages/:id', deleteReportedMessage);

// Forgot-password / account-deletion requests opened as a chat with the admin
router.get('/support-requests', getSupportRequests);
router.put('/support-requests/:id', updateSupportRequest);
router.delete('/support-requests/:id', deleteSupportRequest);

module.exports = router;
