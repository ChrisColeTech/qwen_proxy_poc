import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Models API', () => {
  describe('GET /api/models', () => {
    it('should return 200 OK with models list', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return models with expected properties', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      if (response.body.models.length > 0) {
        const model = response.body.models[0];
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(typeof model.id).toBe('string');
        expect(typeof model.name).toBe('string');
      }
    });

    it('should return total count matching models array length', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      expect(response.body.models.length).toBe(response.body.total);
    });
  });
});
