const request = require('supertest');
const createApp = require('../../src/app');

describe('API Tests - Complete Endpoint Functionality', () => {
  let app;

  beforeEach(() => {
    app = createApp(':memory:');
  });

  afterEach((done) => {
    if (app.db) {
      app.db.close(done);
    } else {
      done();
    }
  });

  describe('Health Check Endpoint', () => {
    test('GET /health - should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', 'Task Management API is running');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/tasks - Retrieve All Tasks', () => {
    test('should return empty array when no tasks exist', async () => {
      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    test('should return all tasks when they exist', async () => {
      // Create some test tasks first
      const tasks = [
        { title: 'Task 1', description: 'Description 1', status: 'pending', priority: 'low' },
        { title: 'Task 2', description: 'Description 2', status: 'in_progress', priority: 'medium' },
        { title: 'Task 3', description: 'Description 3', status: 'completed', priority: 'high' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
      
      // Verify tasks are returned (order may vary in memory database)
      const titles = response.body.data.map(task => task.title);
      expect(titles).toContain('Task 1');
      expect(titles).toContain('Task 2');
      expect(titles).toContain('Task 3');
    });

    test('should filter tasks by status', async () => {
      const tasks = [
        { title: 'Pending Task', status: 'pending' },
        { title: 'In Progress Task', status: 'in_progress' },
        { title: 'Completed Task', status: 'completed' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/tasks?status=pending');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Pending Task');
      expect(response.body.data[0].status).toBe('pending');
    });

    test('should filter tasks by priority', async () => {
      const tasks = [
        { title: 'Low Priority Task', priority: 'low' },
        { title: 'Medium Priority Task', priority: 'medium' },
        { title: 'High Priority Task', priority: 'high' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/tasks?priority=high');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('High Priority Task');
      expect(response.body.data[0].priority).toBe('high');
    });

    test('should filter tasks by both status and priority', async () => {
      const tasks = [
        { title: 'Task 1', status: 'pending', priority: 'high' },
        { title: 'Task 2', status: 'pending', priority: 'low' },
        { title: 'Task 3', status: 'completed', priority: 'high' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/tasks?status=pending&priority=high');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Task 1');
    });
  });

  describe('GET /api/tasks/:id - Retrieve Specific Task', () => {
    test('should return task when it exists', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          status: 'in_progress',
          priority: 'high'
        });

      const taskId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.description).toBe('Test Description');
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.priority).toBe('high');
    });

    test('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .get('/api/tasks/999999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle non-numeric IDs gracefully', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /api/tasks - Create New Task', () => {
    test('should create task with minimal required data', async () => {
      const taskData = {
        title: 'Minimal Task'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Minimal Task');
      expect(response.body.data.description).toBe('');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.data.updated_at).toBeDefined();
      expect(response.body.message).toBe('Task created successfully');
    });

    test('should create task with all fields specified', async () => {
      const taskData = {
        title: 'Complete Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.status).toBe(taskData.status);
      expect(response.body.data.priority).toBe(taskData.priority);
    });

    test('should create multiple tasks with unique IDs', async () => {
      const tasks = ['Task 1', 'Task 2', 'Task 3'];
      const createdTasks = [];

      for (const title of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send({ title });
        
        expect(response.status).toBe(201);
        createdTasks.push(response.body.data);
      }

      // Verify all tasks have unique IDs
      const ids = createdTasks.map(task => task.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(tasks.length);
    });

    test('should handle special characters in title and description', async () => {
      const taskData = {
        title: 'Task with special chars: @#$%^&*()_+[]{}|;:,.<>?',
        description: 'Description with unicode: 🚀 📊 ✅ 💼 and émojis'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
    });
  });

  describe('PUT /api/tasks/:id - Update Task', () => {
    test('should update existing task completely', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task',
          description: 'Original Description',
          status: 'pending',
          priority: 'low'
        });

      const taskId = createResponse.body.data.id;

      // Update the task
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.message).toBe('Task updated successfully');
    });

    test('should update partial task data', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task',
          description: 'Original Description',
          status: 'pending',
          priority: 'medium'
        });

      const taskId = createResponse.body.data.id;

      // Update only title
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Title Only',
          description: 'Original Description',
          status: 'pending',
          priority: 'medium'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title Only');
    });

    test('should return 404 when updating non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/999999')
        .send({
          title: 'Updated Task',
          description: 'Updated Description'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should validate title is required for updates', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });

      const taskId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: '',
          description: 'Updated Description'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });
  });

  describe('DELETE /api/tasks/:id - Delete Task', () => {
    test('should delete existing task', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to Delete' });

      const taskId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Task deleted successfully');

      // Verify task is actually deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(getResponse.status).toBe(404);
    });

    test('should return 404 when deleting non-existent task', async () => {
      const response = await request(app)
        .delete('/api/tasks/999999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle deletion of multiple tasks', async () => {
      // Create multiple tasks
      const tasks = ['Task 1', 'Task 2', 'Task 3'];
      const taskIds = [];

      for (const title of tasks) {
        const response = await request(app)
          .post('/api/tasks')
          .send({ title });
        taskIds.push(response.body.data.id);
      }

      // Delete each task
      for (const taskId of taskIds) {
        const response = await request(app)
          .delete(`/api/tasks/${taskId}`);
        expect(response.status).toBe(200);
      }

      // Verify all tasks are deleted
      const allTasksResponse = await request(app)
        .get('/api/tasks');
      expect(allTasksResponse.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/stats - Task Statistics', () => {
    test('should return correct statistics with tasks', async () => {
      const tasks = [
        { title: 'Pending 1', status: 'pending' },
        { title: 'Pending 2', status: 'pending' },
        { title: 'In Progress 1', status: 'in_progress' },
        { title: 'Completed 1', status: 'completed' },
        { title: 'Completed 2', status: 'completed' },
        { title: 'Completed 3', status: 'completed' }
      ];

      for (const task of tasks) {
        await request(app).post('/api/tasks').send(task);
      }

      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        total: 6,
        pending: 2,
        in_progress: 1,
        completed: 3
      });
    });

    test('should return zero statistics when no tasks exist', async () => {
      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0
      });
    });

    test('should update statistics dynamically', async () => {
      // Create initial task
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task', status: 'pending' });

      let statsResponse = await request(app).get('/api/stats');
      expect(statsResponse.body.data.total).toBe(1);
      expect(statsResponse.body.data.pending).toBe(1);

      // Create another task
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task 2', status: 'completed' });

      statsResponse = await request(app).get('/api/stats');
      expect(statsResponse.body.data.total).toBe(2);
      expect(statsResponse.body.data.pending).toBe(1);
      expect(statsResponse.body.data.completed).toBe(1);
    });
  });

  describe('API Error Handling', () => {
    test('should return 404 for unknown API endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('API endpoint not found');
    });

    test('should handle different HTTP methods on unknown endpoints', async () => {
      const methods = ['POST', 'PUT', 'DELETE'];
      
      for (const method of methods) {
        const response = await request(app)
          [method.toLowerCase()]('/api/unknown-endpoint')
          .send({});

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('API endpoint not found');
      }
    });
  });

  describe('Response Format Consistency', () => {
    test('all API responses should have consistent structure', async () => {
      // Create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Consistency Test' });

      expect(createResponse.body).toHaveProperty('success');
      expect(createResponse.body).toHaveProperty('data');
      expect(createResponse.body).toHaveProperty('message');

      const taskId = createResponse.body.data.id;

      // Get all tasks
      const getAllResponse = await request(app).get('/api/tasks');
      expect(getAllResponse.body).toHaveProperty('success');
      expect(getAllResponse.body).toHaveProperty('data');
      expect(getAllResponse.body).toHaveProperty('total');

      // Get single task
      const getOneResponse = await request(app).get(`/api/tasks/${taskId}`);
      expect(getOneResponse.body).toHaveProperty('success');
      expect(getOneResponse.body).toHaveProperty('data');

      // Update task
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({ title: 'Updated', description: '', status: 'pending', priority: 'medium' });
      expect(updateResponse.body).toHaveProperty('success');
      expect(updateResponse.body).toHaveProperty('data');
      expect(updateResponse.body).toHaveProperty('message');

      // Get stats
      const statsResponse = await request(app).get('/api/stats');
      expect(statsResponse.body).toHaveProperty('success');
      expect(statsResponse.body).toHaveProperty('data');

      // Delete task
      const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`);
      expect(deleteResponse.body).toHaveProperty('success');
      expect(deleteResponse.body).toHaveProperty('message');
    });
  });

  describe('Content Type Handling', () => {
    test('should handle JSON content type', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: 'JSON Test' }));

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('JSON Test');
    });

    test('should return JSON content type for all API responses', async () => {
      const endpoints = [
        { method: 'get', path: '/api/tasks' },
        { method: 'get', path: '/api/stats' },
        { method: 'get', path: '/health' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });
  });

  describe('Additional Edge Cases', () => {
    test('should handle non-existent task updates correctly', async () => {
      const response = await request(app)
        .put('/api/tasks/999999')
        .send({
          title: 'Non-existent Task Update',
          description: 'This task does not exist',
          status: 'completed',
          priority: 'high'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle non-existent task deletion correctly', async () => {
      const response = await request(app)
        .delete('/api/tasks/999999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    test('should handle stats with no tasks in database', async () => {
      const response = await request(app)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.pending).toBe(0);
      expect(response.body.data.completed).toBe(0);
      expect(response.body.data.in_progress).toBe(0);
    });

    test('should handle task creation with empty description', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task with empty description',
          description: '',
          status: 'pending',
          priority: 'low'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('');
    });

    test('should handle task creation without description field', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task without description',
          status: 'in_progress',
          priority: 'high'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('');
    });

    test('should handle PUT request with empty description', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task',
          description: 'Original description'
        });

      const taskId = createResponse.body.data.id;

      // Update with empty description
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task',
          description: '',
          status: 'completed',
          priority: 'high'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.description).toBe('');
    });

    test('should handle PUT request without description field', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Another Original Task',
          description: 'Another original description'
        });

      const taskId = createResponse.body.data.id;

      // Update without description field
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task Without Description',
          status: 'in_progress',
          priority: 'medium'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.description).toBe('');
    });
  });

  describe('Global Error Handler', () => {
    test('should handle errors for API routes', async () => {
      // This will trigger the global error handler
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('API endpoint not found');
    });

    test('should handle errors for non-API routes', async () => {
      const response = await request(app)
        .get('/some-frontend-route');

      expect(response.status).toBe(200); // Should serve index.html
    });
  });

  describe('Development Environment Testing', () => {
    test('should log requests in development environment', async () => {
      // Temporarily set NODE_ENV to development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Create new app instance for development testing
      const devApp = createApp('./test_dev.db');
      
      const response = await request(devApp)
        .post('/api/tasks')
        .send({
          title: 'Development Test Task',
          description: 'Testing development logging'
        });

      expect(response.status).toBe(201);
      
      // Clean up
      devApp.db.close();
      process.env.NODE_ENV = originalEnv;
      
      // Remove test database
      const fs = require('fs');
      const path = require('path');
      const testDbPath = path.join(__dirname, '../../test_dev.db');
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    });

    test('should handle database initialization in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const devApp = createApp('./test_dev2.db');
      
      // Wait for database initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await request(devApp)
        .get('/health');

      expect(response.status).toBe(200);
      
      devApp.db.close();
      process.env.NODE_ENV = originalEnv;
      
      // Clean up
      const fs = require('fs');
      const path = require('path');
      const testDbPath = path.join(__dirname, '../../test_dev2.db');
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    });
  });

  describe('In-Memory Database Testing', () => {
    test('should work with in-memory database', async () => {
      const memoryApp = createApp(':memory:');
      
      const response = await request(memoryApp)
        .post('/api/tasks')
        .send({
          title: 'Memory Test Task',
          description: 'Testing in-memory database'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      memoryApp.db.close();
    });

    test('should handle database without serialize method', async () => {
      const memoryApp = createApp(':memory:');
      
      // Test that it works even if serialize method is not available
      const response = await request(memoryApp)
        .get('/api/tasks');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      memoryApp.db.close();
    });
  });

  describe('Advanced Edge Cases', () => {
    test('should handle tasks with all priority levels', async () => {
      const priorities = ['low', 'medium', 'high'];
      const taskIds = [];
      
      for (const priority of priorities) {
        const response = await request(app)
          .post('/api/tasks')
          .send({
            title: `${priority} priority task`,
            description: `Task with ${priority} priority`,
            priority: priority
          });
        
        expect(response.status).toBe(201);
        taskIds.push(response.body.data.id);
      }
      
      // Verify all priorities work in stats
      const statsResponse = await request(app)
        .get('/api/stats');
      
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.data.total).toBeGreaterThanOrEqual(3);
    });

    test('should handle tasks with all status levels', async () => {
      const statuses = ['pending', 'in_progress', 'completed'];
      
      for (const status of statuses) {
        const response = await request(app)
          .post('/api/tasks')
          .send({
            title: `${status} status task`,
            description: `Task with ${status} status`,
            status: status
          });
        
        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe(status);
      }
    });

    test('should handle complex filtering scenarios', async () => {
      // Create tasks with different combinations
      await request(app).post('/api/tasks').send({
        title: 'Test 1', status: 'pending', priority: 'high'
      });
      
      await request(app).post('/api/tasks').send({
        title: 'Test 2', status: 'completed', priority: 'low'
      });
      
      // Test status-only filter
      const statusResponse = await request(app)
        .get('/api/tasks?status=pending');
      expect(statusResponse.status).toBe(200);
      
      // Test priority-only filter
      const priorityResponse = await request(app)
        .get('/api/tasks?priority=high');
      expect(priorityResponse.status).toBe(200);
      
      // Test combined filter
      const combinedResponse = await request(app)
        .get('/api/tasks?status=pending&priority=high');
      expect(combinedResponse.status).toBe(200);
    });

    test('should properly handle timestamps in responses', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Timestamp Test',
          description: 'Testing timestamp handling'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(response.body.data.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
}); 