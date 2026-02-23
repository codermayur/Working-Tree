const chatService = require('./chat.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { uploadToCloudinary } = require('../../utils/uploadToCloudinary');
const PendingChatFile = require('./models/pending-chat-file.model');

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_MIMES = ['video/mp4', 'video/x-matroska', 'video/avi', 'video/quicktime', 'video/webm'];

const createConversation = asyncHandler(async (req, res) => {
  const { type = 'direct', participants } = req.body;
  const conversation = await chatService.createConversation(
    req.user._id,
    participants,
    type
  );
  res.status(201).json(
    new ApiResponse(201, conversation, 'Conversation created successfully')
  );
});

/** POST /conversations/start — body: { otherUserId }. Get or create direct conversation. Enforces can-chat. */
const startConversation = asyncHandler(async (req, res) => {
  const { otherUserId } = req.body;
  const conversation = await chatService.startConversation(req.user._id, otherUserId);
  res.status(200).json(
    new ApiResponse(200, conversation, conversation.createdAt.getTime() > Date.now() - 5000 ? 'Conversation created' : 'Conversation found')
  );
});

const getConversations = asyncHandler(async (req, res) => {
  const result = await chatService.getConversations(req.user._id, req.query);
  res.status(200).json(
    new ApiResponse(200, result.data, 'Conversations fetched successfully', {
      pagination: result.pagination,
    })
  );
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getMessages(
    req.params.conversationId,
    req.user._id,
    req.query
  );
  res.status(200).json(
    new ApiResponse(200, result.data, 'Messages fetched successfully', {
      pagination: result.pagination,
    })
  );
});

/** POST /upload — multipart field "file". Images → Cloudinary; videos/documents → store buffer in MongoDB, return id. */
const uploadChatMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, 'No file uploaded'));
  }
  const file = req.file;
  const buffer = file.buffer;
  const mimetype = file.mimetype || '';
  const originalname = file.originalname || 'file';

  if (IMAGE_MIMES.includes(mimetype)) {
    const result = await uploadToCloudinary(buffer, {
      folder: 'krishiconnect/chat',
      resourceType: 'image',
    });
    return res.status(200).json(
      new ApiResponse(200, { url: result.url, publicId: result.publicId, type: 'image' }, 'Upload successful')
    );
  }

  if (VIDEO_MIMES.includes(mimetype)) {
    const doc = await PendingChatFile.create({
      buffer,
      contentType: mimetype,
      filename: originalname,
      size: file.size,
      uploadedBy: req.user._id,
    });
    return res.status(200).json(
      new ApiResponse(200, {
        id: doc._id.toString(),
        type: 'video',
        contentType: mimetype,
        filename: originalname,
        size: file.size,
      }, 'Upload successful')
    );
  }

  // document (e.g. PDF)
  const doc = await PendingChatFile.create({
    buffer,
    contentType: mimetype,
    filename: originalname,
    size: file.size,
    uploadedBy: req.user._id,
  });
  return res.status(200).json(
    new ApiResponse(200, {
      id: doc._id.toString(),
      type: 'document',
      contentType: mimetype,
      filename: originalname,
      size: file.size,
    }, 'Upload successful')
  );
});

module.exports = {
  createConversation,
  startConversation,
  getConversations,
  getMessages,
  uploadChatMedia,
};
