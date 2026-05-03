const Address = require('../models/Address');

const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addAddress = async (req, res) => {
  try {
    const { label, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
    if (isDefault) await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.create({
      userId: req.user._id, label: label || 'Home',
      addressLine1, addressLine2, city, state, pincode, isDefault: isDefault || false,
    });
    res.status(201).json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { isDefault } = req.body;
    if (isDefault) await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
