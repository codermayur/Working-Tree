const logger = require('../config/logger');

const sendOTP = async (phoneNumber, otp) => {
  const twilioConfigured =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER;

  if (!twilioConfigured) {
    logger.warn(`[DEV] Twilio not configured - OTP for ${phoneNumber}: ${otp}`);
    return;
  }

  try {
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;

    await twilio.messages.create({
      body: `Your Khetibari OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    logger.info(`OTP sent to ${phoneNumber}`);
  } catch (error) {
    // Don't block registration when Twilio fails (invalid creds, trial limits, etc.)
    logger.warn(`[DEV] Twilio failed - use OTP for ${phoneNumber}: ${otp}`, error.message);
  }
};

module.exports = sendOTP;
