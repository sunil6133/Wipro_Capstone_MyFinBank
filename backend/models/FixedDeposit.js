const mongoose = require('mongoose');

const fdSchema = new mongoose.Schema({
  fdId:           { type: String, unique: true },
  accountNumber:  { type: String, required: true },
  amount:         { type: Number, required: true },
  interestRate:   { type: Number, required: true },
  tenureMonths:   { type: Number, required: true },
  startDate:      { type: Date, default: Date.now },
  maturityDate:   { type: Date },
  maturityAmount: { type: Number },
  status:         { type: String, enum: ['ACTIVE', 'MATURED', 'BROKEN'], default: 'ACTIVE' },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('FixedDeposit', fdSchema);
