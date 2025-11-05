/**
 * Jest Test Setup
 * Initializes database before running tests
 */

import { initDatabase, closeDatabase } from '../../provider-router/src/database/connection.js';

// Initialize database before all tests
beforeAll(() => {
  initDatabase();
});

// Clean up after all tests
afterAll(() => {
  closeDatabase();
});
