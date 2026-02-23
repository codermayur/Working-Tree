const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    redisClient.on('connect', () => logger.info('Redis connected successfully'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error.message);
    return null;
  }
};

const getRedis = () => redisClient;

module.exports = {
  connectRedis,
  getRedis,
};
