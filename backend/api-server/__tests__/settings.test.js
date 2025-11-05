import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('should return 200 OK with settings', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('settings');
      expect(response.body).toHaveProperty('category');
      expect(typeof response.body.settings).toBe('object');
      expect(typeof response.body.category).toBe('string');
    });

    it('should return all settings by default', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body.category).toBe('all');
      expect(response.body.settings).toBeTruthy();
    });

    it('should filter settings by category', async () => {
      const response = await request(app)
        .get('/api/settings?category=server')
        .expect(200);

      expect(response.body.category).toBe('server');

      // Check that settings keys start with the category prefix
      const settingKeys = Object.keys(response.body.settings);
      if (settingKeys.length > 0) {
        const allMatchCategory = settingKeys.every(key => key.startsWith('server.'));
        expect(allMatchCategory).toBe(true);
      }
    });

    it('should have common settings properties', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      const { settings } = response.body;

      // Verify some common settings exist
      expect(settings).toHaveProperty('active_provider');
    });
  });
});
