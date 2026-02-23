const APP_NAME = process.env.SMTP_FROM_NAME || 'KrishiConnect';
const APP_URL = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:3000';

function getRegistrationOTPTemplate(userName, otpCode, expiryMinutes = 10) {
  return {
    subject: '🔐 Verify Your Email - Registration OTP',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: #fff; border: 2px dashed #059669; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; font-family: monospace; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin: 15px 0; color: #92400e; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Email Verification</h2>
            </div>
            <div class="content">
              <p>Hi ${userName || 'User'},</p>
              <p>Thank you for registering! To complete your registration, please verify your email using the code below:</p>
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <p style="color: #6b7280; margin-top: 10px;">Valid for ${expiryMinutes} minutes</p>
              </div>
              <p><strong>Instructions:</strong></p>
              <ol>
                <li>Go back to the registration page in our app</li>
                <li>Enter the OTP code above</li>
                <li>Complete your registration</li>
              </ol>
              <div class="warning">
                <strong>⚠️ Important:</strong> Never share this OTP with anyone. We will never ask for this code via email or phone.
              </div>
              <p>If you didn't request this registration, please ignore this email.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Email Verification\n\nHi ${userName || 'User'},\n\nYour verification code is: ${otpCode}\n\nValid for ${expiryMinutes} minutes. Never share this code.\n\nIf you didn't request this, please ignore this email.\n\n— ${APP_NAME}`,
  };
}

function getPasswordResetOTPTemplate(userName, otpCode, expiryMinutes = 10) {
  return {
    subject: '🔐 Reset Your Password - OTP Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: #fff; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc2626; font-family: monospace; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin: 15px 0; color: #92400e; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hi ${userName || 'User'},</p>
              <p>We received a request to reset your password. Use the code below to complete the process:</p>
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <p style="color: #6b7280; margin-top: 10px;">Valid for ${expiryMinutes} minutes</p>
              </div>
              <p><strong>To reset your password:</strong></p>
              <ol>
                <li>Go to the password reset page</li>
                <li>Enter this OTP code</li>
                <li>Create a new password</li>
              </ol>
              <div class="warning">
                <strong>🔒 Security:</strong> Never share this code. If you didn't request this reset, ignore this email.
              </div>
              <p>Need help? Contact support.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset Request\n\nHi ${userName || 'User'},\n\nYour password reset code is: ${otpCode}\n\nValid for ${expiryMinutes} minutes. Use at: ${APP_URL}\n\nIf you didn't request this, please ignore this email.\n\n— ${APP_NAME}`,
  };
}

function get2FAOTPTemplate(userName, otpCode, expiryMinutes = 5) {
  return {
    subject: '🔐 Your Two-Factor Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .otp-box { background-color: #fff; border: 2px dashed #059669; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; font-family: monospace; }
            .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 5px; margin: 15px 0; color: #92400e; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Two-Factor Verification</h2>
            </div>
            <div class="content">
              <p>Hi ${userName || 'User'},</p>
              <p>Use the code below to complete your sign-in or enable two-factor authentication:</p>
              <div class="otp-box">
                <div class="otp-code">${otpCode}</div>
                <p style="color: #6b7280; margin-top: 10px;">Valid for ${expiryMinutes} minutes</p>
              </div>
              <div class="warning">
                <strong>🔒 Security:</strong> Never share this code. We will never ask for it via email or phone.
              </div>
              <p>If you didn't request this, please secure your account.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Two-Factor Verification\n\nHi ${userName || 'User'},\n\nYour verification code is: ${otpCode}\n\nValid for ${expiryMinutes} minutes. Never share this code.\n\n— ${APP_NAME}`,
  };
}

module.exports = {
  getRegistrationOTPTemplate,
  getPasswordResetOTPTemplate,
  get2FAOTPTemplate,
};
