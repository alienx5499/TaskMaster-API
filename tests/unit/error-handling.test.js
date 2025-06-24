const request = require('supertest');
const createApp = require('../../src/app');
const fs = require('fs');
const path = require('path');

describe('Comprehensive Error Handling Tests', () => {
  let app;

  beforeEach(() => {
    // Use in-memory database to avoid data contamination
    app = createApp(':memory:');
  });

  afterEach((done) => {
    if (app.db) {
      app.db.close(done);
    } else {
      done();
    }
  });

  // Clean up any leftover database files
  afterAll(() => {
    const testDbPath = path.join(__dirname, '../../test_error_handling.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Database Error Scenarios', () => {
    test('should handle database initialization errors gracefully', () => {
      // Test with invalid database path
      const invalidApp = createApp('/invalid/path/database.db');
      expect(invalidApp).toBeDefined();
    });

    test('should handle serialized database operations', async () => {
      // Test the serialize branch in database creation
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Global Error Handler Coverage', () => {
    test('should handle API route errors', async () => {
      const response = await request(app)
        .get('/api/invalid-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('API endpoint not found');
    });

    test('should handle non-API route errors', async () => {
      const response = await request(app)
        .get('/some-invalid-frontend-route');

      expect(response.status).toBe(200); // Should serve index.html
    });
  });

  describe('Undefined Description Handling', () => {
    test('should handle undefined description in POST', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task with undefined description',
          description: undefined,
          status: 'pending',
          priority: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBe('');
    });

    test('should handle undefined description in PUT', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task',
          description: 'Original description'
        });

      const taskId = createResponse.body.data.id;

      // Update with undefined description
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task',
          description: undefined,
          status: 'completed',
          priority: 'high'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.description).toBe('');
    });
  });

  describe('Stats Endpoint Coverage', () => {
    test('should handle stats calculation with mixed statuses', async () => {
      // Create tasks with different statuses to test all branches
      const tasks = [
        { title: 'Pending Task 1', status: 'pending' },
        { title: 'Pending Task 2', status: 'pending' },
        { title: 'In Progress Task', status: 'in_progress' },
        { title: 'Completed Task 1', status: 'completed' },
        { title: 'Completed Task 2', status: 'completed' },
        { title: 'Completed Task 3', status: 'completed' }
      ];

      for (const task of tasks) {
        await request(app)
          .post('/api/tasks')
          .send(task);
      }

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(6);
      expect(response.body.data.pending).toBe(2);
      expect(response.body.data.in_progress).toBe(1);
      expect(response.body.data.completed).toBe(3);
    });

    test('should handle empty stats calculation', async () => {
      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.pending).toBe(0);
      expect(response.body.data.in_progress).toBe(0);
      expect(response.body.data.completed).toBe(0);
    });
  });

  describe('Query Parameter Edge Cases', () => {
    test('should handle query with status only', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task', status: 'pending' });

      const response = await request(app)
        .get('/api/tasks?status=pending');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    test('should handle query with priority only', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task', priority: 'high' });

      const response = await request(app)
        .get('/api/tasks?priority=high');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    test('should handle query with both status and priority', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ 
          title: 'Test Task', 
          status: 'in_progress', 
          priority: 'medium' 
        });

      const response = await request(app)
        .get('/api/tasks?status=in_progress&priority=medium');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('Update Operation Edge Cases', () => {
    test('should handle update with changes = 0', async () => {
      const response = await request(app)
        .put('/api/tasks/999999')
        .send({
          title: 'Non-existent Task',
          description: 'This should return 404',
          status: 'completed',
          priority: 'high'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Delete Operation Edge Cases', () => {
    test('should handle delete with changes = 0', async () => {
      const response = await request(app)
        .delete('/api/tasks/999999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });
}); 