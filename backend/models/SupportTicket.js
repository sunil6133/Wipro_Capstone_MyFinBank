const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId:   { type: String, unique: true },
  customerId: { type: String, required: true },
  subject:    { type: String, required: true },
  status:     { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportTicket', ticketSchema);
