const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId:  { type: String, unique: true },
  ticketId:   { type: String, required: true },
  senderType: { type: String, enum: ['CUSTOMER', 'ADMIN'], required: true },
  senderId:   { type: String, required: true },
  message:    { type: String, required: true, trim: true },
  timestamp:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportMessage', messageSchema);
