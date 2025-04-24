const express = require('express');
const router = express.Router();
const db = require('../db');

// Toggle location sharing with a provider
router.post('/toggle', (req, res) => {
  const { user_id, provider_id, is_shared } = req.body;
  
  if (!user_id || !provider_id) {
    return res.status(400).json({ error: 'User ID and Provider ID are required.' });
  }

  const sql = `
    INSERT INTO location_sharing (user_id, provider_id, is_shared)
    VALUES (?, ?, ?)
    ON CONFLICT (user_id, provider_id) 
    DO UPDATE SET is_shared = ?, updated_at = CURRENT_TIMESTAMP
  `;
  
  db.run(sql, [user_id, provider_id, is_shared, is_shared], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to update location sharing preferences' });
    }
    res.json({ 
      success: true, 
      message: 'Location sharing preferences updated',
      is_shared: is_shared
    });
  });
});

// Get list of providers with whom location is shared
router.get('/shared-with/:userId', (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT p.*, ls.is_shared 
    FROM providers p
    LEFT JOIN location_sharing ls ON p.id = ls.provider_id
    WHERE ls.user_id = ? AND ls.is_shared = 1
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to fetch shared providers' });
    }
    res.json(rows);
  });
});

// Check if location is shared with specific provider
router.get('/check/:userId/:providerId', (req, res) => {
  const { userId, providerId } = req.params;
  
  const sql = `
    SELECT is_shared 
    FROM location_sharing 
    WHERE user_id = ? AND provider_id = ?
  `;
  
  db.get(sql, [userId, providerId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to check location sharing status' });
    }
    res.json({ is_shared: row ? row.is_shared : false });
  });
});

module.exports = router;
