const Admin = require('../models/Admin');
const { generateId } = require('../utils/idGenerator');

const createAdmin = async (data) => {
  const adminId = await generateId(Admin, 'adminId', 'MYFIN-ADMIN-');
  return Admin.create({ ...data, adminId });
};

const findByEmail = (email) => Admin.findOne({ email });

const findById = (adminId) => Admin.findOne({ adminId });

module.exports = { createAdmin, findByEmail, findById };
