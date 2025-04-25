const express = require('express');
const router = express.Router();
const db = require('../db');

// Debug route to list all users
router.get('/users', (req, res) => {
  db.all('SELECT id, username, email, role FROM users', (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    // Return JSON with proper formatting
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ users: rows }, null, 2));
  });
});

module.exports = router;
