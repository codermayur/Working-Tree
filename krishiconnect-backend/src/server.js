require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./socket');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.REDIS_URL) {
      await connectRedis();
    }

    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
