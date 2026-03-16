const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const investmentService = require('../services/investmentService');
const accountService = require('../services/accountService');
const transactionService = require('../services/transactionService');
const { sendBalanceZeroAlert } = require('../utils/email');
const { authMiddleware, customerOnly } = require('../middleware/authMiddleware');

const resolveAccount = async (accountNumber, customerId) => {
  if (!accountNumber) {
    const accounts = await accountService.findByCustomer(customerId);
    return accounts.find(a => a.status === 'ACTIVE') || null;
  }
  const account = await accountService.findByAccountNumber(accountNumber);
  if (!account || account.customerId !== customerId) return null;
  return account;
};

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

router.post('/fd', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountNumber, amount, interestRate, tenureMonths } = req.body;
    if (!amount || !interestRate || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'amount, interestRate and tenureMonths are required' });
    }
    const account = await resolveAccount(accountNumber, req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}` });
    if (account.balance < Number(amount)) return res.status(400).json({ success: false, message: `Insufficient balance. Available: Rs.${account.balance}` });

    const newBalance = account.balance - Number(amount);
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    const fd = await investmentService.createFD({
      accountNumber: account.accountNumber,
      amount: Number(amount),
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths)
    });

    await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'FD_INVESTMENT',
      type: 'DEBIT',
      amount: Number(amount),
      balanceAfterTxn: newBalance,
      description: `Fixed Deposit Created - ${fd.fdId}`
    });

    account.balance = newBalance;
    await checkAtRisk(account);

    res.status(201).json({ success: true, fd, newBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/fd/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const accounts = await accountService.findByCustomer(req.user.customerId);
    const fds = [];
    for (const acc of accounts) {
      const accFDs = await investmentService.findFDByAccount(acc.accountNumber);
      fds.push(...accFDs);
    }
    res.json({ success: true, fds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rd', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountNumber, monthlyAmount, interestRate, tenureMonths } = req.body;
    if (!monthlyAmount || !interestRate || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'monthlyAmount, interestRate and tenureMonths are required' });
    }
    const account = await resolveAccount(accountNumber, req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}` });
    if (account.balance < Number(monthlyAmount)) return res.status(400).json({ success: false, message: `Insufficient balance. Available: Rs.${account.balance}` });

    const newBalance = account.balance - Number(monthlyAmount);
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    const rd = await investmentService.createRD({
      accountNumber: account.accountNumber,
      monthlyAmount: Number(monthlyAmount),
      interestRate: Number(interestRate),
      tenureMonths: Number(tenureMonths),
      paidInstallments: 1
    });

    await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'RD_INSTALLMENT',
      type: 'DEBIT',
      amount: Number(monthlyAmount),
      balanceAfterTxn: newBalance,
      description: `RD Installment 1/${tenureMonths} - ${rd.rdId}`
    });

    account.balance = newBalance;
    await checkAtRisk(account);

    res.status(201).json({ success: true, rd, newBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rd/:rdId/pay', authMiddleware, customerOnly, async (req, res) => {
  try {
    const rd = await investmentService.findRDById(req.params.rdId);
    if (!rd) return res.status(404).json({ success: false, message: 'RD not found' });
    if (rd.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'RD is not active' });
    if (rd.paidInstallments >= rd.tenureMonths) return res.status(400).json({ success: false, message: 'All installments paid' });

    const account = await accountService.findByAccountNumber(rd.accountNumber);
    if (!account || account.customerId !== req.user.customerId) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}` });
    if (account.balance < rd.monthlyAmount) return res.status(400).json({ success: false, message: `Insufficient balance. Required: Rs.${rd.monthlyAmount}` });

    const newBalance = account.balance - rd.monthlyAmount;
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    const newPaid = rd.paidInstallments + 1;
    const newStatus = newPaid >= rd.tenureMonths ? 'MATURED' : 'ACTIVE';
    await investmentService.updateRD(rd.rdId, { paidInstallments: newPaid, status: newStatus });

    await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'RD_INSTALLMENT',
      type: 'DEBIT',
      amount: rd.monthlyAmount,
      balanceAfterTxn: newBalance,
      description: `RD Installment ${newPaid}/${rd.tenureMonths} - ${rd.rdId}`
    });

    account.balance = newBalance;
    await checkAtRisk(account);

    res.json({ success: true, message: `Installment ${newPaid} paid`, newBalance, rdStatus: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/rd/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const accounts = await accountService.findByCustomer(req.user.customerId);
    const rds = [];
    for (const acc of accounts) {
      const accRDs = await investmentService.findRDByAccount(acc.accountNumber);
      rds.push(...accRDs);
    }
    res.json({ success: true, rds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;