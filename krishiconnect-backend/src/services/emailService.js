const transporter = require('../config/nodemailer');
const logger = require('../config/logger');
const { getRedis } = require('../config/redis');

async function sendEmail(recipientEmail, subject, htmlBody, textBody = '') {
  const fromName = process.env.SMTP_FROM_NAME || 'Khetibari';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!fromEmail) {
    logger.warn('[Email] SMTP_FROM_EMAIL/SMTP_USER not set - skipping send');
    return { success: true, skipped: true, reason: 'SMTP not configured' };
  }

  try {
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      subject,
      html: htmlBody,
      text: textBody || htmlBody.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${recipientEmail}:`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date(),
    };
  } catch (error) {
    logger.error(`Failed to send email to ${recipientEmail}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function sendEmailOnce(recipientEmail, subject, body, eventType, identifier, withinMinutes = 5) {
  const redis = getRedis();
  const key = `email:sent:${eventType}:${recipientEmail}:${identifier || 'global'}`;
  const ttlSeconds = withinMinutes * 60;

  if (redis) {
    try {
      const exists = await redis.get(key);
      if (exists) {
        logger.warn(`Skipping duplicate email: ${eventType} to ${recipientEmail}`);
        return { success: true, skipped: true, reason: 'Duplicate prevented' };
      }
    } catch (err) {
      logger.warn('Redis check for duplicate email failed:', err.message);
    }
  }

  const result = await sendEmail(recipientEmail, subject, body.html || body, body.text);

  if (result.success && !result.skipped && redis) {
    try {
      await redis.setEx(key, ttlSeconds, '1');
    } catch (err) {
      logger.warn('Redis set for email sent failed:', err.message);
    }
  }

  return result.skipped ? result : { ...result, skipped: false };
}

module.exports = {
  sendEmail,
  sendEmailOnce,
};
