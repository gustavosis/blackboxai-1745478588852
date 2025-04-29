const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./server/config');
const db = require('./server/db');
const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir);
}

  
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Setup middleware
require('./server/middleware/setup')(app);

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service TEXT NOT NULL,
    description TEXT,
    contact TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    name TEXT,
    lastname TEXT,
    googleId TEXT,
    facebookId TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    provider_id INTEGER,
    location TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    communication TEXT,
    eta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(provider_id) REFERENCES providers(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS provider_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(provider_id) REFERENCES providers(id)
  )`);

  // Create location_sharing table
  db.run(`CREATE TABLE IF NOT EXISTS location_sharing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    is_shared BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
  )`);

  // Add location visibility to service_requests if not exists
  // Check if column exists before adding it
  db.get("SELECT * FROM pragma_table_info('service_requests') WHERE name='location_visible'", (err, row) => {
    if (!row) {
      db.run(`ALTER TABLE service_requests ADD COLUMN location_visible BOOLEAN DEFAULT 0`);
    }
  });
});

const debugRoutes = require('./server/routes/debug');
const listRoutes = require('./server/routes/list-routes');
const userProfileRoutes = require('./server/routes/user-profile-updated');

// Routes
app.use('/auth', require('./server/routes/auth'));
app.use('/location-sharing', require('./server/routes/location-sharing'));
app.use('/providers', require('./server/routes/providers'));
app.use('/service-requests', require('./server/routes/service-requests'));
app.use('/debug', debugRoutes);
app.use('/list', listRoutes);
app.use('/user-profile', userProfileRoutes);

// Serve static files - moved after API routes
app.use('/', express.static(path.join(__dirname, 'public')));

// Serve index.html on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve provider-view.html
app.get('/provider-view.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'provider-view.html'));
});

  
// Error logging middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Service Directory API listening at http://localhost:${config.port}`);
});
