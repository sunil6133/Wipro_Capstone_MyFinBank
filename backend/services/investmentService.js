const FixedDeposit = require('../models/FixedDeposit');
const RecurringDeposit = require('../models/RecurringDeposit');
const { generateId } = require('../utils/idGenerator');

const createFD = async (data) => {
  const fdId = await generateId(FixedDeposit, 'fdId', 'MYFIN-FD-');
  const maturityDate = new Date(data.startDate || Date.now());
  maturityDate.setMonth(maturityDate.getMonth() + data.tenureMonths);
  const maturityAmount = Math.round(data.amount * (1 + (data.interestRate / 100) * (data.tenureMonths / 12)));
  return FixedDeposit.create({ ...data, fdId, maturityDate, maturityAmount });
};

const findFDByAccount = (accountNumber) => FixedDeposit.find({ accountNumber });

const findAllFDs = () => FixedDeposit.find();

const createRD = async (data) => {
  const rdId = await generateId(RecurringDeposit, 'rdId', 'MYFIN-RD-');
  const maturityDate = new Date(data.startDate || Date.now());
  maturityDate.setMonth(maturityDate.getMonth() + data.tenureMonths);
  return RecurringDeposit.create({ ...data, rdId, maturityDate });
};

const findRDByAccount = (accountNumber) => RecurringDeposit.find({ accountNumber });

const findAllRDs = () => RecurringDeposit.find();

const updateRD = (rdId, data) => RecurringDeposit.findOneAndUpdate({ rdId }, data, { new: true });

const findRDById = (rdId) => RecurringDeposit.findOne({ rdId });

module.exports = { createFD, findFDByAccount, findAllFDs, createRD, findRDByAccount, findAllRDs, updateRD, findRDById };
