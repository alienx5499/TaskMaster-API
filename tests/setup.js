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

// Reduce timeout to catch hanging tests faster (was 30000ms)
jest.setTimeout(10000); // 10 seconds instead of 30

// Add global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
}); 