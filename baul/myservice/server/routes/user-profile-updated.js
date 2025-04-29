const express = require('express');
const router = express.Router();
const db = require('../db');

// Get current user profile
router.get('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = req.user.id;
  db.get('SELECT id, username, email, role, name, lastname, service, phone FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  });
});

// Update current user profile
router.put('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = req.user.id;
  const { name, lastname, service, email, phone } = req.body;

  const sql = `UPDATE users SET name = ?, lastname = ?, service = ?, email = ?, phone = ? WHERE id = ?`;
  const params = [name, lastname, service, email, phone, userId];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error updating user profile:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

module.exports = router;
