require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

// Load route files
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const driverRoutes = require('./routes/drivers');
const chatRoutes = require('./routes/chats');

// Inisialisasi Express
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ['https://si-anjem.netlify.app/', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Koneksi Database MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/chats', chatRoutes);

// Socket.io untuk chat realtime
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Join room (based on booking id)
  socket.on('joinRoom', (bookingId) => {
    socket.join(bookingId);
    console.log(`User joined room: ${bookingId}`);
  });
  
  // Listen for chat message
  socket.on('chatMessage', (message) => {
    // Broadcast to room
    io.to(message.bookingId).emit('message', message);
  });
  
  // Listen for booking status updates
  socket.on('bookingStatusUpdate', (data) => {
    // Broadcast to room
    io.to(data.bookingId).emit('statusUpdate', data);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});