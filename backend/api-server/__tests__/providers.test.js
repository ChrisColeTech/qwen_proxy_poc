import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Providers API', () => {
  describe('GET /api/providers', () => {
    it('should return 200 OK with providers list', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('providers');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.providers)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return providers with expected properties', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      if (response.body.providers.length > 0) {
        const provider = response.body.providers[0];
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('type');
        expect(provider).toHaveProperty('enabled');
        expect(provider).toHaveProperty('priority');
        expect(typeof provider.enabled).toBe('boolean');
        expect(typeof provider.priority).toBe('number');
      }
    });

    it('should return total count matching providers array length', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      expect(response.body.providers.length).toBe(response.body.total);
    });
  });
});
