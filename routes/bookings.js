const express = require('express');
const { 
  getBookings, 
  getBooking, 
  createBooking, 
  updateBooking, 
  deleteBooking,
  rateBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Semua route memerlukan autentikasi
router.use(protect);

router.route('/')
  .get(getBookings)
  .post(createBooking);

router.route('/:id')
  .get(getBooking)
  .put(updateBooking)
  .delete(deleteBooking);

router.post('/:id/rate', rateBooking);

module.exports = router;