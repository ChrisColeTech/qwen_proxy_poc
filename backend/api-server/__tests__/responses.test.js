import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Responses API', () => {
  describe('GET /api/responses', () => {
    it('should return 200 OK with responses list', async () => {
      const response = await request(app)
        .get('/api/responses')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('responses');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.responses)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return pagination metadata', async () => {
      const response = await request(app)
        .get('/api/responses')
        .expect(200);

      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('has_more');
      expect(typeof response.body.limit).toBe('number');
      expect(typeof response.body.offset).toBe('number');
      expect(typeof response.body.has_more).toBe('boolean');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/responses?limit=20&offset=0')
        .expect(200);

      expect(response.body.limit).toBe(20);
      expect(response.body.offset).toBe(0);
    });
  });
});
