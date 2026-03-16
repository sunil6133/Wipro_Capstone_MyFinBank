const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'ADMIN') {
      const admin = await Admin.findOne({ adminId: decoded.id }).select('-password');
      if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });
      req.user = { ...admin.toObject(), role: 'ADMIN' };
    } else {
      const customer = await Customer.findOne({ customerId: decoded.id }).select('-password');
      if (!customer) return res.status(401).json({ success: false, message: 'Customer not found' });
      if (customer.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Account not active. Contact admin.' });
      }
      req.user = { ...customer.toObject(), role: 'CUSTOMER' };
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') return next();
  res.status(403).json({ success: false, message: 'Admin access only' });
};

const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'CUSTOMER') return next();
  res.status(403).json({ success: false, message: 'Customer access only' });
};

module.exports = { authMiddleware, adminOnly, customerOnly };
