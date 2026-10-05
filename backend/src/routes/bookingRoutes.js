const express = require('express');
const router = express.Router();
const {
  createBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  submitPaymentSlip,
  verifyPayment,
} = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', createBooking);
router.put('/:id/approve', approveBooking);
router.put('/:id/reject', rejectBooking);
router.delete('/:id', cancelBooking);
router.put('/:id/payment-slip', submitPaymentSlip);
router.put('/:id/verify-payment', verifyPayment);

module.exports = router;
