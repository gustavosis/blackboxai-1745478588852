const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('../config');
const passport = require('./passport');

module.exports = (app) => {
  // Trust proxy - required for rate limiting behind reverse proxies
  app.set('trust proxy', 1);

  // Rate limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });

  // Session configuration
  app.use(session({
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: { secure: false } // set to true if using https
  }));

  // Basic middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Serve static files - make sure public directory is served first
  app.use(express.static(path.join(__dirname, '../../public')));
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  // Handle direct HTML file requests
  app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/register.html'));
  });

  // Apply rate limiter to auth routes
  app.use('/auth', authLimiter);
};
