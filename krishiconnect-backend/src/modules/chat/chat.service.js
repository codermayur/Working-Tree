const Conversation = require('./models/conversation.model');
const Message = require('./models/message.model');
const Follow = require('../user/follow.model');
const userService = require('../user/user.service');
const ApiError = require('../../utils/ApiError');
const Pagination = require('../../utils/pagination');
const { encrypt, decrypt } = require('../../utils/encryption');

const conversationPagination = new Pagination(Conversation);
const messagePagination = new Pagination(Message);

const PREVIEW_MAX_LENGTH = 80;

/**
 * User A can chat with User B iff A follows B OR B follows A (at least one direction),
 * and neither has blocked the other.
 */
async function canChatWith(currentUserId, otherUserId) {
  if (String(currentUserId) === String(otherUserId)) {
    return false;
  }
  const [aFollowsB, bFollowsA, aBlockedB, bBlockedA] = await Promise.all([
    Follow.findOne({ follower: currentUserId, following: otherUserId }),
    Follow.findOne({ follower: otherUserId, following: currentUserId }),
    userService.isBlocked(currentUserId, otherUserId),
    userService.isBlocked(otherUserId, currentUserId),
  ]);
  if (aBlockedB || bBlockedA) return false;
  return !!(aFollowsB || bFollowsA);
}

/**
 * Start or get existing direct conversation. Enforces canChatWith.
 */
async function startConversation(userId, otherUserId) {
  const allowed = await canChatWith(userId, otherUserId);
  if (!allowed) {
    throw new ApiError(403, 'You can only start a chat with users you follow or who follow you');
  }
  const allParticipants = [userId, otherUserId].map((id) => id.toString()).sort();
  let conversation = await Conversation.findOne({
    type: 'direct',
    $and: [
      { 'participants.user': allParticipants[0] },
      { 'participants.user': allParticipants[1] },
    ],
  });
  if (conversation) {
    return conversation.populate('participants.user', 'name avatar profilePhoto expertDetails');
  }
  conversation = await Conversation.create({
    type: 'direct',
    participants: allParticipants.map((id) => ({ user: id })),
  });
  return conversation.populate('participants.user', 'name avatar profilePhoto expertDetails');
}

/**
 * Start or get direct conversation with an expert (Ask an Expert). Skips follow check.
 */
async function startExpertConversation(userId, expertId) {
  const User = require('../user/user.model');
  const expert = await User.findById(expertId).select('role').lean();
  if (!expert || expert.role !== 'expert') {
    throw new ApiError(400, 'Invalid expert');
  }
  const allParticipants = [userId, expertId].map((id) => id.toString()).sort();
  let conversation = await Conversation.findOne({
    type: 'direct',
    $and: [
      { 'participants.user': allParticipants[0] },
      { 'participants.user': allParticipants[1] },
    ],
  });
  if (conversation) {
    return conversation.populate('participants.user', 'name avatar profilePhoto expertDetails');
  }
  conversation = await Conversation.create({
    type: 'direct',
    participants: allParticipants.map((id) => ({ user: id })),
  });
  return conversation.populate('participants.user', 'name avatar profilePhoto expertDetails');
}

const createConversation = async (userId, participants, type = 'direct') => {
  const allParticipants = [userId, ...participants].filter(
    (p, i, arr) => arr.indexOf(p) === i
  );

  if (type === 'direct' && allParticipants.length !== 2) {
    throw new ApiError(400, 'Direct conversation requires exactly 2 participants');
  }

  if (type === 'direct') {
    const allowed = await canChatWith(allParticipants[0], allParticipants[1]);
    if (!allowed) {
      throw new ApiError(403, 'You can only chat with users you follow or who follow you');
    }
  }

  let existing = null;
  if (type === 'direct' && allParticipants.length === 2) {
    const sorted = allParticipants.map((id) => id.toString()).sort();
    existing = await Conversation.findOne({
      type: 'direct',
      $and: [
        { 'participants.user': sorted[0] },
        { 'participants.user': sorted[1] },
      ],
    });
  }

  if (existing) {
    return existing.populate('participants.user', 'name avatar profilePhoto');
  }

  const conversation = await Conversation.create({
    type,
    participants: allParticipants.map((id) => ({ user: id })),
  });

  return conversation.populate('participants.user', 'name avatar profilePhoto');
};

const getConversations = async (userId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  const result = await conversationPagination.paginate(
    { 'participants.user': userId, isActive: true },
    {
      page,
      limit,
      sort: { 'lastMessage.sentAt': -1, updatedAt: -1 },
      populate: [
        { path: 'participants.user', select: 'name avatar profilePhoto' },
        { path: 'lastMessage.sender', select: 'name' },
      ],
    }
  );

  const excludeIds = await userService.getBlockExcludeIds(userId);
  if (excludeIds.length) {
    result.data = result.data.filter((conv) => {
      const other = conv.participants.find((p) => String(p.user?._id ?? p.user) !== String(userId));
      const otherId = other?.user?._id ?? other?.user;
      return otherId && !excludeIds.includes(otherId.toString());
    });
  }

  const unreadCounts = await Promise.all(
    result.data.map(async (conv) => {
      const otherId = conv.participants.find((p) => String(p.user?._id ?? p.user) !== String(userId));
      const otherUserId = otherId?.user?._id ?? otherId?.user;
      const fromOther = await Message.countDocuments({
        conversation: conv._id,
        sender: otherUserId,
        isUnsent: { $ne: true },
        isDeleted: { $ne: true },
      });
      const readByMe = await Message.countDocuments({
        conversation: conv._id,
        sender: otherUserId,
        'readBy.user': userId,
      });
      return { convId: conv._id.toString(), count: Math.max(0, fromOther - readByMe) };
    })
  );
  const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.convId, u.count]));

  const data = result.data.map((conv) => {
    const doc = conv.toObject ? conv.toObject() : conv;
    if (doc.lastMessage && doc.lastMessage.encryptedText && doc.lastMessage.iv) {
      try {
        let text = decrypt(doc.lastMessage.encryptedText, doc.lastMessage.iv, true);
        if (typeof text === 'object' && text != null) text = text.text ?? JSON.stringify(text);
        doc.lastMessage.text = String(text || '').slice(0, PREVIEW_MAX_LENGTH);
      } catch {
        doc.lastMessage.text = doc.lastMessage.text || '[Message]';
      }
      delete doc.lastMessage.encryptedText;
      delete doc.lastMessage.iv;
    }
    doc.unreadCount = unreadMap[doc._id.toString()] ?? 0;
    return doc;
  });

  return { data, pagination: result.pagination };
};

const getMessages = async (conversationId, userId, options = {}) => {
  const { page = 1, limit = 20, before } = options;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': userId,
  });

  if (!conversation) {
    throw new ApiError(403, 'Conversation not found or access denied');
  }

  let query = { conversation: conversationId, isDeleted: { $ne: true } };

  if (before) {
    const beforeMsg = await Message.findById(before);
    if (beforeMsg) {
      query.createdAt = { $lt: beforeMsg.createdAt };
    }
  }

  const result = await messagePagination.paginate(query, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'sender', select: 'name avatar profilePhoto' },
      { path: 'replyTo', select: 'text type sender createdAt', populate: { path: 'sender', select: 'name' } },
      { path: 'reactions.user', select: 'name' },
    ],
  });

  const data = result.data.map((msg) => {
    const doc = msg.toObject ? msg.toObject() : msg;
    if (doc.encryptedContent && doc.iv) {
      try {
        doc.content = decrypt(doc.encryptedContent, doc.iv, true);
      } catch {
        doc.content = { text: doc.text || '[Unable to decrypt]' };
      }
    } else {
      doc.content = doc.type === 'text' ? { text: doc.text || '' } : (doc.attachment?.url ? { url: doc.attachment.url } : { ...doc.attachment });
    }
    delete doc.encryptedContent;
    delete doc.iv;
    if (doc.attachment?.data) doc.attachment.data = '[Buffer]';
    return doc;
  });

  return { data, pagination: result.pagination };
};

function safeEncrypt(plaintext) {
  try {
    return encrypt(plaintext);
  } catch {
    return null;
  }
}

/**
 * Create message. Supports text, image, file; optional replyTo. Encrypts when key is set.
 */
const createMessage = async (conversationId, senderId, type, content, replyToId = null) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    'participants.user': senderId,
  });

  if (!conversation) {
    throw new ApiError(403, 'Conversation not found or access denied');
  }

  const contentPayload = type === 'text' ? { text: content?.text || content || '' } : content || {};
  const encryptedResult = safeEncrypt(type === 'text' ? contentPayload : JSON.stringify(contentPayload));

  const messagePayload = {
    conversation: conversationId,
    sender: senderId,
    type: type || 'text',
    text: type === 'text' ? String(contentPayload.text || '') : '',
    status: 'sent',
    replyTo: replyToId || undefined,
  };
  if (encryptedResult) {
    messagePayload.encryptedContent = encryptedResult.encrypted;
    messagePayload.iv = encryptedResult.iv;
  }
  if (type === 'image' && contentPayload?.url) {
    messagePayload.attachment = {
      type: 'image',
      url: contentPayload.url,
      publicId: contentPayload.publicId || null,
    };
  }
  if (type === 'file' && (contentPayload?.id || contentPayload?.url)) {
    messagePayload.attachment = {
      type: contentPayload.type || 'document',
      url: contentPayload.url || null,
      contentType: contentPayload.contentType,
      filename: contentPayload.filename,
      size: contentPayload.size,
    };
  }

  const message = await Message.create(messagePayload);

  const previewText = type === 'text' ? String(contentPayload.text || '').slice(0, PREVIEW_MAX_LENGTH) : `[${type}]`;
  const previewEnc = safeEncrypt(JSON.stringify(previewText));
  conversation.lastMessage = {
    ...(previewEnc ? { encryptedText: previewEnc.encrypted, iv: previewEnc.iv } : {}),
    text: previewText,
    sender: senderId,
    sentAt: new Date(),
  };
  await conversation.save();

  const populated = await Message.findById(message._id)
    .populate('sender', 'name avatar profilePhoto')
    .populate('replyTo', 'text type sender createdAt');
  const out = populated.toObject ? populated.toObject() : populated;
  out.content = contentPayload;
  delete out.encryptedContent;
  delete out.iv;
  if (out.attachment?.data) out.attachment.data = '[Buffer]';
  return out;
};

/**
 * Verify that userId is a participant of conversationId. Used by socket.
 */
async function isParticipant(conversationId, userId) {
  const conv = await Conversation.findOne(
    { _id: conversationId, 'participants.user': userId },
    { _id: 1 }
  );
  return !!conv;
}

/**
 * Get the other participant's user id in a direct conversation (for notification recipient).
 */
async function getOtherParticipant(conversationId, excludeUserId) {
  const conv = await Conversation.findById(conversationId).select('participants.user').lean();
  if (!conv || !conv.participants?.length) return null;
  const other = conv.participants.find(
    (p) => p.user && String(p.user) !== String(excludeUserId)
  );
  return other?.user || null;
}

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

async function markAsSeen(conversationId, userId) {
  const conv = await Conversation.findOne({ _id: conversationId, 'participants.user': userId });
  if (!conv) throw new ApiError(403, 'Conversation not found');
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      isUnsent: { $ne: true },
    },
    { $push: { readBy: { user: userId, readAt: new Date() } }, $set: { status: 'read' } }
  );
  return Message.find({ conversation: conversationId, 'readBy.user': userId })
    .select('_id')
    .lean()
    .then((msgs) => msgs.map((m) => m._id.toString()));
}

async function markAsDelivered(messageId, userId) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new ApiError(404, 'Message not found');
  const isMember = await isParticipant(msg.conversation, userId);
  if (!isMember) throw new ApiError(403, 'Access denied');
  if (!msg.deliveredTo) msg.deliveredTo = [];
  if (msg.deliveredTo.some((id) => String(id) === String(userId))) return msg;
  msg.deliveredTo.push(userId);
  if (msg.status === 'sent') msg.status = 'delivered';
  await msg.save();
  return msg.populate('sender', 'name avatar profilePhoto');
}

async function addReaction(messageId, userId, emoji) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new ApiError(404, 'Message not found');
  const isMember = await isParticipant(msg.conversation, userId);
  if (!isMember) throw new ApiError(403, 'Access denied');
  const existing = msg.reactions?.find((r) => String(r.user) === String(userId));
  if (existing) {
    existing.emoji = emoji;
  } else {
    msg.reactions = msg.reactions || [];
    msg.reactions.push({ user: userId, emoji });
  }
  await msg.save();
  return Message.findById(messageId).populate('sender', 'name avatar profilePhoto').populate('reactions.user', 'name');
}

async function editMessage(messageId, userId, text) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new ApiError(404, 'Message not found');
  if (String(msg.sender) !== String(userId)) throw new ApiError(403, 'Not your message');
  if (msg.type !== 'text') throw new ApiError(400, 'Only text messages can be edited');
  if (Date.now() - new Date(msg.createdAt).getTime() > EDIT_WINDOW_MS) throw new ApiError(400, 'Edit window expired (15 minutes)');
  if (msg.isUnsent) throw new ApiError(400, 'Cannot edit unsent message');
  msg.text = text;
  msg.isEdited = true;
  msg.editedAt = new Date();
  const enc = safeEncrypt({ text });
  if (enc) {
    msg.encryptedContent = enc.encrypted;
    msg.iv = enc.iv;
  }
  await msg.save();
  return msg.populate('sender', 'name avatar profilePhoto').populate('replyTo', 'text type sender createdAt');
}

async function unsendMessage(messageId, userId) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new ApiError(404, 'Message not found');
  if (String(msg.sender) !== String(userId)) throw new ApiError(403, 'Not your message');
  msg.isUnsent = true;
  msg.text = '';
  msg.encryptedContent = undefined;
  msg.iv = undefined;
  msg.attachment = undefined;
  await msg.save();
  return msg.populate('sender', 'name avatar profilePhoto');
}

module.exports = {
  canChatWith,
  startConversation,
  startExpertConversation,
  createConversation,
  getConversations,
  getMessages,
  createMessage,
  isParticipant,
  getOtherParticipant,
  markAsSeen,
  markAsDelivered,
  addReaction,
  editMessage,
  unsendMessage,
};
