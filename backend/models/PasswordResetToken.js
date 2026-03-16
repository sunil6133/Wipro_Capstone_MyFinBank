const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenId:    { type: String, unique: true },
  customerId: { type: String, required: true },
  otp:        { type: String, required: true },
  expiresAt:  { type: Date, required: true },
  used:       { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('PasswordResetToken', tokenSchema);
