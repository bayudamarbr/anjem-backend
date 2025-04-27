const User = require('../models/User');
const jwt = require('jsonwebtoken'); // Tambahkan ini
const Booking = require('../models/Booking');

// @desc    Register as driver
// @route   POST /api/drivers/register
// @access  Public
exports.registerDriver = async (req, res, next) => {
  try {
    const { name, email, phone, password, motorType, motorModel, licenseNumber } = req.body;
    
    // Buat user dengan role driver
    const driver = await User.create({
      name,
      email,
      phone,
      password,
      role: 'driver',
      driverInfo: {
        motorType,
        motorModel,
        licenseNumber,
        isAvailable: true
      }
    });
    
    // Buat token
    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
    
    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update driver status (available/unavailable)
// @route   PUT /api/drivers/status
// @access  Private/Driver
exports.updateStatus = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    
    // Update status ketersediaan driver
    const driver = await User.findByIdAndUpdate(
      req.user.id, 
      { 'driverInfo.isAvailable': isAvailable },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        isAvailable: driver.driverInfo.isAvailable
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update driver location
// @route   PUT /api/drivers/location
// @access  Private/Driver
exports.updateLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;
    
    // Update lokasi driver
    await User.findByIdAndUpdate(
      req.user.id, 
      { 
        'driverInfo.lastLocation': {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        longitude,
        latitude
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get driver's active bookings
// @route   GET /api/drivers/bookings/active
// @access  Private/Driver
exports.getActiveBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      driver: req.user.id,
      status: { $in: ['accepted', 'on_the_way', 'picked_up'] }
    }).populate('user', 'name phone');
    
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

// @desc    Get driver's booking history
// @route   GET /api/drivers/bookings/history
// @access  Private/Driver
exports.getBookingHistory = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      driver: req.user.id,
      status: { $in: ['completed', 'cancelled'] }
    }).populate('user', 'name');
    
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

// @desc    Get new booking requests
// @route   GET /api/drivers/bookings/requests
// @access  Private/Driver
exports.getBookingRequests = async (req, res, next) => {
  try {
    // Dapatkan tipe motor driver
    const driver = await User.findById(req.user.id);
    
    // Cari booking yang cocok dengan tipe motor driver dan belum ada driver
    const bookings = await Booking.find({
      driver: null,
      status: 'pending',
      motorType: driver.driverInfo.motorType
    }).populate('user', 'name');
    
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

// @desc    Accept booking request
// @route   PUT /api/drivers/bookings/:id/accept
// @access  Private/Driver
exports.acceptBooking = async (req, res, next) => {
  try {
    // Cek apakah booking ada dan masih pending
    const booking = await Booking.findOne({
      _id: req.params.id,
      status: 'pending',
      driver: null
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan atau sudah diambil oleh driver lain'
      });
    }
    
    // Cek apakah tipe motor cocok
    const driver = await User.findById(req.user.id);
    if (booking.motorType !== driver.driverInfo.motorType) {
      return res.status(400).json({
        success: false,
        message: 'Tipe motor tidak sesuai dengan booking'
      });
    }
    
    // Update booking dengan driver dan status
    booking.driver = req.user.id;
    booking.status = 'accepted';
    await booking.save();
    
    // Increment totalTrips driver
    await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { 'driverInfo.totalTrips': 1 } }
    );
    
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

// @desc    Update booking status by driver
// @route   PUT /api/drivers/bookings/:id/status
// @access  Private/Driver
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Cek status valid
    const validStatus = ['on_the_way', 'picked_up', 'completed'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    // Cek apakah booking milik driver ini
    const booking = await Booking.findOne({
      _id: req.params.id,
      driver: req.user.id
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }
    
    // Update status
    booking.status = status;
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