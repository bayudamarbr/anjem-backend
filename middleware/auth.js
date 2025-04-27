const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteksi rute
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Tidak ada akses ke rute ini'
    });
  }
  
  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

// Cek role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User dengan role ${req.user.role} tidak memiliki akses ke rute ini`
      });
    }
    next();
  };
};