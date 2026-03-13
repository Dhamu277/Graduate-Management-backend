const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars
dotenv.config();
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Check for required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) {
    console.error(`FATAL ERROR: ${v} is not defined in environment variables`);
    if (process.env.NODE_ENV !== 'production') {
       // Only exit in dev to help developer notice, in production let it try to run or report via logs
       process.exit(1); 
    }
  }
});

// Connect to database with catch
connectDB().catch(err => {
  console.error('Database pre-connection failed:', err.message);
});

const FRONTEND_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://graduate-management-frontend.vercel.app"
];

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

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
