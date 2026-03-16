const Transaction = require('../models/Transaction');
const { generateId } = require('../utils/idGenerator');

const createTransaction = async (data) => {
  const txnId = await generateId(Transaction, 'txnId', 'MYFIN-TXN-', 6);
  return Transaction.create({ ...data, txnId });
};

const findByAccount = (accountNumber) =>
  Transaction.find({ accountNumber }).sort({ date: -1 });

const findAll = () => Transaction.find().sort({ date: -1 }).limit(200);

module.exports = { createTransaction, findByAccount, findAll };
