const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId:           { type: String, unique: true },
  accountNumber:    { type: String, required: true },
  customerId:       { type: String, required: true },
  loanAmount:       { type: Number, required: true },
  interestRate:     { type: Number, required: true },
  tenureMonths:     { type: Number, required: true },
  emi:              { type: Number },
  remainingBalance: { type: Number },
  purpose:          { type: String },
  status:           { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED'], default: 'PENDING' },
  adminComment:     { type: String },
  startDate:        { type: Date },
  disbursedAt:      { type: Date },
  createdAt:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loan', loanSchema);
