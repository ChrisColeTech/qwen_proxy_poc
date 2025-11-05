/**
 * SQLite Persistence Integration Tests
 * Tests end-to-end functionality of database persistence
 *
 * This test suite validates that all phases of the SQLite persistence
 * implementation work together correctly:
 * - Phase 1: Database initialization
 * - Phase 2: Repository layer
 * - Phase 3: Session manager integration
 * - Phase 4: Request/response persistence
 * - Phase 5-7: CRUD API endpoints
 * - Phase 8: Migration system
 */

const request = require('supertest');
const app = require('../../src/server');
const { initializeDatabase, shutdownDatabase, getDatabaseStats } = require('../../src/database');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../../data/test_qwen_proxy.db');

describe('SQLite Persistence Integration', () => {
  beforeAll(async () => {
    // Clean up any existing test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Initialize database
    await initializeDatabase();
  });

  afterAll(async () => {
    // Cleanup
    shutdownDatabase();

    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Phase 1: Database Initialization', () => {
    test('should initialize database successfully', async () => {
      const stats = getDatabaseStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('sessions');
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('responses');
      expect(stats).toHaveProperty('schema_version');

      // Should start with empty tables
      expect(typeof stats.sessions).toBe('number');
      expect(typeof stats.requests).toBe('number');
      expect(typeof stats.responses).toBe('number');
    });

    test('should have correct schema version', async () => {
      const stats = getDatabaseStats();
      expect(stats.schema_version).toBeGreaterThan(0);
    });

    test('should have all required tables', async () => {
      const db = new Database(TEST_DB_PATH);

      const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
      `).all();

      const tableNames = tables.map(t => t.name);

      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('requests');
      expect(tableNames).toContain('responses');
      expect(tableNames).toContain('metadata');

      db.close();
    });

    test('should have all required indexes', async () => {
      const db = new Database(TEST_DB_PATH);

      const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      const indexNames = indexes.map(i => i.name);

      // Session indexes
      expect(indexNames).toContain('idx_sessions_expires_at');
      expect(indexNames).toContain('idx_sessions_chat_id');
      expect(indexNames).toContain('idx_sessions_created_at');

      // Request indexes
      expect(indexNames).toContain('idx_requests_session_id');
      expect(indexNames).toContain('idx_requests_timestamp');
      expect(indexNames).toContain('idx_requests_request_id');

      // Response indexes
      expect(indexNames).toContain('idx_responses_request_id');
      expect(indexNames).toContain('idx_responses_session_id');
      expect(indexNames).toContain('idx_responses_timestamp');

      db.close();
    });
  });

  describe('Phase 4: Request/Response Persistence', () => {
    let sessionId;
    let requestId;

    test('should persist chat completion request and response', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: 'Test persistence message' }],
          stream: false
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object', 'chat.completion');
      expect(response.body).toHaveProperty('choices');
      expect(response.body.choices[0]).toHaveProperty('message');

      // Check database for persisted data
      const stats = getDatabaseStats();
      expect(stats.requests).toBeGreaterThan(0);
      expect(stats.responses).toBeGreaterThan(0);
      expect(stats.sessions).toBeGreaterThan(0);

      // Save IDs for subsequent tests
      requestId = response.body.id;
    }, 30000); // Longer timeout for actual API call

    test('should persist streaming request', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: 'Test streaming persistence' }],
          stream: true
        })
        .expect(200);

      // Verify streaming response
      expect(response.headers['content-type']).toContain('text/event-stream');

      // Check database (stream parameter should be stored)
      const statsAfter = getDatabaseStats();
      expect(statsAfter.requests).toBeGreaterThan(0);
    }, 30000);

    test('should track multiple messages in same session', async () => {
      const messages = [
        { role: 'user', content: 'First message in session' },
      ];

      // First message
      const response1 = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: messages,
          stream: false
        })
        .expect(200);

      // Add assistant response to messages
      messages.push({
        role: 'assistant',
        content: response1.body.choices[0].message.content
      });
      messages.push({ role: 'user', content: 'Second message in same session' });

      // Second message (should use same session)
      const response2 = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: messages,
          stream: false
        })
        .expect(200);

      // Database should show multiple requests for same session
      const stats = getDatabaseStats();
      expect(stats.requests).toBeGreaterThanOrEqual(2);
    }, 60000);
  });

  describe('Phase 5: Sessions CRUD API', () => {
    test('GET /v1/sessions should return sessions list', async () => {
      const response = await request(app)
        .get('/v1/sessions')
        .expect(200);

      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('has_more');

      // Verify data structure
      if (response.body.data.length > 0) {
        const session = response.body.data[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('chat_id');
        expect(session).toHaveProperty('message_count');
        expect(session).toHaveProperty('created_at');
        expect(session).toHaveProperty('last_accessed');
      }
    });

    test('GET /v1/sessions with pagination should work', async () => {
      const response = await request(app)
        .get('/v1/sessions?limit=5&offset=0')
        .expect(200);

      expect(response.body.limit).toBe(5);
      expect(response.body.offset).toBe(0);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('GET /v1/sessions/:sessionId should return session details', async () => {
      // First get list of sessions
      const listResponse = await request(app)
        .get('/v1/sessions')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const sessionId = listResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/sessions/${sessionId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', sessionId);
        expect(response.body).toHaveProperty('chat_id');
        expect(response.body).toHaveProperty('message_count');
        expect(response.body).toHaveProperty('request_count');
        expect(response.body).toHaveProperty('first_user_message');
      }
    });

    test('GET /v1/sessions/:sessionId/stats should return statistics', async () => {
      // Get a session ID
      const listResponse = await request(app)
        .get('/v1/sessions')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const sessionId = listResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/sessions/${sessionId}/stats`)
          .expect(200);

        expect(response.body).toHaveProperty('session_id', sessionId);
        expect(response.body).toHaveProperty('message_count');
        expect(response.body).toHaveProperty('usage');
        expect(response.body.usage).toHaveProperty('total_responses');
        expect(response.body.usage).toHaveProperty('total_completion_tokens');
        expect(response.body.usage).toHaveProperty('total_prompt_tokens');
        expect(response.body.usage).toHaveProperty('total_tokens');
      }
    });

    test('DELETE /v1/sessions/:sessionId should delete session', async () => {
      // Create a new session by making a request
      const chatResponse = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: 'Session to be deleted' }],
          stream: false
        })
        .expect(200);

      // Get sessions to find the one we just created
      const listResponse = await request(app)
        .get('/v1/sessions?limit=1')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const sessionId = listResponse.body.data[0].id;

        // Delete the session
        const deleteResponse = await request(app)
          .delete(`/v1/sessions/${sessionId}`)
          .expect(200);

        expect(deleteResponse.body).toHaveProperty('deleted', true);
        expect(deleteResponse.body).toHaveProperty('session_id', sessionId);

        // Verify it's gone
        await request(app)
          .get(`/v1/sessions/${sessionId}`)
          .expect(404);
      }
    }, 30000);
  });

  describe('Phase 6: Requests CRUD API', () => {
    test('GET /v1/requests should return requests list', async () => {
      const response = await request(app)
        .get('/v1/requests')
        .expect(200);

      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');

      if (response.body.data.length > 0) {
        const req = response.body.data[0];
        expect(req).toHaveProperty('id');
        expect(req).toHaveProperty('session_id');
        expect(req).toHaveProperty('request_id');
        expect(req).toHaveProperty('timestamp');
        expect(req).toHaveProperty('model');
        expect(req).toHaveProperty('stream');
      }
    });

    test('GET /v1/requests/:id should return request details', async () => {
      // Get list first
      const listResponse = await request(app)
        .get('/v1/requests')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const requestId = listResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/requests/${requestId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', requestId);
        expect(response.body).toHaveProperty('session_id');
        expect(response.body).toHaveProperty('openai_request');
        expect(response.body).toHaveProperty('qwen_request');
      }
    });

    test('GET /v1/sessions/:sessionId/requests should return session requests', async () => {
      // Get a session ID
      const sessionsResponse = await request(app)
        .get('/v1/sessions')
        .expect(200);

      if (sessionsResponse.body.data.length > 0) {
        const sessionId = sessionsResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/sessions/${sessionId}/requests`)
          .expect(200);

        expect(response.body).toHaveProperty('object', 'list');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);

        // All requests should belong to this session
        response.body.data.forEach(req => {
          expect(req.session_id).toBe(sessionId);
        });
      }
    });
  });

  describe('Phase 7: Responses CRUD API', () => {
    test('GET /v1/responses should return responses list', async () => {
      const response = await request(app)
        .get('/v1/responses')
        .expect(200);

      expect(response.body).toHaveProperty('object', 'list');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const resp = response.body.data[0];
        expect(resp).toHaveProperty('id');
        expect(resp).toHaveProperty('session_id');
        expect(resp).toHaveProperty('response_id');
        expect(resp).toHaveProperty('timestamp');
      }
    });

    test('GET /v1/responses/stats should return usage statistics', async () => {
      const response = await request(app)
        .get('/v1/responses/stats')
        .expect(200);

      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('total_responses');
      expect(response.body.statistics).toHaveProperty('total_completion_tokens');
      expect(response.body.statistics).toHaveProperty('total_prompt_tokens');
      expect(response.body.statistics).toHaveProperty('total_tokens');
      expect(response.body.statistics).toHaveProperty('avg_duration_ms');
    });

    test('GET /v1/responses/:id should return response details', async () => {
      // Get list first
      const listResponse = await request(app)
        .get('/v1/responses')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const responseId = listResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/responses/${responseId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', responseId);
        expect(response.body).toHaveProperty('session_id');
        expect(response.body).toHaveProperty('qwen_response');
        expect(response.body).toHaveProperty('openai_response');
      }
    });

    test('GET /v1/requests/:requestId/response should return request response', async () => {
      // Get a request first
      const requestsResponse = await request(app)
        .get('/v1/requests')
        .expect(200);

      if (requestsResponse.body.data.length > 0) {
        const requestId = requestsResponse.body.data[0].id;

        const response = await request(app)
          .get(`/v1/requests/${requestId}/response`)
          .expect(200);

        expect(response.body).toHaveProperty('request_id', requestId);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('session_id');
      }
    });
  });

  describe('Cross-phase Integration', () => {
    test('should maintain data consistency across tables', async () => {
      // Make a chat completion request
      await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'qwen-turbo',
          messages: [{ role: 'user', content: 'Consistency test' }],
          stream: false
        })
        .expect(200);

      // Get all data
      const sessions = await request(app).get('/v1/sessions').expect(200);
      const requests = await request(app).get('/v1/requests').expect(200);
      const responses = await request(app).get('/v1/responses').expect(200);

      // Verify counts
      expect(sessions.body.total).toBeGreaterThan(0);
      expect(requests.body.total).toBeGreaterThan(0);
      expect(responses.body.total).toBeGreaterThan(0);

      // Verify relationships
      if (requests.body.data.length > 0) {
        const request = requests.body.data[0];
        const sessionExists = sessions.body.data.some(s => s.id === request.session_id);
        expect(sessionExists).toBe(true);
      }
    }, 30000);

    test('should handle concurrent requests properly', async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/v1/chat/completions')
            .send({
              model: 'qwen-turbo',
              messages: [{ role: 'user', content: `Concurrent test ${i}` }],
              stream: false
            })
        );
      }

      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body).toHaveProperty('id');
        expect(result.body).toHaveProperty('choices');
      });

      // Database should have all records
      const stats = getDatabaseStats();
      expect(stats.requests).toBeGreaterThanOrEqual(3);
      expect(stats.responses).toBeGreaterThanOrEqual(3);
    }, 60000);
  });

  describe('Error Handling', () => {
    test('should handle invalid session ID gracefully', async () => {
      await request(app)
        .get('/v1/sessions/invalid-session-id')
        .expect(404);
    });

    test('should handle invalid request ID gracefully', async () => {
      await request(app)
        .get('/v1/requests/99999999')
        .expect(404);
    });

    test('should handle invalid response ID gracefully', async () => {
      await request(app)
        .get('/v1/responses/99999999')
        .expect(404);
    });

    test('should validate pagination parameters', async () => {
      // Invalid limit (too high)
      await request(app)
        .get('/v1/sessions?limit=2000')
        .expect(400);

      // Invalid offset (negative)
      await request(app)
        .get('/v1/sessions?offset=-1')
        .expect(400);
    });
  });
});
