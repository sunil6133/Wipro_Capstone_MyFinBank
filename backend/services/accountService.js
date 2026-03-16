const Account = require('../models/Account');
const crypto = require('crypto');

const generateRequestId = () => crypto.randomBytes(6).toString('hex').toUpperCase();

const generateAccountNumber = async () => {
  const last = await Account.findOne(
    { accountNumber: { $exists: true, $ne: null } },
    { accountNumber: 1 },
    { sort: { accountNumber: -1 } }
  );

  if (!last || !last.accountNumber) {
    return '00000001';
  }

  const next = parseInt(last.accountNumber, 10) + 1;
  return String(next).padStart(8, '0');
};

const createAccount = async (customerId, accountType) => {
  const requestId = generateRequestId();
  const doc = new Account({ requestId, customerId, accountType, status: 'REQUESTED' });
  return doc.save();
};

const approveAccount = async (requestId) => {
  const accountNumber = await generateAccountNumber();
  return Account.findOneAndUpdate(
    { requestId },
    { $set: { status: 'ACTIVE', accountNumber }, $unset: { deactivationType: '', atRiskSince: '' } },
    { new: true }
  );
};

const rejectAccount = async (requestId) => {
  return Account.findOneAndUpdate(
    { requestId },
    { $set: { status: 'REJECTED' } },
    { new: true }
  );
};

const findByCustomer = (customerId) => Account.find({ customerId });
const findByAccountNumber = (accountNumber) => Account.findOne({ accountNumber });
const findAll = () => Account.find();
const findRequested = () => Account.find({ status: 'REQUESTED' });
const updateAccount = (accountNumber, data) => Account.findOneAndUpdate({ accountNumber }, data, { new: true });

module.exports = {
  createAccount,
  approveAccount,
  rejectAccount,
  findByCustomer,
  findByAccountNumber,
  findAll,
  findRequested,
  updateAccount
};