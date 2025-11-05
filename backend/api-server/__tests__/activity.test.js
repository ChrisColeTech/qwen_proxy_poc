import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/server.js';

describe('Activity API', () => {
  describe('GET /api/activity/recent', () => {
    it('should return 200 OK with recent activity', async () => {
      const response = await request(app)
        .get('/api/activity/recent')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('activities');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.activities)).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.limit).toBe('number');
    });

    it('should handle limit parameter', async () => {
      const response = await request(app)
        .get('/api/activity/recent?limit=10')
        .expect(200);

      expect(response.body.limit).toBe(10);
    });

    it('should default to limit of 20', async () => {
      const response = await request(app)
        .get('/api/activity/recent')
        .expect(200);

      expect(response.body.limit).toBe(20);
    });
  });

  describe('GET /api/activity/stats', () => {
    it('should return 200 OK with activity statistics', async () => {
      const response = await request(app)
        .get('/api/activity/stats')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('stats');
      expect(typeof response.body.stats).toBe('object');
    });

    it('should return expected statistics properties', async () => {
      const response = await request(app)
        .get('/api/activity/stats')
        .expect(200);

      const { stats } = response.body;
      expect(stats).toHaveProperty('total_api_requests');
      expect(stats).toHaveProperty('avg_response_time_ms');
      expect(stats).toHaveProperty('active_sessions');
      expect(stats).toHaveProperty('recent_errors');
      expect(stats).toHaveProperty('total_providers');
      expect(stats).toHaveProperty('total_models');

      // All stats should be numbers
      expect(typeof stats.total_api_requests).toBe('number');
      expect(typeof stats.avg_response_time_ms).toBe('number');
      expect(typeof stats.active_sessions).toBe('number');
      expect(typeof stats.recent_errors).toBe('number');
      expect(typeof stats.total_providers).toBe('number');
      expect(typeof stats.total_models).toBe('number');
    });
  });
});
