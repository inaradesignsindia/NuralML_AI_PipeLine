require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const logger = require('./logger');

const dataRoutes = require('./routes/dataRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { passport } = require('./passport');
const handleSocketConnection = require('./websocket/socketHandler');
const { wsConnectionLimiter } = require('./middleware/rateLimit');
const { errorHandler, gracefulDegradation } = require('./middleware/errorHandler');
const DataAcquisitionPipeline = require('./modules/dataAcquisitionPipeline');
const AlertManager = require('./modules/alertManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // React app
    methods: ["GET", "POST"]
  },
  // Rate limiting for WebSocket connections
  allowRequest: (req, callback) => {
    // Apply rate limiting to WebSocket upgrade requests
    wsConnectionLimiter(req, null, (err) => {
      if (err) {
        callback(err.message, false);
      } else {
        callback(null, true);
      }
    });
  }
});

// Initialize AlertManager
const alertManager = new AlertManager(io);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Graceful degradation middleware
app.use(gracefulDegradation);

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/health', healthRoutes);


// Error handling middleware
app.use(errorHandler);

// WebSocket handling
const marketContext = handleSocketConnection(io, alertManager);

// Initialize and start Data Acquisition & Pre-Processing Pipeline (DAPP)
const dapp = new DataAcquisitionPipeline({
  interval: process.env.DAPP_INTERVAL || 5000, // Configurable interval, default 5 seconds
  assets: ['bitcoin', 'ethereum'],
  symbols: ['BTCUSDT', 'ETHUSDT'],
  io: io,
  alertManager: alertManager
});

dapp.start(marketContext);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Data Acquisition & Pre-Processing Pipeline (DAPP) started');
});

module.exports = { app, server, io };