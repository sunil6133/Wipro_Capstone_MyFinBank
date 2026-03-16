const mongoose = require('mongoose');

const loanPaymentSchema = new mongoose.Schema({
  paymentId:     { type: String, unique: true },
  loanId:        { type: String, required: true },
  emiNumber:     { type: Number },
  accountNumber: { type: String, required: true },
  amount:        { type: Number, required: true },
  referenceId:   { type: String },
  status:        { type: String, enum: ['PAID', 'PENDING'], default: 'PAID' },
  paymentDate:   { type: Date, default: Date.now },
  paidAt:        { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoanPayment', loanPaymentSchema);
