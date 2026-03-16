const Beneficiary = require('../models/Beneficiary');
const { generateId } = require('../utils/idGenerator');

const createBeneficiary = async (data) => {
  const beneficiaryId = await generateId(Beneficiary, 'beneficiaryId', 'MYFIN-BEN-');
  return Beneficiary.create({ ...data, beneficiaryId });
};

const findByCustomer = (customerId) => Beneficiary.find({ customerId });
const findAll = () => Beneficiary.find().sort({ createdAt: -1 });
const findPending = () => Beneficiary.find({ status: 'PENDING' });
const findById = (beneficiaryId) => Beneficiary.findOne({ beneficiaryId });
const updateStatus = (beneficiaryId, status) =>
  Beneficiary.findOneAndUpdate({ beneficiaryId }, { status }, { new: true });

module.exports = { createBeneficiary, findByCustomer, findAll, findPending, findById, updateStatus };