const http = require('http');
const { Server } = require("socket.io");
const app = require('./app');
const { PORT, CORS_ORIGIN } = require('./config/env');
const { connectDB } = require('./config/db');
const registerSockets = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Initialize Sockets
registerSockets(io);

// entry point
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Critical Failure: Server could not start.', err);
    process.exit(1);
  }
};

startServer();
