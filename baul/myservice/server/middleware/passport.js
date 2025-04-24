const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcrypt');
const db = require('../db');
const config = require('../config');

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Only compare password if we have both a password and a hash
      if (!password || !user.password) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google OAuth Strategy
if (config.auth && config.auth.google) {
  passport.use(new GoogleStrategy({
    clientID: config.auth.google.clientID,
    clientSecret: config.auth.google.clientSecret,
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE googleId = ?', [profile.id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!user) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (googleId, email, username) VALUES (?, ?, ?)',
            [profile.id, profile.emails[0].value, profile.displayName],
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        });

        user = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE googleId = ?', [profile.id], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

// Facebook OAuth Strategy
if (config.auth && config.auth.facebook) {
  passport.use(new FacebookStrategy({
    clientID: config.auth.facebook.clientID,
    clientSecret: config.auth.facebook.clientSecret,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE facebookId = ?', [profile.id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!user) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (facebookId, email, username) VALUES (?, ?, ?)',
            [profile.id, profile.emails[0].value, profile.displayName],
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        });

        user = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE facebookId = ?', [profile.id], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return done(err);
    done(null, user);
  });
});

module.exports = passport;
