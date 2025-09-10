const request = require('supertest');
const app = require('../index');

describe('AAEConnect API', () => {
  afterAll((done) => {
    // Close any open handles
    done();
  });
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('AAEConnect');
      expect(res.body.bmad).toBe('Powered by BMAD Method');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('bmad');
      expect(res.body.bmad.installed).toBe(true);
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
      expect(res.text).toContain('aaeconnect_uptime_seconds');
      expect(res.text).toContain('aaeconnect_memory_usage_bytes');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });
});
