require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./socket');
const logger = require('./config/logger');
const User = require('./modules/user/user.model');

const PORT = process.env.PORT || 5005;

/** Create default admin if no admin user exists. Credentials: email admin, password admin */
async function seedDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' }).lean();
    if (existingAdmin) return;

    await User.create({
      name: 'Admin',
      email: 'admin',
      phoneNumber: '9999999999',
      password: 'admin',
      role: 'admin',
    });
    logger.info('Default admin created (email: admin, password: admin). Change password after first login.');
  } catch (err) {
    if (err.code === 11000) {
      logger.info('Default admin already exists (duplicate key).');
      return;
    }
    logger.error('Seed default admin failed:', err.message);
  }
}

/** Create profile admin user if not exists. Email: treecode90@gmail.com, role: admin */
async function seedProfileAdmin() {
  const EMAIL = 'treecode90@gmail.com';
  const PHONE = '9876543210'; // valid 10-digit Indian number; change if you need another
  const DEFAULT_PASSWORD = 'admin123';

  try {
    const existing = await User.findOne({ email: EMAIL }).lean();
    if (existing) {
      logger.info('Profile admin already exists:', EMAIL);
      return;
    }

    await User.create({
      name: 'Profile Admin',
      email: EMAIL.toLowerCase(),
      phoneNumber: PHONE,
      password: DEFAULT_PASSWORD,
      role: 'admin',
      username: `admin_${EMAIL.split('@')[0]}_${Date.now()}`,
    });
    logger.info(`Profile admin created: ${EMAIL} (password: ${DEFAULT_PASSWORD}). Change password after first login.`);
  } catch (err) {
    if (err.code === 11000) {
      logger.info('Profile admin already exists (duplicate key):', EMAIL);
      return;
    }
    logger.error('Seed profile admin failed:', err.message);
  }
}

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaultAdmin();
    await seedProfileAdmin();

    if (process.env.REDIS_URL) {
      await connectRedis();
    }

    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Server running on port ${PORT}`);
      }
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
