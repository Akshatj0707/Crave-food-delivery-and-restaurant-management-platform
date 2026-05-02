const pool = require('../config/database');

const getAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addAddress = async (req, res) => {
  try {
    const { label, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
    
    if (isDefault) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const result = await pool.query(`
      INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, pincode, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [req.user.id, label || 'Home', addressLine1, addressLine2, city, state, pincode, isDefault || false]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await pool.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const result = await pool.query(`
      UPDATE addresses SET
        label = COALESCE($1, label),
        address_line1 = COALESCE($2, address_line1),
        address_line2 = COALESCE($3, address_line2),
        city = COALESCE($4, city),
        state = COALESCE($5, state),
        pincode = COALESCE($6, pincode),
        is_default = COALESCE($7, is_default)
      WHERE id = $8 AND user_id = $9
      RETURNING *
    `, [label, addressLine1, addressLine2, city, state, pincode, isDefault, id, req.user.id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
