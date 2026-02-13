const supportTicketService = require('../services/supportTicket.service');

/**
 * User creates a new support ticket
 */
exports.createTicket = async (req, res) => {
  const ticket = await supportTicketService.create(
    req.user.id,
    req.body.subject,
    req.body.message,
    req.body.category
  );
  res.json({ message: 'Support ticket created', ticket });
};

/**
 * User views their own support tickets
 */
exports.getMyTickets = async (req, res) => {
  const tickets = await supportTicketService.getByUser(req.user.id);
  res.json(tickets);
};

/**
 * Admin views all open tickets
 */
exports.getOpenTickets = async (req, res) => {
  const tickets = await supportTicketService.getOpenTickets();
  res.json(tickets);
};

/**
 * Admin replies to a support ticket
 */
exports.replyToTicket = async (req, res) => {
  await supportTicketService.reply(
    req.body.ticket_id,
    req.body.admin_reply,
    req.body.status
  );
  res.json({ message: 'Reply sent' });
};
