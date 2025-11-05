import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Requests API', () => {
  describe('GET /api/requests', () => {
    it('should return 200 OK with requests list', async () => {
      const response = await request(app)
        .get('/api/requests')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('requests');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.requests)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return pagination metadata', async () => {
      const response = await request(app)
        .get('/api/requests')
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
        .get('/api/requests?limit=25&offset=0')
        .expect(200);

      expect(response.body.limit).toBe(25);
      expect(response.body.offset).toBe(0);
    });
  });
});
