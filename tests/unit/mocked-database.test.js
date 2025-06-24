const request = require('supertest');

// Simple and effective mock setup
const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  close: jest.fn(),
  serialize: jest.fn((callback) => callback && callback())
};

// Mock sqlite3 with a simpler approach
jest.mock('sqlite3', () => ({
  verbose: () => ({
    Database: jest.fn(() => mockDb)
  })
}));

const createApp = require('../../src/app');

describe('Unit Tests - Mocked Database (Simplified)', () => {
  let app;

  beforeAll(() => {
    // Create app once for all tests
    app = createApp(':memory:');
    // Ensure app uses our mock
    app.db = mockDb;
  });

  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Clean up
    if (app && app.db && app.db.close) {
      app.db.close();
    }
  });

  describe('GET /api/tasks - Basic Mocking', () => {
    test('should return mocked tasks successfully', async () => {
      const mockTasks = [
        { id: 1, title: 'Mock Task 1', status: 'pending' },
        { id: 2, title: 'Mock Task 2', status: 'completed' }
      ];

      // Simple mock implementation
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockTasks);
      });

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTasks);
      expect(mockDb.all).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      const mockError = new Error('Database error');
      
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(mockError, null);
      });

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('POST /api/tasks - Basic Mocking', () => {
    test('should create task with mocked database', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.lastID = 123;
        callback.call(this, null);
      });

      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task', description: 'Test description' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(123);
      expect(mockDb.run).toHaveBeenCalled();
    });

    test('should handle validation errors before database', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '' }); // Invalid title

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Title is required');
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/tasks/:id - Basic Mocking', () => {
    test('should return specific task', async () => {
      const mockTask = { id: 1, title: 'Specific Task' };
      
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockTask);
      });

      const response = await request(app)
        .get('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockTask);
    });

    test('should handle task not found', async () => {
      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, null); // No task found
      });

      const response = await request(app)
        .get('/api/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PUT /api/tasks/:id - Basic Mocking', () => {
    test('should update task successfully', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 1;
        callback.call(this, null);
      });

      const response = await request(app)
        .put('/api/tasks/1')
        .send({ 
          title: 'Updated Task', 
          description: '', 
          status: 'completed', 
          priority: 'high' 
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle task not found during update', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 0;
        callback.call(this, null);
      });

      const response = await request(app)
        .put('/api/tasks/999')
        .send({ 
          title: 'Updated Task', 
          description: '', 
          status: 'pending', 
          priority: 'medium' 
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id - Basic Mocking', () => {
    test('should delete task successfully', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 1;
        callback.call(this, null);
      });

      const response = await request(app)
        .delete('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle task not found during deletion', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 0;
        callback.call(this, null);
      });

      const response = await request(app)
        .delete('/api/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /api/stats - Basic Mocking', () => {
    test('should return mocked statistics', async () => {
      const mockStats = {
        total: 5,
        pending: 2,
        completed: 2,
        in_progress: 1
      };

      mockDb.get.mockImplementation((query, callback) => {
        callback(null, mockStats);
      });

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('Mock Verification', () => {
    test('should verify mock database is being used', () => {
      expect(app.db).toBe(mockDb);
      expect(typeof app.db.run).toBe('function');
      expect(typeof app.db.get).toBe('function');
      expect(typeof app.db.all).toBe('function');
    });
  });
}); 