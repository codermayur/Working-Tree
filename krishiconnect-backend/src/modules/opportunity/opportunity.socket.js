const logger = require('../../config/logger');

function emitNewOpportunity(io, opportunity) {
  if (!io || !opportunity) return;
  try {
    io.emit('opportunity:new', opportunity);
  } catch (err) {
    logger.warn('[opportunity.socket] emit new failed', { err: err.message });
  }
}

function emitApplicationEvent(io, ownerId, payload) {
  if (!io || !ownerId || !payload) return;
  try {
    const room = `user:${ownerId.toString()}`;
    io.to(room).emit('opportunity:application', payload);
  } catch (err) {
    logger.warn('[opportunity.socket] emit application failed', { err: err.message });
  }
}

module.exports = {
  emitNewOpportunity,
  emitApplicationEvent,
};

