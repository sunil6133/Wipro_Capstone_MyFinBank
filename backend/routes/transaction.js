const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Account = require('../models/Account');
const accountService = require('../services/accountService');
const transactionService = require('../services/transactionService');
const { sendBalanceZeroAlert } = require('../utils/email');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');

const resolveAccount = async (accountNumber, customerId) => {
  if (accountNumber) {
    const acc = await accountService.findByAccountNumber(accountNumber);
    if (!acc || acc.customerId !== customerId) return null;
    return acc;
  }
  const accounts = await accountService.findByCustomer(customerId);
  return accounts.find(a => a.status === 'ACTIVE') || null;
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

router.get('/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const accounts = await accountService.findByCustomer(req.user.customerId);
    const allTxns = [];
    for (const acc of accounts) {
      const txns = await transactionService.findByAccount(acc.accountNumber);
      allTxns.push(...txns);
    }
    allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, transactions: allTxns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/deposit', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountNumber, amount, description } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const account = await resolveAccount(accountNumber, req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const isAutoDeactivated = account.status === 'DEACTIVATED' && account.deactivationType === 'AUTO';
    if (!['ACTIVE', 'AT_RISK'].includes(account.status) && !isAutoDeactivated) {
      return res.status(400).json({ success: false, message: `Account is ${account.status}. Cannot deposit.` });
    }

    const newBalance = account.balance + Number(amount);
    await Account.findOneAndUpdate(
      { accountNumber: account.accountNumber },
      { $set: { balance: newBalance, status: 'ACTIVE' }, $unset: { deactivationType: '', atRiskSince: '' } }
    );

    const txn = await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'DEPOSIT',
      type: 'CREDIT',
      amount: Number(amount),
      balanceAfterTxn: newBalance,
      description: description || 'Cash Deposit'
    });

    res.json({ success: true, transaction: txn, newBalance, accountNumber: account.accountNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/withdraw', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountNumber, amount, description } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const account = await resolveAccount(accountNumber, req.user.customerId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Account is ${account.status}. Cannot withdraw.` });

    const overdraftLimit = account.accountType === 'CURRENT' ? (account.overdraftLimit || 0) : 0;
    if (account.balance - Number(amount) < -overdraftLimit) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const newBalance = account.balance - Number(amount);
    await Account.findOneAndUpdate({ accountNumber: account.accountNumber }, { $set: { balance: newBalance } });

    const txn = await transactionService.createTransaction({
      accountNumber: account.accountNumber,
      transactionCategory: 'WITHDRAW',
      type: 'DEBIT',
      amount: Number(amount),
      balanceAfterTxn: newBalance,
      description: description || 'Cash Withdrawal'
    });

    account.balance = newBalance;
    await checkAtRisk(account);

    res.json({ success: true, transaction: txn, newBalance, accountNumber: account.accountNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/transfer', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { fromAccountNumber, toAccountNumber, amount, description } = req.body;
    if (!toAccountNumber) return res.status(400).json({ success: false, message: 'Recipient account required' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

    const fromAccount = await resolveAccount(fromAccountNumber, req.user.customerId);
    if (!fromAccount) return res.status(404).json({ success: false, message: 'Source account not found' });
    if (fromAccount.status !== 'ACTIVE') return res.status(400).json({ success: false, message: `Source account is ${fromAccount.status}` });

    const toAccount = await accountService.findByAccountNumber(toAccountNumber);
    if (!toAccount) return res.status(404).json({ success: false, message: `Recipient account ${toAccountNumber} not found` });
    if (!['ACTIVE', 'AT_RISK'].includes(toAccount.status)) return res.status(400).json({ success: false, message: 'Recipient account is not active' });
    if (fromAccount.accountNumber === toAccountNumber) return res.status(400).json({ success: false, message: 'Cannot transfer to the same account' });

    const overdraftLimit = fromAccount.accountType === 'CURRENT' ? (fromAccount.overdraftLimit || 0) : 0;
    if (fromAccount.balance - Number(amount) < -overdraftLimit) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const newFromBalance = fromAccount.balance - Number(amount);
    const newToBalance = toAccount.balance + Number(amount);
    await Account.findOneAndUpdate({ accountNumber: fromAccount.accountNumber }, { $set: { balance: newFromBalance } });
    await Account.findOneAndUpdate({ accountNumber: toAccount.accountNumber }, { $set: { balance: newToBalance } });

    const refId = 'REF' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

    const debitTxn = await transactionService.createTransaction({
      accountNumber: fromAccount.accountNumber,
      referenceId: refId,
      transactionCategory: 'TRANSFER',
      type: 'DEBIT',
      amount: Number(amount),
      balanceAfterTxn: newFromBalance,
      description: description || `Transfer to ${toAccountNumber}`
    });

    await transactionService.createTransaction({
      accountNumber: toAccount.accountNumber,
      referenceId: refId,
      transactionCategory: 'TRANSFER',
      type: 'CREDIT',
      amount: Number(amount),
      balanceAfterTxn: newToBalance,
      description: `Transfer from ${fromAccount.accountNumber}`
    });

    fromAccount.balance = newFromBalance;
    await checkAtRisk(fromAccount);

    res.json({ success: true, transaction: debitTxn, newBalance: newFromBalance, referenceId: refId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const transactions = await transactionService.findAll();
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
