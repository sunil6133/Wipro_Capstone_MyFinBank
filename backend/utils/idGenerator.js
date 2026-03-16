const generateId = async (Model, field, prefix, padLength = 4) => {
  const count = await Model.countDocuments();
  const seq = String(count + 1).padStart(padLength, '0');
  return `${prefix}${seq}`;
};

module.exports = { generateId };
