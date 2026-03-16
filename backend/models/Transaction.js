const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  txnId:               { type: String, unique: true },
  accountNumber:       { type: String, required: true },
  referenceId:         { type: String },
  transactionCategory: { type: String, enum: ['DEPOSIT', 'WITHDRAW', 'TRANSFER', 'FD_INVESTMENT', 'RD_INSTALLMENT', 'LOAN_EMI'], required: true },
  type:                { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
  amount:              { type: Number, required: true },
  balanceAfterTxn:     { type: Number, required: true },
  description:         { type: String },
  date:                { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
