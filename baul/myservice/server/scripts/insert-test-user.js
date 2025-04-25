const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'db', 'myservice.db');
const db = new sqlite3.Database(dbPath);

async function insertTestUser() {
  const username = 'testuser';
  const email = 'testuser@example.com';
  const password = 'Test1234!';
  const role = 'user';
  const name = 'Test';
  const lastname = 'User';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, password, email, role, name, lastname) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, role, name, lastname],
      function (err) {
        if (err) {
          console.error('Error inserting test user:', err.message);
        } else {
          console.log('Test user inserted with ID:', this.lastID);
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error);
    db.close();
  }
}

insertTestUser();
