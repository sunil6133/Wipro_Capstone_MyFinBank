const mongoose = require('mongoose');

const rdSchema = new mongoose.Schema({
  rdId:               { type: String, unique: true },
  accountNumber:      { type: String, required: true },
  monthlyAmount:      { type: Number, required: true },
  tenureMonths:       { type: Number, required: true },
  interestRate:       { type: Number, required: true },
  startDate:          { type: Date, default: Date.now },
  maturityDate:       { type: Date },
  paidInstallments:   { type: Number, default: 0 },
  status:             { type: String, enum: ['ACTIVE', 'MATURED', 'BROKEN'], default: 'ACTIVE' },
  createdAt:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecurringDeposit', rdSchema);
