const supportTicketRepo = require('../repositories/supportTicket.repo');

/**
 * Create a new support ticket
 */
exports.create = async (userId, subject, message, category) => {
  return supportTicketRepo.create(userId, subject, message, category);
};

/**
 * Get user's support tickets
 */
exports.getByUser = async (userId) => {
  return supportTicketRepo.findByUser(userId);
};

/**
 * Get all open tickets for admin review
 */
exports.getOpenTickets = async () => {
  return supportTicketRepo.findOpen();
};

/**
 * Admin replies to a ticket
 */
exports.reply = async (ticketId, adminReply, status = 'RESOLVED') => {
  await supportTicketRepo.reply(ticketId, adminReply, status);
};
