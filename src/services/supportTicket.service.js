const supportTicketRepo = require('../repositories/supportTicket.repo');
const notificationService = require('./notification.service');


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

  const ticket = await supportTicketRepo.findById(ticketId);
  if (ticket && ticket.user_id) {
    notificationService.sendToUser(
      ticket.user_id,
      '📩 Support Ticket Updated',
      `An admin has replied to your ticket: "${ticket.subject}"`,
      { type: 'support_ticket_reply', ticket_id: ticketId }
    ).catch(err => console.error('Failed to notify user about ticket reply:', err));
  }
};

