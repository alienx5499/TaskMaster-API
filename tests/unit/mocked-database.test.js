const request = require('supertest');
const sqlite3 = require('sqlite3');

// Mock sqlite3
jest.mock('sqlite3', () => {
  const mockDb = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn(),
    serialize: jest.fn((callback) => callback && callback())
  };

  return {
    verbose: jest.fn(() => ({
      Database: jest.fn(() => mockDb)
    }))
  };
});

const createApp = require('../../src/app');

describe('Unit Tests - Mocked Database', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock database instance
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      close: jest.fn(),
      serialize: jest.fn((callback) => callback && callback())
    };

    // Mock the Database constructor to return our mock
    sqlite3.verbose().Database.mockImplementation(() => mockDb);
    
    app = createApp(':memory:');
    app.db = mockDb; // Manually assign for testing
  });

  describe('GET /api/tasks - Mocked Database Tests', () => {
    test('should handle database success response', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'pending', priority: 'medium' },
        { id: 2, title: 'Task 2', status: 'completed', priority: 'high' }
      ];

      // Mock successful database response
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, mockTasks);
      });

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTasks);
      expect(response.body.total).toBe(2);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tasks'),
        [],
        expect.any(Function)
      );
    });

    test('should handle database error', async () => {
      const mockError = new Error('Database connection failed');

      // Mock database error
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(mockError, null);
      });

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database connection failed');
    });

    test('should construct correct query with filters', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await request(app)
        .get('/api/tasks?status=pending&priority=high');

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = ? AND priority = ?'),
        ['pending', 'high'],
        expect.any(Function)
      );
    });

    test('should construct correct query with single filter', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await request(app)
        .get('/api/tasks?status=completed');

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = ?'),
        ['completed'],
        expect.any(Function)
      );
    });
  });

  describe('GET /api/tasks/:id - Mocked Database Tests', () => {
    test('should handle successful task retrieval', async () => {
      const mockTask = { id: 1, title: 'Test Task', status: 'pending' };

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(null, mockTask);
      });

      const response = await request(app)
        .get('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTask);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE id = ?',
        [1],
        expect.any(Function)
      );
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

    test('should handle database error', async () => {
      const mockError = new Error('Database query failed');

      mockDb.get.mockImplementation((query, params, callback) => {
        callback(mockError, null);
      });

      const response = await request(app)
        .get('/api/tasks/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database query failed');
    });
  });

  describe('POST /api/tasks - Mocked Database Tests', () => {
    test('should handle successful task creation', async () => {
      // Mock successful database insertion
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.lastID = 123;
        callback.call(this, null);
      });

      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'pending',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(123);
      expect(response.body.data.title).toBe('New Task');
      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
        ['New Task', 'Task description', 'pending', 'medium'],
        expect.any(Function)
      );
    });

    test('should handle database insertion error', async () => {
      const mockError = new Error('Insertion failed');

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(mockError);
      });

      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Database error');
    });

    test('should handle validation before database call', async () => {
      // This test verifies validation happens before database interaction
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
      
      // Database should not be called for invalid input
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/tasks/:id - Mocked Database Tests', () => {
    test('should handle successful task update', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 1; // Simulate one row affected
        callback.call(this, null);
      });

      const updateData = {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'completed',
        priority: 'high'
      };

      const response = await request(app)
        .put('/api/tasks/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Task');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks SET'),
        ['Updated Task', 'Updated description', 'completed', 'high', '1'],
        expect.any(Function)
      );
    });

    test('should handle task not found during update', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 0; // No rows affected
        callback.call(this, null);
      });

      const response = await request(app)
        .put('/api/tasks/999')
        .send({ title: 'Updated Task', description: '', status: 'pending', priority: 'medium' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle database update error', async () => {
      const mockError = new Error('Update failed');

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(mockError);
      });

      const response = await request(app)
        .put('/api/tasks/1')
        .send({ title: 'Updated Task', description: '', status: 'pending', priority: 'medium' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Update failed');
    });
  });

  describe('DELETE /api/tasks/:id - Mocked Database Tests', () => {
    test('should handle successful task deletion', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 1; // Simulate one row deleted
        callback.call(this, null);
      });

      const response = await request(app)
        .delete('/api/tasks/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM tasks WHERE id = ?',
        ['1'],
        expect.any(Function)
      );
    });

    test('should handle task not found during deletion', async () => {
      mockDb.run.mockImplementation(function(query, params, callback) {
        this.changes = 0; // No rows affected
        callback.call(this, null);
      });

      const response = await request(app)
        .delete('/api/tasks/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle database deletion error', async () => {
      const mockError = new Error('Deletion failed');

      mockDb.run.mockImplementation((query, params, callback) => {
        callback(mockError);
      });

      const response = await request(app)
        .delete('/api/tasks/1');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Deletion failed');
    });
  });

  describe('GET /api/stats - Mocked Database Tests', () => {
    test('should handle successful stats retrieval', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        completed: 5,
        in_progress: 2
      };

      mockDb.get.mockImplementation((query, callback) => {
        callback(null, mockStats);
      });

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total'),
        expect.any(Function)
      );
    });

    test('should handle stats query error', async () => {
      const mockError = new Error('Stats query failed');

      mockDb.get.mockImplementation((query, callback) => {
        callback(mockError, null);
      });

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch statistics');
    });

    test('should handle empty stats gracefully', async () => {
      const emptyStats = {
        total: 0,
        pending: 0,
        completed: 0,
        in_progress: 0
      };

      mockDb.get.mockImplementation((query, callback) => {
        callback(null, emptyStats);
      });

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(emptyStats);
    });
  });

  describe('Database Connection Handling', () => {
    test('should handle database initialization', () => {
      expect(sqlite3.verbose().Database).toHaveBeenCalled();
    });

    test('should expose database instance on app', () => {
      expect(app.db).toBeDefined();
      expect(typeof app.db.run).toBe('function');
      expect(typeof app.db.get).toBe('function');
      expect(typeof app.db.all).toBe('function');
    });
  });

  describe('Query Construction Logic', () => {
    test('should build query correctly for no filters', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await request(app).get('/api/tasks');

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM tasks ORDER BY created_at DESC',
        [],
        expect.any(Function)
      );
    });

    test('should build query correctly for status filter only', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await request(app).get('/api/tasks?status=pending');

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC',
        ['pending'],
        expect.any(Function)
      );
    });

    test('should build query correctly for priority filter only', async () => {
      mockDb.all.mockImplementation((query, params, callback) => {
        callback(null, []);
      });

      await request(app).get('/api/tasks?priority=high');

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM tasks WHERE priority = ? ORDER BY created_at DESC',
        ['high'],
        expect.any(Function)
      );
    });
  });
}); 