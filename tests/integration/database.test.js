const request = require('supertest');
const createApp = require('../../src/app');
const fs = require('fs');
const path = require('path');

describe('Integration Tests - Database Operations', () => {
  let app;
  const testDbPath = path.join(__dirname, '../../test_integration.db');

  beforeEach(() => {
    // Remove test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    // Create app with real database file for integration testing
    app = createApp(testDbPath);
  });

  afterEach((done) => {
    if (app.db) {
      app.db.close(() => {
        // Clean up test database file
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
        done();
      });
    } else {
      done();
    }
  });

  describe('Database Schema and Connectivity', () => {
    test('should create database and tasks table', (done) => {
      // Give time for database initialization
      setTimeout(() => {
        app.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'", (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          expect(row.name).toBe('tasks');
          done();
        });
      }, 100);
    });

    test('should have correct table schema', (done) => {
      setTimeout(() => {
        app.db.all("PRAGMA table_info(tasks)", (err, columns) => {
          expect(err).toBeNull();
          expect(columns).toHaveLength(7);
          
          const columnNames = columns.map(col => col.name);
          expect(columnNames).toContain('id');
          expect(columnNames).toContain('title');
          expect(columnNames).toContain('description');
          expect(columnNames).toContain('status');
          expect(columnNames).toContain('priority');
          expect(columnNames).toContain('created_at');
          expect(columnNames).toContain('updated_at');
          done();
        });
      }, 100);
    });
  });

  describe('CRUD Operations Integration', () => {
    test('should perform complete CRUD cycle', async () => {
      // CREATE - Add a new task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Integration Test Task',
          description: 'Testing full CRUD cycle',
          status: 'pending',
          priority: 'high'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const taskId = createResponse.body.data.id;
      expect(taskId).toBeDefined();

      // READ - Get the created task
      const readResponse = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.id).toBe(taskId);
      expect(readResponse.body.data.title).toBe('Integration Test Task');
      expect(readResponse.body.data.description).toBe('Testing full CRUD cycle');
      expect(readResponse.body.data.status).toBe('pending');
      expect(readResponse.body.data.priority).toBe('high');

      // UPDATE - Modify the task
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Integration Test Task',
          description: 'Updated description',
          status: 'completed',
          priority: 'medium'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Integration Test Task');
      expect(updateResponse.body.data.status).toBe('completed');

      // Verify update persisted
      const verifyResponse = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.title).toBe('Updated Integration Test Task');
      expect(verifyResponse.body.data.status).toBe('completed');

      // DELETE - Remove the task
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Verify deletion
      const deletedResponse = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(deletedResponse.status).toBe(404);
      expect(deletedResponse.body.error).toBe('Task not found');
    });

    test('should handle multiple tasks correctly', async () => {
      const tasks = [
        { title: 'Task 1', status: 'pending', priority: 'low' },
        { title: 'Task 2', status: 'in_progress', priority: 'medium' },
        { title: 'Task 3', status: 'completed', priority: 'high' }
      ];

      const createdTasks = [];

      // Create multiple tasks
      for (const task of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send(task);
        
        expect(response.status).toBe(201);
        createdTasks.push(response.body.data);
      }

      // Get all tasks
      const allTasksResponse = await request(app)
        .get('/api/tasks');

      expect(allTasksResponse.status).toBe(200);
      expect(allTasksResponse.body.success).toBe(true);
      expect(allTasksResponse.body.data).toHaveLength(3);
      expect(allTasksResponse.body.total).toBe(3);

      // Test filtering by status
      const pendingTasksResponse = await request(app)
        .get('/api/tasks?status=pending');

      expect(pendingTasksResponse.status).toBe(200);
      expect(pendingTasksResponse.body.data).toHaveLength(1);
      expect(pendingTasksResponse.body.data[0].title).toBe('Task 1');

      // Test filtering by priority
      const highPriorityResponse = await request(app)
        .get('/api/tasks?priority=high');

      expect(highPriorityResponse.status).toBe(200);
      expect(highPriorityResponse.body.data).toHaveLength(1);
      expect(highPriorityResponse.body.data[0].title).toBe('Task 3');

      // Test combined filtering
      const combinedFilterResponse = await request(app)
        .get('/api/tasks?status=in_progress&priority=medium');

      expect(combinedFilterResponse.status).toBe(200);
      expect(combinedFilterResponse.body.data).toHaveLength(1);
      expect(combinedFilterResponse.body.data[0].title).toBe('Task 2');
    });

    test('should maintain data integrity with timestamps', async () => {
      const beforeCreate = new Date();
      
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Timestamp Test Task'
        });

      const afterCreate = new Date();
      expect(createResponse.status).toBe(201);
      
      const taskId = createResponse.body.data.id;
      
      // Verify timestamps are within expected range
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`);
      
      const task = getResponse.body.data;
      const createdAt = new Date(task.created_at);
      const updatedAt = new Date(task.updated_at);
      
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 5000); // 5 second tolerance
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 5000);

      // Wait a bit and update to test updated_at timestamp
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const beforeUpdate = new Date();
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Timestamp Test Task',
          description: 'Updated',
          status: 'completed',
          priority: 'high'
        });
      const afterUpdate = new Date();

      const updatedResponse = await request(app)
        .get(`/api/tasks/${taskId}`);
      
      const updatedTask = updatedResponse.body.data;
      const newUpdatedAt = new Date(updatedTask.updated_at);
      
      expect(newUpdatedAt.getTime()).toBeGreaterThan(updatedAt.getTime());
      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 5000);
      expect(newUpdatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 5000);
    });
  });

  describe('Statistics Integration', () => {
    test('should calculate statistics correctly with real data', async () => {
      // Create tasks with different statuses
      const tasks = [
        { title: 'Pending Task 1', status: 'pending' },
        { title: 'Pending Task 2', status: 'pending' },
        { title: 'In Progress Task', status: 'in_progress' },
        { title: 'Completed Task 1', status: 'completed' },
        { title: 'Completed Task 2', status: 'completed' },
        { title: 'Completed Task 3', status: 'completed' }
      ];

      // Create all tasks
      for (const task of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send(task);
        expect(response.status).toBe(201);
      }

      // Get statistics
      const statsResponse = await request(app)
        .get('/api/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toEqual({
        total: 6,
        pending: 2,
        in_progress: 1,
        completed: 3
      });
    });

    test('should handle empty database in statistics', async () => {
      const statsResponse = await request(app)
        .get('/api/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toEqual({
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0
      });
    });
  });

  describe('Database Error Handling', () => {
    test('should handle database connection issues gracefully', (done) => {
      // Close the database connection
      app.db.close(() => {
        // Try to make a request after closing the database
        request(app)
          .get('/api/tasks')
          .end((err, res) => {
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
            done();
          });
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent task creation', async () => {
      const concurrentTasks = [];
      const taskCount = 5;

      // Create multiple tasks concurrently
      for (let i = 0; i < taskCount; i++) {
        concurrentTasks.push(
          request(app)
            .post('/api/tasks')
            .send({
              title: `Concurrent Task ${i + 1}`,
              description: `Task created concurrently ${i + 1}`
            })
        );
      }

      const responses = await Promise.all(concurrentTasks);

      // Verify all tasks were created successfully
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Task ${index + 1}`);
      });

      // Verify all tasks exist in database
      const allTasksResponse = await request(app)
        .get('/api/tasks');

      expect(allTasksResponse.status).toBe(200);
      expect(allTasksResponse.body.data).toHaveLength(taskCount);
    });
  });
}); 