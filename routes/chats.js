const express = require('express');
const { 
  getChatByBooking,
  sendMessage,
  getMyChats
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Semua route memerlukan autentikasi
router.use(protect);

router.get('/', getMyChats);
router.get('/booking/:bookingId', getChatByBooking);
router.post('/booking/:bookingId/messages', sendMessage);

module.exports = router;