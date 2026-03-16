const Loan = require('../models/Loan');
const LoanPayment = require('../models/LoanPayment');
const { generateId } = require('../utils/idGenerator');

const createLoan = async (data) => {
  const loanId = await generateId(Loan, 'loanId', 'MYFIN-LN-');
  const r = data.interestRate / 12 / 100;
  const n = data.tenureMonths;
  const p = data.loanAmount;
  const emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  return Loan.create({ ...data, loanId, emi, remainingBalance: data.loanAmount });
};

const findByCustomer = (customerId) => Loan.find({ customerId }).sort({ createdAt: -1 });
const findAll = () => Loan.find().sort({ createdAt: -1 });
const findById = (loanId) => Loan.findOne({ loanId });
const updateLoan = (loanId, data) => Loan.findOneAndUpdate({ loanId }, data, { new: true });

const createPayment = async (data) => {
  const paymentId = await generateId(LoanPayment, 'paymentId', 'MYFIN-PAY-');
  return LoanPayment.create({ ...data, paymentId });
};

const findPaymentsByLoan = (loanId) => LoanPayment.find({ loanId }).sort({ paidAt: 1 });
const countPayments = (loanId) => LoanPayment.countDocuments({ loanId });

module.exports = { createLoan, findByCustomer, findAll, findById, updateLoan, createPayment, findPaymentsByLoan, countPayments };
