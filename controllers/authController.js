const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Buat user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'user'
    });
    
    // Buat token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validasi email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }
    
    // Cek user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }
    
    // Cek password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }
    
    // Buat token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
    
    res.status(200).json({
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};