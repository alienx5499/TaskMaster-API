const fs = require('fs');
const path = require('path');

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for testing

// Clean up test database before and after tests
const testDbPath = path.join(__dirname, '../test_tasks.db');

beforeAll(() => {
  // Remove test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

afterAll(() => {
  // Clean up test database after all tests
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// Increase timeout for database operations
jest.setTimeout(30000); 