const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const accountService = require('../services/accountService');
const customerService = require('../services/customerService');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');

router.get('/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const accounts = await accountService.findByCustomer(req.user.customerId);
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/request', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { accountType } = req.body;
    if (!accountType || !['SAVINGS', 'CURRENT'].includes(accountType)) {
      return res.status(400).json({ success: false, message: 'accountType must be SAVINGS or CURRENT' });
    }

    const existing = await accountService.findByCustomer(req.user.customerId);

    const nonRejected = existing.filter(a => a.status !== 'REJECTED');
    if (nonRejected.length >= 2) {
      return res.status(400).json({ success: false, message: 'You already have the maximum of 2 accounts (Savings + Current).' });
    }

    const conflict = existing.find(a => a.accountType === accountType && ['REQUESTED', 'ACTIVE', 'AT_RISK', 'DEACTIVATED'].includes(a.status));
    if (conflict) {
      return res.status(400).json({ success: false, message: `You already have a ${accountType} account (${conflict.status}). You cannot request the same type twice.` });
    }

    const account = await accountService.createAccount(req.user.customerId, accountType);
    res.status(201).json({ success: true, account, message: 'Account request submitted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const accounts = await accountService.findAll();
    const enriched = await Promise.all(accounts.map(async (acc) => {
      try {
        const customer = await customerService.findById(acc.customerId);
        return { ...acc.toObject(), customerName: customer?.name || '' };
      } catch {
        return { ...acc.toObject(), customerName: '' };
      }
    }));
    res.json({ success: true, accounts: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/requested', authMiddleware, adminOnly, async (req, res) => {
  try {
    const accounts = await accountService.findRequested();
    res.json({ success: true, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:requestId/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const account = await accountService.approveAccount(req.params.requestId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:requestId/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const account = await accountService.rejectAccount(req.params.requestId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:accountNumber/deactivate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { accountNumber: req.params.accountNumber },
      { $set: { status: 'DEACTIVATED', deactivationType: 'MANUAL' } },
      { new: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:accountNumber/activate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const accountToActivate = await Account.findOne({ accountNumber: req.params.accountNumber });
    if (!accountToActivate) return res.status(404).json({ success: false, message: 'Account not found' });

    const allCustomerAccounts = await accountService.findByCustomer(accountToActivate.customerId);
    const activeCount = allCustomerAccounts.filter(a =>
      ['ACTIVE', 'AT_RISK'].includes(a.status) && a.accountNumber !== req.params.accountNumber
    ).length;

    if (activeCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate. This customer already has 2 active accounts (Savings + Current). Deactivate one first.'
      });
    }

    if (activeCount >= 1) {
      const existingSameType = allCustomerAccounts.find(a =>
        a.accountType === accountToActivate.accountType &&
        ['ACTIVE', 'AT_RISK'].includes(a.status) &&
        a.accountNumber !== req.params.accountNumber
      );
      if (existingSameType) {
        return res.status(400).json({
          success: false,
          message: `Cannot activate. Customer already has an active ${accountToActivate.accountType} account (${existingSameType.accountNumber}).`
        });
      }
    }

    const account = await Account.findOneAndUpdate(
      { accountNumber: req.params.accountNumber },
      { $set: { status: 'ACTIVE' }, $unset: { deactivationType: '', atRiskSince: '' } },
      { new: true }
    );
    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;