const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const maxRetries = 5;
  let retryCount = 0;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('MongoDB connected successfully');

      // Drop stale indexes from old schema (phone_1 when we use phoneNumber)
      try {
        await mongoose.connection.collection('users').dropIndex('phone_1');
        logger.info('Dropped stale phone_1 index from users collection');
      } catch (idxErr) {
        // Ignore - index may not exist or collection empty
      }
    } catch (error) {
      retryCount += 1;
      logger.error(`MongoDB connection failed (attempt ${retryCount}/${maxRetries}):`, error.message);

      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        logger.info(`Retrying in ${delay}ms...`);
        setTimeout(connectWithRetry, delay);
      } else {
        logger.error('MongoDB connection failed after max retries');
        process.exit(1);
      }
    }
  };

  await connectWithRetry();
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

module.exports = connectDB;
