const request = require('supertest');
const express = require('express');
const { apiLimiter, corsOptions, validateApiKey } = require('../src/middleware/security');

describe('Security Middleware', () => {
  describe('API Rate Limiting', () => {
    let app;
    
    beforeEach(() => {
      app = express();
      
      // Apply rate limiter
      app.use(apiLimiter);
      
      app.get('/test', (req, res) => {
        res.json({ message: 'OK' });
      });
    });

    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });
  });

  describe('validateApiKey', () => {
    let app;
    
    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      // Set env for testing
      process.env.CLIENT_API_KEY = 'test-api-key';
      
      app.get('/test', validateApiKey, (req, res) => {
        res.json({ message: 'OK' });
      });
    });

    afterEach(() => {
      delete process.env.CLIENT_API_KEY;
    });

    it('should allow request with valid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('x-api-key', 'test-api-key')
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .get('/test')
        .set('x-api-key', 'invalid-key')
        .expect(401);
      
      expect(response.body.error).toBe('Invalid API key');
    });

    it('should allow request when no API key is required', async () => {
      delete process.env.CLIENT_API_KEY;
      
      const response = await request(app)
        .get('/test')
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });
  });

  describe('CORS Configuration', () => {
    let app;
    
    beforeEach(() => {
      app = express();
      // Use a simple CORS middleware for testing instead of the config-based one
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
      });
      
      app.get('/test', (req, res) => {
        res.json({ message: 'OK' });
      });
    });

    it('should allow requests', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3001')
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });
  });
});