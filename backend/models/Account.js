const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  requestId:        { type: String },
  accountNumber:    { type: String },
  customerId:       { type: String, required: true },
  accountType:      { type: String, enum: ['SAVINGS', 'CURRENT'], required: true },
  balance:          { type: Number, default: 0 },
  overdraftLimit:   { type: Number, default: 0 },
  status:           { type: String, enum: ['REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED', 'REJECTED'], default: 'REQUESTED' },
  deactivationType: { type: String, default: undefined },
  atRiskSince:      { type: Date, default: undefined },
  createdAt:        { type: Date, default: Date.now }
});

accountSchema.index({ requestId: 1 }, { unique: true, sparse: true });
accountSchema.index({ accountNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Account', accountSchema);