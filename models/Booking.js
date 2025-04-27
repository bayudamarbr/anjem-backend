const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  pickupLocation: {
    type: String,
    required: [true, 'Lokasi penjemputan harus diisi']
  },
  destination: {
    type: String,
    required: [true, 'Lokasi tujuan harus diisi']
  },
  motorType: {
    type: String,
    enum: ['hemat', 'standar', 'comfort'],
    required: true
  },
  pickupTime: {
    type: Date,
    required: true
  },
  estimatedPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'picked_up', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    review: {
      type: String,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);