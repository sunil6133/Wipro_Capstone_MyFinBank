const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const customerService = require('../services/customerService');
const adminService = require('../services/adminService');
const accountService = require('../services/accountService');
const passwordResetService = require('../services/passwordResetService');
const { sendOTPEmail } = require('../utils/email');
const { authMiddleware } = require('../middleware/authMiddleware');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG and PDF files are allowed'));
  }
});

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

router.post('/register', (req, res, next) => {
  upload.single('govIdDocument')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { name, email, password, phone, address, govIdType, govIdNumber, accountType } = req.body;
    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!govIdType) missing.push('govIdType');
    if (!govIdNumber) missing.push('govIdNumber');
    if (missing.length) {
      return res.status(400).json({ success: false, message: 'Missing: ' + missing.join(', ') });
    }
    const existing = await customerService.findByEmail(email);
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const govIdDocumentPath = req.file ? req.file.filename : '';
    const customer = await customerService.createCustomer({ name, email, password, phone, address, govIdType, govIdNumber, govIdDocumentPath });
    const accType = accountType === 'CURRENT' ? 'CURRENT' : 'SAVINGS';
    await accountService.createAccount(customer.customerId, accType);
    res.status(201).json({ success: true, message: 'Registration submitted. Await KYC approval.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const customer = await customerService.findByEmail(email);
    if (!customer) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (customer.status === 'PENDING_VERIFICATION') return res.status(403).json({ success: false, message: 'Account pending KYC verification. Contact admin.' });
    if (customer.status === 'REJECTED') return res.status(403).json({ success: false, message: 'Account rejected. Contact admin.' });
    if (customer.status !== 'ACTIVE') return res.status(403).json({ success: false, message: 'Account not active. Contact admin.' });
    const match = await customer.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(customer.customerId, 'CUSTOMER');
    res.json({ success: true, token, user: { id: customer.customerId, name: customer.name, email: customer.email, role: 'CUSTOMER' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminService.findByEmail(email);
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(admin.adminId, 'ADMIN');
    res.json({ success: true, token, user: { id: admin.adminId, name: admin.name, email: admin.email, role: 'ADMIN' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await adminService.findByEmail(email);
    if (existing) return res.status(400).json({ success: false, message: 'Admin already exists' });
    const admin = await adminService.createAdmin({ name, email, password });
    res.status(201).json({ success: true, message: 'Admin created', adminId: admin.adminId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const customer = await customerService.findByEmail(email);
    if (!customer) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const record = await passwordResetService.createToken(customer.customerId);

    try {
      await sendOTPEmail(email, record.otp);
    } catch (emailErr) {
      console.error('OTP email send failed:', emailErr.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please check email configuration or try again later.'
      });
    }

    res.json({ success: true, message: 'OTP sent to your email address' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }
    const customer = await customerService.findByEmail(email);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const record = await passwordResetService.findValidToken(customer.customerId, otp);
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await customerService.updatePassword(customer.customerId, hashed);
    await passwordResetService.markUsed(record.tokenId);
    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;