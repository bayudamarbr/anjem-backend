const express = require('express');
const { 
  registerDriver,
  updateStatus,
  updateLocation,
  getActiveBookings,
  getBookingHistory,
  getBookingRequests,
  acceptBooking,
  updateBookingStatus
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerDriver);

// Protected routes (driver only)
router.put('/status', protect, authorize('driver'), updateStatus);
router.put('/location', protect, authorize('driver'), updateLocation);
router.get('/bookings/active', protect, authorize('driver'), getActiveBookings);
router.get('/bookings/history', protect, authorize('driver'), getBookingHistory);
router.get('/bookings/requests', protect, authorize('driver'), getBookingRequests);
router.put('/bookings/:id/accept', protect, authorize('driver'), acceptBooking);
router.put('/bookings/:id/status', protect, authorize('driver'), updateBookingStatus);

module.exports = router;