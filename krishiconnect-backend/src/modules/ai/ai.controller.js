const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const aiService = require('./ai.service');

const ask = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  const userId = (user._id || user.id).toString();
  const question = req.body?.question;
  const model = req.body?.model || null;
  const responseLanguage = user.preferences?.language || 'en';
  if (question == null || typeof question !== 'string') {
    throw new ApiError(400, 'Question is required.');
  }
  const data = await aiService.ask(userId, question, model, responseLanguage);
  res.status(200).json(new ApiResponse(200, data, 'OK'));
});

/**
 * POST /ai/chat — non-streaming chat. Body: { message }. Returns { success, response, timestamp }.
 * Same domain restriction and validation as /ask; does not call Groq for non-agriculture input.
 */
const chat = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  const userId = (user._id || user.id).toString();
  const message = req.body?.message;
  const model = req.body?.model || null;
  const responseLanguage = user.preferences?.language || 'en';
  if (message == null || typeof message !== 'string') {
    throw new ApiError(400, 'Message is required.');
  }
  const data = await aiService.ask(userId, message, model, responseLanguage);
  res.status(200).json(
    new ApiResponse(200, {
      success: true,
      response: data.answer,
      timestamp: new Date().toISOString(),
    }, 'OK')
  );
});

/**
 * Streaming response: SSE. Sets headers and streams chunks as data: { "content": "..." }\n\n
 */
const askStream = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  const userId = (user._id || user.id).toString();
  const question = req.body?.question;
  const model = req.body?.model || null;
  const responseLanguage = user.preferences?.language || 'en';
  if (question == null || typeof question !== 'string') {
    throw new ApiError(400, 'Question is required.');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const writeChunk = (text) => {
    const payload = JSON.stringify({ content: text });
    res.write(`data: ${payload}\n\n`);
    res.flush?.();
  };

  try {
    await aiService.askStream(userId, question, writeChunk, model, responseLanguage);
    res.write('data: [DONE]\n\n');
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'AI request failed';
    const payload = JSON.stringify({ error: true, status, message });
    res.write(`data: ${payload}\n\n`);
  } finally {
    res.end();
  }
});

const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const cropDoctorPredict = asyncHandler(async (req, res) => {
  // Debug: log what we received (req.body is empty for multipart; req.file has the upload)
  logger.info('[crop-doctor] request received', {
    hasFile: !!req.file,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    fileField: req.file ? req.file.fieldname : null,
    mimetype: req.file ? req.file.mimetype : null,
    size: req.file && req.file.buffer ? req.file.buffer.length : 0,
  });

  if (!req.file) {
    const message = 'No image was uploaded. Send the image as multipart/form-data with field name "image".';
    throw new ApiError(400, message);
  }
  const mimetype = (req.file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMETYPES.includes(mimetype)) {
    const message = `Unsupported image type: "${req.file.mimetype}". Only JPG and PNG are supported.`;
    throw new ApiError(400, message);
  }
  const result = await aiService.predictCropDisease(req.file.buffer, req.file.mimetype);
  res.status(200).json(new ApiResponse(200, result, 'Prediction successful'));
});

module.exports = {
  ask,
  askStream,
  chat,
  cropDoctorPredict,
};
