const request = require('supertest');
const express = require('express');
const session = require('express-session');
const userProfileRouter = require('../user-profile-updated');
const bodyParser = require('body-parser');

// Mock database module
jest.mock('../../db', () => {
  return {
    get: jest.fn(),
    run: jest.fn()
  };
});
const db = require('../../db');

const app = express();
app.use(bodyParser.json());
app.use(session({ secret: 'test', resave: false, saveUninitialized: true }));

// Middleware to mock req.user
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.use('/user-profile', userProfileRouter);

describe('User Profile Updated API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /user-profile', () => {
    it('should return user profile data', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        name: 'Test',
        lastname: 'User',
        service: 'Plumber',
        phone: '1234567890'
      };
      db.get.mockImplementation((sql, params, callback) => {
        callback(null, mockUser);
      });

      const res = await request(app).get('/user-profile');
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toEqual(mockUser);
      expect(db.get).toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      // Create a separate app instance without user middleware for this test
      const appNoUser = express();
      appNoUser.use(bodyParser.json());
      appNoUser.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
      appNoUser.use('/user-profile', userProfileRouter);

      const res = await request(appNoUser).get('/user-profile');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 500 on database error', async () => {
      db.get.mockImplementation((sql, params, callback) => {
        callback(new Error('DB error'), null);
      });

      const res = await request(app).get('/user-profile');
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('PUT /user-profile', () => {
    it('should update user profile successfully', async () => {
      db.run.mockImplementation((sql, params, callback) => {
        callback(null);
      });

      const updatedData = {
        name: 'Updated',
        lastname: 'User',
        service: 'Electrician',
        email: 'updated@example.com',
        phone: '0987654321'
      };

      const res = await request(app)
        .put('/user-profile')
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(db.run).toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      // Create a separate app instance without user middleware for this test
      const appNoUser = express();
      appNoUser.use(bodyParser.json());
      appNoUser.use(session({ secret: 'test', resave: false, saveUninitialized: true }));
      appNoUser.use('/user-profile', userProfileRouter);

      const res = await request(appNoUser)
        .put('/user-profile')
        .send({});

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 500 on database error', async () => {
      db.run.mockImplementation((sql, params, callback) => {
        callback(new Error('DB error'));
      });

      const updatedData = {
        name: 'Updated',
        lastname: 'User',
        service: 'Electrician',
        email: 'updated@example.com',
        phone: '0987654321'
      };

      const res = await request(app)
        .put('/user-profile')
        .send(updatedData);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
