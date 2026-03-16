const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const loanService = require('../services/loanService');
const accountService = require('../services/accountService');
const transactionService = require('../services/transactionService');
const { sendBalanceZeroAlert } = require('../utils/email');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');

const checkAtRisk = async (account) => {
  const isAtRisk =
    (account.accountType === 'SAVINGS' && account.balance <= 0) ||
    (account.accountType === 'CURRENT' && account.balance < -(account.overdraftLimit || 0));
  if (isAtRisk && account.status === 'ACTIVE') {
    await Account.findOneAndUpdate(
      { accountNumber: account.accountNumber },
      { $set: { status: 'AT_RISK', atRiskSince: new Date() } }
    );
    try { await sendBalanceZeroAlert(account.customerId, account.accountNumber); } catch (_) {}
  }
};

router.post('/calculate-emi', authMiddleware, (req, res) => {
  const { principal, rate, months } = req.body;
  if (!principal || !rate || !months) {
    return res.status(400).json({ success: false, message: 'principal, rate and months are required' });
  }
  const r = Number(rate) / 12 / 100;
  const n = Number(months);
  const p = Number(principal);
  const emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  res.json({ success: true, emi, totalPayable: Math.round(emi * n), totalInterest: Math.round(emi * n - p) });
});

router.post('/apply', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountNumber, loanAmount, interestRate, tenureMonths, purpose } = req.body;
    if (!loanAmount || !interestRate || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'loanAmount, interestRate and tenureMonths are required' });
    }

    let account;
    if (accountNumber) {
      account = await accountService.findByAccountNumber(accountNumber);
      if (!account || account.customerId !== req.user.customerId) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }
    } else {
      const accounts = await accountService.findByCustomer(req.user.customerId);
      account = accounts.find(a => a.status === 'ACTIVE');
    }

    if (!account) return res.status(404).json({ success: false, message: 'No active account found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}` });

    const existing = await loanService.findByCustomer(req.user.customerId);
    if (existing.some(l => l.status === 'PENDING')) {
      return res.status(400).json({ success: false, message: 'You already have a pending loan application' });
    }

    const loan = await loanService.createLoan({
      customerId: req.user.customerId,
      accountNumber: account.accountNumber,
      loanAmount: Number(loanAmount),
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths),
      purpose: purpose || ''
    });

    res.status(201).json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const loans = await loanService.findByCustomer(req.user.customerId);
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:loanId/pay-emi', authMiddleware, customerOnly, async (req, res) => {
  try {
    const loan = await loanService.findById(req.params.loanId);
    if (!loan || loan.customerId !== req.user.customerId) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    if (!['APPROVED', 'ACTIVE'].includes(loan.status)) {
      return res.status(400).json({ success: false, message: 'Loan is not approved' });
    }

    const account = await accountService.findByAccountNumber(loan.accountNumber);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}` });
    if (account.balance < loan.emi) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Required: Rs.${loan.emi}` });
    }

    const newBalance = account.balance - loan.emi;
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    const paidCount = await loanService.countPayments(loan.loanId);
    const emiNumber = paidCount + 1;
    const newRemainingBalance = (loan.remainingBalance || loan.loanAmount) - loan.emi;
    const newStatus = newRemainingBalance <= 0 ? 'CLOSED' : 'ACTIVE';

    const txn = await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'LOAN_EMI',
      type: 'DEBIT',
      amount: loan.emi,
      balanceAfterTxn: newBalance,
      description: `EMI #${emiNumber} - ${loan.loanId}`
    });

    await loanService.createPayment({
      loanId: loan.loanId,
      accountNumber: account.accountNumber,
      emiNumber,
      amount: loan.emi,
      referenceId: txn.txnId,
      status: 'PAID'
    });

    await loanService.updateLoan(loan.loanId, {
      status: newStatus,
      remainingBalance: Math.max(0, newRemainingBalance)
    });

    account.balance = newBalance;
    await checkAtRisk(account);

    res.json({ success: true, message: `EMI #${emiNumber} paid`, newBalance, loanStatus: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:loanId/payments', authMiddleware, async (req, res) => {
  try {
    const payments = await loanService.findPaymentsByLoan(req.params.loanId);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const loans = await loanService.findAll();
    res.json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:loanId/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const loan = await loanService.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Loan is not pending' });

    const account = await accountService.findByAccountNumber(loan.accountNumber);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const newBalance = account.balance + loan.loanAmount;
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'LOAN_EMI',
      type: 'CREDIT',
      amount: loan.loanAmount,
      balanceAfterTxn: newBalance,
      description: `Loan Disbursed - ${loan.loanId}`
    });

    const updated = await loanService.updateLoan(loan.loanId, {
      status: 'APPROVED',
      disbursedAt: new Date(),
      startDate: new Date()
    });

    res.json({ success: true, loan: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:loanId/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { adminComment } = req.body;
    const loan = await loanService.findById(req.params.loanId);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Loan is not pending' });
    const updated = await loanService.updateLoan(loan.loanId, { status: 'REJECTED', adminComment: adminComment || 'Rejected by admin' });
    res.json({ success: true, loan: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;