const SupportTicket = require('../models/SupportTicket');
const SupportMessage = require('../models/SupportMessage');
const { generateId } = require('../utils/idGenerator');

const createTicket = async (data) => {
  const ticketId = await generateId(SupportTicket, 'ticketId', 'MYFIN-TKT-');
  return SupportTicket.create({ ...data, ticketId });
};

const findTicketsByCustomer = (customerId) => SupportTicket.find({ customerId }).sort({ createdAt: -1 });

const findAllTickets = () => SupportTicket.find().sort({ createdAt: -1 });

const findTicketById = (ticketId) => SupportTicket.findOne({ ticketId });

const updateTicket = (ticketId, data) =>
  SupportTicket.findOneAndUpdate({ ticketId }, data, { new: true });

const createMessage = async (data) => {
  const messageId = await generateId(SupportMessage, 'messageId', 'MYFIN-MSG-');
  return SupportMessage.create({ ...data, messageId });
};

const findMessagesByTicket = (ticketId) => SupportMessage.find({ ticketId }).sort({ timestamp: 1 });

module.exports = { createTicket, findTicketsByCustomer, findAllTickets, findTicketById, updateTicket, createMessage, findMessagesByTicket };
