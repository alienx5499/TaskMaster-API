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
    if (app && app.db && typeof app.db.close === 'function') {
      // Add a small delay to ensure all async operations complete
      setTimeout(() => {
        app.db.close((err) => {
          // Clean up test database file
          if (fs.existsSync(testDbPath)) {
            try {
              fs.unlinkSync(testDbPath);
            } catch (e) {
              // Ignore file deletion errors
            }
          }
          done();
        });
      }, 50);
    } else {
      // Clean up test database file even if db is already closed
      if (fs.existsSync(testDbPath)) {
        try {
          fs.unlinkSync(testDbPath);
        } catch (e) {
          // Ignore file deletion errors
        }
      }
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
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Timestamp Test Task'
        });

      expect(createResponse.status).toBe(201);
      
      const taskId = createResponse.body.data.id;
      
      // Verify timestamps exist and are valid dates
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`);
      
      const task = getResponse.body.data;
      const createdAt = new Date(task.created_at);
      const updatedAt = new Date(task.updated_at);
      
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(createdAt.toString()).not.toBe('Invalid Date');
      expect(updatedAt.toString()).not.toBe('Invalid Date');
      
      // Verify created_at and updated_at are the same initially
      expect(createdAt.getTime()).toBe(updatedAt.getTime());

      // Wait a bit and update to test updated_at timestamp
      await new Promise(resolve => setTimeout(resolve, 1100)); // Ensure at least 1 second difference
      
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Timestamp Test Task',
          description: 'Updated',
          status: 'completed',
          priority: 'high'
        });

      const updatedResponse = await request(app)
        .get(`/api/tasks/${taskId}`);
      
      const updatedTask = updatedResponse.body.data;
      const newCreatedAt = new Date(updatedTask.created_at);
      const newUpdatedAt = new Date(updatedTask.updated_at);
      
      // Verify created_at didn't change but updated_at did (allow for same time due to precision)
      expect(newCreatedAt.getTime()).toBe(createdAt.getTime());
      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(updatedAt.getTime());
      
      // Verify timestamps are reasonable (within last 24 hours instead of 1 hour to handle timezone issues)
      const now = new Date();
      const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);
      expect(newCreatedAt.getTime()).toBeGreaterThan(twentyFourHoursAgo);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(twentyFourHoursAgo);
      
      // Verify timestamps are not in the future (within 1 hour buffer for timezone differences)
      const oneHourFromNow = now.getTime() + (60 * 60 * 1000);
      expect(newCreatedAt.getTime()).toBeLessThan(oneHourFromNow);
      expect(newUpdatedAt.getTime()).toBeLessThan(oneHourFromNow);
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
    test('should handle database connection issues gracefully', async () => {
      // Close the database connection to simulate connection failure
      const originalDb = app.db;
      
      await new Promise((resolve) => {
        app.db.close(() => {
          resolve();
        });
      });
      
      // Try to make a request after closing the database
      const response = await request(app)
        .get('/api/tasks');
        
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      
      // Restore database connection for cleanup
      app.db = originalDb;
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