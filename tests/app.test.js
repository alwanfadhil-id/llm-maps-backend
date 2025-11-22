const request = require('supertest');
const App = require('../src/app');

describe('App', () => {
  let app;
  let server;

  beforeAll((done) => {
    app = new App();
    server = app.app.listen(3002, done); // Use a different port for tests
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
        service: 'LLM Maps Backend'
      });
    });
  });

  describe('GET /api/config', () => {
    it('should return Google Maps client key', async () => {
      const response = await request(app.app)
        .get('/api/config')
        .expect(200);
      
      expect(response.body).toEqual({
        googleMapsClientKey: expect.any(String)
      });
    });
  });

  describe('GET /demo', () => {
    it('should return demo page', async () => {
      const response = await request(app.app)
        .get('/demo')
        .expect('Content-Type', /html/)
        .expect(200);
      
      expect(response.text).toContain('LLM Maps Assistant');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app.app)
        .get('/unknown-route')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });
});