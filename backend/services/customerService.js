const Customer = require('../models/Customer');
const { generateId } = require('../utils/idGenerator');

const createCustomer = async (data) => {
  const customerId = await generateId(Customer, 'customerId', 'MYFIN-CUST-');
  return Customer.create({ ...data, customerId });
};

const findByEmail = (email) => Customer.findOne({ email });

const findById = (customerId) => Customer.findOne({ customerId });

const findAll = () => Customer.find().select('-password');

const updateStatus = async (customerId, status) => {
  return Customer.findOneAndUpdate({ customerId }, { status }, { new: true });
};

const updatePassword = async (customerId, hashedPassword) => {
  const c = await Customer.findOne({ customerId });
  c.password = hashedPassword;
  c.isModified = () => true; // force pre-save to NOT rehash
  await Customer.updateOne({ customerId }, { password: hashedPassword });
  return true;
};

module.exports = { createCustomer, findByEmail, findById, findAll, updateStatus, updatePassword };
