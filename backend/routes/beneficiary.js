const express = require('express');
const router = express.Router();
const beneficiaryService = require('../services/beneficiaryService');
const { authMiddleware, adminOnly, customerOnly } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, customerOnly, async (req, res) => {
  try {
    const { beneficiaryName, accountNumber, branch } = req.body;
    if (!beneficiaryName || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Name and account number required' });
    }
    const ben = await beneficiaryService.createBeneficiary({ customerId: req.user.customerId, beneficiaryName, accountNumber, branch });
    res.status(201).json({ success: true, beneficiary: ben });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', authMiddleware, customerOnly, async (req, res) => {
  try {
    const bens = await beneficiaryService.findByCustomer(req.user.customerId);
    res.json({ success: true, beneficiaries: bens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const bens = await beneficiaryService.findAll();
    res.json({ success: true, beneficiaries: bens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    const bens = await beneficiaryService.findPending();
    res.json({ success: true, beneficiaries: bens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:beneficiaryId/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ben = await beneficiaryService.updateStatus(req.params.beneficiaryId, 'ACTIVE');
    res.json({ success: true, beneficiary: ben });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:beneficiaryId/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const ben = await beneficiaryService.updateStatus(req.params.beneficiaryId, 'REJECTED');
    res.json({ success: true, beneficiary: ben });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;