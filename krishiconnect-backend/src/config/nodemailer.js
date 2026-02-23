const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

if (process.env.SMTP_USER && process.env.NODE_ENV !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      logger.warn('Email configuration error (Nodemailer):', error.message);
    } else {
      logger.info('Email service ready:', success);
    }
  });
}

module.exports = transporter;
