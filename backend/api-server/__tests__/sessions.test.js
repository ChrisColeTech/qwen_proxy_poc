import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Sessions API', () => {
  describe('GET /api/sessions', () => {
    it('should return 200 OK with sessions list', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return pagination metadata', async () => {
      const response = await request(app)
        .get('/api/sessions')
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
        .get('/api/sessions?limit=10&offset=0')
        .expect(200);

      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });
  });
});
