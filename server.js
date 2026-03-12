const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://graduate-management-h8jv.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["https://graduate-management-h8jv.vercel.app", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on('joinUserRoom', (userId) => {
    socket.join(userId);
    console.log(`User joined personal room: ${userId}`);
  });

  socket.on('sendMessage', (data) => {
    // data: { conversationId, senderId, receiverId, text, createdAt }
    io.to(data.conversationId).emit('receiveMessage', data);
    
    // Notify receiver specifically if they are not in the conversation room
    if (data.receiverId) {
      io.to(data.receiverId).emit('newMessageNotification', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Routes mapping
console.log('Registering routes...');
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/mentorships', require('./routes/mentorshipRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
console.log('Routes registered successfully including connections.');

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.get('/', (req, res) => {
  res.send('Alumni Management API is running...');
});

// Error Handler middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
