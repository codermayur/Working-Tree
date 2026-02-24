/**
 * Socket handlers for chat: conversation join, message send, typing, read, reaction, edit, unsend.
 */
const chatService = require('../modules/chat/chat.service');
const notificationService = require('../modules/notification/notification.service');
const notificationSocket = require('../modules/notification/notification.socket');
const { getIO } = require('../socket');
const { messageRateLimit } = require('./rateLimit');
const logger = require('../config/logger');

async function handleConversationJoin(io, socket, conversationId) {
  if (!conversationId) {
    socket.emit('error', { message: 'conversationId required' });
    return;
  }
  const isMember = await chatService.isParticipant(conversationId, socket.userId);
  if (!isMember) {
    socket.emit('error', { message: 'Conversation not found or access denied' });
    return;
  }
  socket.join(conversationId);
  socket.emit('conversation:joined', { conversationId });
  try {
    const messageIds = await chatService.markAsSeen(conversationId, socket.userId);
    if (messageIds.length && io) {
      io.to(conversationId).emit('message:seen', { conversationId, userId: socket.userId, messageIds });
    }
  } catch (err) {
    logger.error('[socket] conversation join markAsSeen', err);
  }
}

async function handleMessageSend(io, socket, data) {
  const { conversationId, type, content, replyToId } = data || {};
  if (!conversationId) {
    socket.emit('error', { message: 'conversationId required' });
    return;
  }
  if (!messageRateLimit.check(socket.userId)) {
    socket.emit('error', { message: 'Too many messages. Please slow down.' });
    return;
  }
  const isMember = await chatService.isParticipant(conversationId, socket.userId);
  if (!isMember) {
    socket.emit('error', { message: 'Conversation not found or access denied' });
    return;
  }
  try {
    const payload = type === 'text' ? (content?.text ?? content) : content;
    const message = await chatService.createMessage(
      conversationId,
      socket.userId,
      type || 'text',
      payload,
      replyToId || null
    );
    io.to(conversationId).emit('message:new', message);

    setImmediate(() => {
      chatService.getOtherParticipant(conversationId, socket.userId).then((recipientId) => {
        if (!recipientId) return;
        notificationService.create({
          recipient: recipientId,
          sender: socket.userId,
          type: 'message',
          entityId: conversationId,
          entityType: 'conversation',
          message: 'sent you a message',
          metadata: { conversationId, messageId: message._id },
        }).then((created) => {
          if (created) {
            try {
              const ioInstance = getIO();
              notificationSocket.emitNewNotification(
                ioInstance,
                created.notification.recipient,
                created.notification,
                created.unreadCount
              );
            } catch (_) {}
          }
        }).catch(() => {});
      }).catch(() => {});
    });
  } catch (err) {
    logger.error('[socket] message:send', err);
    socket.emit('error', { message: err.message || 'Failed to send message' });
  }
}

async function handleMessageSeen(io, socket, conversationId) {
  if (!conversationId) return;
  try {
    const messageIds = await chatService.markAsSeen(conversationId, socket.userId);
    io.to(conversationId).emit('message:seen', { conversationId, userId: socket.userId, messageIds });
  } catch (err) {
    logger.error('[socket] message:seen', err);
  }
}

async function handleMessageDelivered(io, socket, data) {
  const { messageId } = data || {};
  if (!messageId) return;
  try {
    const msg = await chatService.markAsDelivered(messageId, socket.userId);
    io.to(msg.conversation.toString()).emit('message:delivered', { messageId, userId: socket.userId, message: msg });
  } catch (err) {
    logger.error('[socket] message:delivered', err);
  }
}

async function handleMessageReaction(io, socket, data) {
  const { messageId, emoji } = data || {};
  if (!messageId || !emoji) {
    socket.emit('error', { message: 'messageId and emoji required' });
    return;
  }
  try {
    const msg = await chatService.addReaction(messageId, socket.userId, emoji);
    const out = msg.toObject ? msg.toObject() : msg;
    out.content = msg.text ? { text: msg.text } : (msg.attachment?.url ? { url: msg.attachment.url } : {});
    io.to(msg.conversation.toString()).emit('message:reaction', { messageId, message: out });
  } catch (err) {
    logger.error('[socket] message:reaction', err);
    socket.emit('error', { message: err.message || 'Failed to add reaction' });
  }
}

async function handleMessageEdit(io, socket, data) {
  const { messageId, text } = data || {};
  if (!messageId || text == null) {
    socket.emit('error', { message: 'messageId and text required' });
    return;
  }
  try {
    const msg = await chatService.editMessage(messageId, socket.userId, String(text));
    const out = msg.toObject ? msg.toObject() : msg;
    out.content = { text: out.text };
    io.to(msg.conversation.toString()).emit('message:edit', { messageId, message: out });
  } catch (err) {
    logger.error('[socket] message:edit', err);
    socket.emit('error', { message: err.message || 'Failed to edit message' });
  }
}

async function handleMessageUnsend(io, socket, data) {
  const { messageId } = data || {};
  if (!messageId) return;
  try {
    const msg = await chatService.unsendMessage(messageId, socket.userId);
    io.to(msg.conversation.toString()).emit('message:unsend', { messageId, conversationId: msg.conversation.toString() });
  } catch (err) {
    logger.error('[socket] message:unsend', err);
    socket.emit('error', { message: err.message || 'Failed to unsend message' });
  }
}

function handleTypingStart(socket, conversationId) {
  if (conversationId) {
    socket.to(conversationId).emit('user:typing', { userId: socket.userId, conversationId });
  }
}

function handleTypingStop(socket, conversationId) {
  if (conversationId) {
    socket.to(conversationId).emit('user:stopped-typing', { userId: socket.userId, conversationId });
  }
}

module.exports = {
  handleConversationJoin,
  handleMessageSend,
  handleMessageSeen,
  handleMessageDelivered,
  handleMessageReaction,
  handleMessageEdit,
  handleMessageUnsend,
  handleTypingStart,
  handleTypingStop,
};
