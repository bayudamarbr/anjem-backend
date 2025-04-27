const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    // Pastikan user mengupdate data mereka sendiri atau admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengubah user ini'
      });
    }
    
    user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
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