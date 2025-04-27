const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query;
    
    // Admin bisa melihat semua booking
    if (req.user.role === 'admin') {
      query = Booking.find()
                    .populate('user', 'name email phone')
                    .populate('driver', 'name phone driverInfo.motorType driverInfo.motorModel');
    } 
    // Driver melihat booking yang dia tangani
    else if (req.user.role === 'driver') {
      query = Booking.find({ driver: req.user.id })
                    .populate('user', 'name phone');
    }
    // User biasa hanya bisa melihat booking mereka sendiri
    else {
      query = Booking.find({ user: req.user.id })
                    .populate('driver', 'name phone driverInfo.motorType driverInfo.motorModel');
    }
    
    const bookings = await query;
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    let query;
    
    // Admin bisa melihat semua booking
    if (req.user.role === 'admin') {
      query = Booking.findById(req.params.id)
                    .populate('user', 'name email phone')
                    .populate('driver', 'name phone driverInfo');
    }
    // Driver melihat booking yang dia tangani
    else if (req.user.role === 'driver') {
      query = Booking.findOne({ 
        _id: req.params.id,
        driver: req.user.id 
      }).populate('user', 'name phone');
    }
    // User biasa hanya bisa melihat booking mereka sendiri
    else {
      query = Booking.findOne({ 
        _id: req.params.id,
        user: req.user.id 
      }).populate('driver', 'name phone driverInfo.motorType driverInfo.motorModel');
    }
    
    const booking = await query;
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (for regular users)
exports.createBooking = async (req, res, next) => {
  try {
    // Check jika user memiliki role 'user'
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Hanya customer yang dapat membuat booking'
      });
    }

    // Hitung estimasi harga berdasarkan tipe motor
    let basePrice;
    switch(req.body.motorType) {
      case 'hemat':
        basePrice = 15000;
        break;
      case 'standar':
        basePrice = 20000;
        break;
      case 'comfort':
        basePrice = 25000;
        break;
      default:
        basePrice = 15000;
    }
    
    const distancePrice = Math.floor(Math.random() * 20000);
    const estimatedPrice = basePrice + distancePrice;
    
    const booking = await Booking.create({
      ...req.body,
      user: req.user.id,
      estimatedPrice,
      status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Pastikan user adalah pemilik booking atau admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah booking ini'
      });
    }
    
    // Mencegah update status jika bukan admin atau driver
    if (req.body.status && req.user.role === 'user') {
      return res.status(401).json({
        success: false,
        message: 'Customer tidak dapat mengubah status booking'
      });
    }
    
    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Cancel booking (update status to cancelled)
// @route   DELETE /api/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Pastikan user adalah pemilik booking atau admin
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk membatalkan booking ini'
      });
    }
    
    // Hanya boleh membatalkan booking yang masih pending
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking yang sudah diterima driver tidak dapat dibatalkan'
      });
    }
    
    // Mengubah status menjadi cancelled alih-alih menghapus data
    booking.status = 'cancelled';
    await booking.save();
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
// @desc    Rate booking (give rating to driver)
// @route   POST /api/bookings/:id/rate
// @access  Private
exports.rateBooking = async (req, res, next) => {
  try {
    const { score, review } = req.body;
    
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating harus antara 1-5'
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Pastikan user adalah pemilik booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk memberi rating pada booking ini'
      });
    }
    
    // Pastikan booking sudah selesai
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Hanya booking yang sudah selesai yang dapat diberi rating'
      });
    }
    
    // Pastikan booking belum diberi rating
    if (booking.rating.score) {
      return res.status(400).json({
        success: false,
        message: 'Booking ini sudah diberi rating sebelumnya'
      });
    }
    
    // Update rating
    booking.rating.score = score;
    booking.rating.review = review || '';
    await booking.save();
    
    // Update rating driver
    if (booking.driver) {
      const driver = await User.findById(booking.driver);
      
      if (driver) {
        // Hitung rating rata-rata
        const bookingsWithRating = await Booking.find({
          driver: booking.driver,
          'rating.score': { $exists: true, $ne: null }
        });
        
        let totalScore = 0;
        bookingsWithRating.forEach(b => {
          totalScore += b.rating.score;
        });
        
        const avgRating = totalScore / bookingsWithRating.length;
        
        // Update rating driver
        await User.findByIdAndUpdate(
          booking.driver,
          { 'driverInfo.rating': avgRating }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};