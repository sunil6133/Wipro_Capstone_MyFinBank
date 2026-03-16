const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  customerId:       { type: String, unique: true },
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true },
  phone:            { type: String, trim: true },
  address:          { type: String },
  govIdType:        { type: String, enum: ['AADHAAR', 'PAN'], required: true },
  govIdNumber:      { type: String, required: true },
  govIdDocumentPath:{ type: String },
  status:           { type: String, enum: ['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED'], default: 'PENDING_VERIFICATION' },
  createdAt:        { type: Date, default: Date.now }
});

customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

customerSchema.methods.comparePassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Customer', customerSchema);
