const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const aiService = require('./ai.service');

const ask = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required');
  }
  const userId = (user._id || user.id).toString();
  const question = req.body?.question;
  const model = req.body?.model || null;
  if (question == null || typeof question !== 'string') {
    throw new ApiError(400, 'Question is required.');
  }
  const data = await aiService.ask(userId, question, model);
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
  if (message == null || typeof message !== 'string') {
    throw new ApiError(400, 'Message is required.');
  }
  const data = await aiService.ask(userId, message, model);
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
    await aiService.askStream(userId, question, writeChunk, model);
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

module.exports = {
  ask,
  askStream,
  chat,
};
