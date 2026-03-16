const PasswordResetToken = require('../models/PasswordResetToken');
const { generateId } = require('../utils/idGenerator');

const createToken = async (customerId) => {
  const tokenId = await generateId(PasswordResetToken, 'tokenId', 'MYFIN-OTP-');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return PasswordResetToken.create({ tokenId, customerId, otp, expiresAt });
};

const findValidToken = (customerId, otp) =>
  PasswordResetToken.findOne({ customerId, otp, used: false, expiresAt: { $gt: new Date() } });

const markUsed = (tokenId) =>
  PasswordResetToken.findOneAndUpdate({ tokenId }, { used: true }, { new: true });

module.exports = { createToken, findValidToken, markUsed };
