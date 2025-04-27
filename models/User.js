const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama harus diisi']
  },
  email: {
    type: String,
    required: [true, 'Email harus diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Nomor telepon harus diisi']
  },
  password: {
    type: String,
    required: [true, 'Password harus diisi'],
    minlength: [6, 'Password minimal 6 karakter'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'driver'],
    default: 'user'
  },
  // Informasi tambahan untuk driver
  driverInfo: {
    motorType: {
      type: String,
      enum: ['hemat', 'standar', 'comfort'],
      required: function() {
        return this.role === 'driver';
      }
    },
    motorModel: {
      type: String,
      required: function() {
        return this.role === 'driver';
      }
    },
    licenseNumber: {
      type: String,
      required: function() {
        return this.role === 'driver';
      }
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    totalTrips: {
      type: Number,
      default: 0
    },
    // Lokasi terakhir driver
    lastLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0] // [longitude, latitude]
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Foto profil
  profileImage: {
    type: String,
    default: 'default.jpg'
  }
});

// Tambahkan index geospatial untuk pencarian driver terdekat
UserSchema.index({ 'driverInfo.lastLocation': '2dsphere' });

// Hash password sebelum disimpan
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method untuk membandingkan password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);