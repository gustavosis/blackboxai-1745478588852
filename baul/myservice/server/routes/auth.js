const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const db = require('../db');

// User registration
router.post('/register', async (req, res) => {
  const { name, lastname, email, password, role } = req.body;
  
  // Validación de campos requeridos
  if (!name || !lastname || !email || !password) {
    return res.status(400).json({ 
      error: 'Todos los campos son requeridos.',
      fields: {
        name: !name ? 'Nombre es requerido' : null,
        lastname: !lastname ? 'Apellido es requerido' : null,
        email: !email ? 'Email es requerido' : null,
        password: !password ? 'Contraseña es requerida' : null
      }
    });
  }

  // Validación de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Formato de email inválido' });
  }

  try {
    // Verificar si el email ya existe
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = `${name.toLowerCase()}.${lastname.toLowerCase()}`;
    
    const sql = `INSERT INTO users (
      username, password, email, role, name, lastname
    ) VALUES (?, ?, ?, ?, ?, ?)`;
    
    const params = [
      username,
      hashedPassword,
      email,
      role || 'user',
      name,
      lastname
    ];

    const result = await new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('Error en registro:', err.message);
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });

    const userId = result;

    try {
      await new Promise((resolve, reject) => {
        req.login({
          id: userId,
          username,
          email,
          role: role || 'user',
          name,
          lastname
        }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });

      // Determine redirect URL based on role
      const redirectUrl = role === 'provider' ? '/provider-view.html' :
                         role === 'user' ? '/customer-view.html' :
                         `/${role}/dashboard`;

      res.status(201).json({ 
        message: 'Registro exitoso',
        user: {
          id: userId,
          username,
          email,
          role: role || 'user',
          name,
          lastname
        },
        redirectUrl
      });
    } catch (loginError) {
      console.error('Error en login automático:', loginError);
      const redirectUrl = role === 'provider' ? '/provider-view.html' :
                         role === 'user' ? '/customer-view.html' :
                         `/${role}/dashboard`;

      res.status(201).json({ 
        message: 'Registro exitoso, pero error en login automático',
        user: {
          id: userId,
          username,
          email,
          role: role || 'user'
        },
        redirectUrl
      });
    }
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// User login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json({ error: 'Invalid credentials' }); }
    req.logIn(user, (err) => {
      if (err) { return next(err); }

      // Determine redirect URL based on role
      const redirectUrl = user.role === 'provider' ? '/provider-view.html' :
                         user.role === 'user' ? '/customer-view.html' :
                         `/${user.role}/dashboard`;

      return res.json({ 
        message: 'Login successful', 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        },
        redirectUrl
      });
    });
  })(req, res, next);
});

// Google OAuth login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login?error=auth_failed',
    failureFlash: true
  }),
  (req, res) => {
    const role = req.user.role || 'user';
    const redirectUrl = role === 'provider' ? '/provider-view.html' :
                       role === 'user' ? '/customer-view.html' :
                       `/${role}/dashboard`;
    res.redirect(redirectUrl);
  }
);

// Facebook OAuth login
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email'],
  authType: 'rerequest'
}));

// Facebook OAuth callback
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/login?error=auth_failed',
    failureFlash: true
  }),
  (req, res) => {
    const role = req.user.role || 'user';
    const redirectUrl = role === 'provider' ? '/provider-view.html' :
                       role === 'user' ? '/customer-view.html' :
                       `/${role}/dashboard`;
    res.redirect(redirectUrl);
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login?message=logged_out');
});

module.exports = router;
