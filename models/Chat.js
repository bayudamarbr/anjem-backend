const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Pesan tidak boleh kosong'],
    trim: true
  },
  readStatus: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ChatSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [MessageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated saat ada pesan baru
ChatSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Chat', ChatSchema);