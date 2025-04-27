const Chat = require('../models/Chat');
const Booking = require('../models/Booking');

// @desc    Get chat by booking ID
// @route   GET /api/chats/booking/:bookingId
// @access  Private
exports.getChatByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Cek apakah user memiliki akses ke booking ini
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Cek apakah user adalah customer atau driver dari booking ini
    if (booking.user.toString() !== req.user.id && booking.driver?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke chat ini'
      });
    }
    
    // Cari chat yang sudah ada atau buat baru jika belum ada
    let chat = await Chat.findOne({ booking: bookingId })
                         .populate('messages.sender', 'name role');
    
    // Jika belum ada chat dan booking sudah memiliki driver, buat chat baru
    if (!chat && booking.driver) {
      chat = await Chat.create({
        booking: bookingId,
        customer: booking.user,
        driver: booking.driver,
        messages: []
      });
    }
    
    // Jika belum ada chat dan booking belum memiliki driver
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat belum tersedia karena booking belum diterima driver'
      });
    }
    
    // Update status pesan sebagai terbaca untuk pesan yang dikirim ke user ini
    if (chat.messages.length > 0) {
      // Update semua pesan yang belum dibaca dan bukan dari user ini
      await Chat.updateMany(
        { booking: bookingId, 'messages.sender': { $ne: req.user.id }, 'messages.readStatus': false },
        { $set: { 'messages.$[elem].readStatus': true } },
        { arrayFilters: [{ 'elem.sender': { $ne: req.user.id } }] }
      );
      
      // Refresh chat data setelah update
      chat = await Chat.findOne({ booking: bookingId })
                      .populate('messages.sender', 'name role');
    }
    
    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Send message in chat
// @route   POST /api/chats/booking/:bookingId/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Pesan tidak boleh kosong'
      });
    }
    
    // Cek apakah user memiliki akses ke booking ini
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Cek apakah user adalah customer atau driver dari booking ini
    if (booking.user.toString() !== req.user.id && booking.driver?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke chat ini'
      });
    }
    
    // Cek apakah booking sudah memiliki driver
    if (!booking.driver) {
      return res.status(400).json({
        success: false,
        message: 'Chat tidak tersedia karena booking belum diterima driver'
      });
    }
    
    // Cari chat yang sudah ada atau buat baru jika belum ada
    let chat = await Chat.findOne({ booking: bookingId });
    
    if (!chat) {
      chat = await Chat.create({
        booking: bookingId,
        customer: booking.user,
        driver: booking.driver,
        messages: []
      });
    }
    
    // Tambahkan pesan baru
    chat.messages.push({
      sender: req.user.id,
      content,
      readStatus: false
    });
    
    // Simpan chat
    await chat.save();
    
    // Dapatkan data lengkap chat
    chat = await Chat.findOne({ booking: bookingId })
                    .populate('messages.sender', 'name role');
    
    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get all chats for current user
// @route   GET /api/chats
// @access  Private
exports.getMyChats = async (req, res, next) => {
  try {
    let chats;
    
    if (req.user.role === 'driver') {
      // Jika driver, cari semua chat di mana dia adalah driver
      chats = await Chat.find({ driver: req.user.id })
                        .populate('booking', 'status pickupLocation destination')
                        .populate('customer', 'name')
                        .sort({ lastUpdated: -1 });
    } else {
      // Jika customer, cari semua chat di mana dia adalah customer
      chats = await Chat.find({ customer: req.user.id })
                        .populate('booking', 'status pickupLocation destination')
                        .populate('driver', 'name')
                        .sort({ lastUpdated: -1 });
    }
    
    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};