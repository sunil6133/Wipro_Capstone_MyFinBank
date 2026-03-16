const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');
const accountService = require('../services/accountService');
const Account = require('../models/Account');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');
const { sendKYCStatusEmail, sendWelcomeEmail } = require('../utils/email');

router.get('/profile/me', authMiddleware, customerOnly, async (req, res) => {
  try {
    const customer = await customerService.findById(req.user.customerId);
    const accounts = await accountService.findByCustomer(req.user.customerId);
    const customerObj = customer.toObject();
    delete customerObj.password;
    res.json({ success: true, customer: customerObj, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const customers = await customerService.findAll();
    res.json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:customerId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const customer = await customerService.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const accounts = await accountService.findByCustomer(req.params.customerId);
    const customerObj = customer.toObject();
    delete customerObj.password;
    res.json({ success: true, customer: customerObj, accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:customerId/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const customer = await customerService.updateStatus(req.params.customerId, 'ACTIVE');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const requestedAccounts = await Account.find({ customerId: req.params.customerId, status: 'REQUESTED' });
    for (const acc of requestedAccounts) {
      await accountService.approveAccount(acc.requestId);
    }

    const approvedAccounts = await accountService.findByCustomer(req.params.customerId);
    const activeAccount = approvedAccounts.find(a => a.status === 'ACTIVE');

    try { await sendKYCStatusEmail(customer.email, customer.name, 'ACTIVE'); } catch (_) {}
    try {
      await sendWelcomeEmail(
        customer.email,
        customer.name,
        activeAccount?.accountNumber || '',
        activeAccount?.accountType || customer.accountType || 'SAVINGS'
      );
    } catch (_) {}

    const customerObj = customer.toObject();
    delete customerObj.password;
    res.json({ success: true, customer: customerObj, message: 'KYC approved and accounts activated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:customerId/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const customer = await customerService.updateStatus(req.params.customerId, 'REJECTED');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    await Account.updateMany(
      { customerId: req.params.customerId, status: 'REQUESTED' },
      { $set: { status: 'REJECTED' } }
    );
    try { await sendKYCStatusEmail(customer.email, customer.name, 'REJECTED'); } catch (_) {}
    const customerObj = customer.toObject();
    delete customerObj.password;
    res.json({ success: true, customer: customerObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:customerId/deactivate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const customer = await customerService.updateStatus(req.params.customerId, 'REJECTED');
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const customerObj = customer.toObject();
    delete customerObj.password;
    res.json({ success: true, customer: customerObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;