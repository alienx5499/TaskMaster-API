const request = require('supertest');
const createApp = require('../../src/app');

describe('Performance Tests - API Load and Response Times', () => {
  let app;

  beforeAll(() => {
    app = createApp(':memory:');
  });

  afterAll((done) => {
    if (app.db) {
      app.db.close(done);
    } else {
      done();
    }
  });

  describe('Response Time Tests', () => {
    test('GET /health should respond within 100ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/health');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    test('GET /api/tasks should respond within 200ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/tasks');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200);
    });

    test('POST /api/tasks should respond within 300ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Performance Test Task',
          description: 'Testing response time'
        });
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(300);
    });

    test('GET /api/stats should respond within 200ms', async () => {
      const start = Date.now();
      const response = await request(app)
        .get('/api/stats');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Concurrent Request Tests', () => {
    test('should handle 10 concurrent GET requests efficiently', async () => {
      const concurrentRequests = [];
      const requestCount = 10;

      const start = Date.now();

      for (let i = 0; i < requestCount; i++) {
        concurrentRequests.push(
          request(app)
            .get('/api/tasks')
            .expect(200)
        );
      }

      const responses = await Promise.all(concurrentRequests);
      const totalDuration = Date.now() - start;

      // All requests should succeed
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalDuration).toBeLessThan(2000); // 2 seconds for 10 requests
    });

    test('should handle concurrent task creation', async () => {
      const concurrentRequests = [];
      const requestCount = 5;

      for (let i = 0; i < requestCount; i++) {
        concurrentRequests.push(
          request(app)
            .post('/api/tasks')
            .send({
              title: `Concurrent Task ${i + 1}`,
              description: `Task created concurrently ${i + 1}`
            })
            .expect(201)
        );
      }

      const responses = await Promise.all(concurrentRequests);

      // Verify all tasks were created successfully
      expect(responses).toHaveLength(requestCount);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(`Concurrent Task ${index + 1}`);
      });

      // Verify all tasks have unique IDs
      const ids = responses.map(response => response.body.data.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(requestCount);
    });

    test('should handle mixed concurrent operations', async () => {
      // First create some tasks
      const createTasks = [];
      for (let i = 0; i < 3; i++) {
        createTasks.push(
          request(app)
            .post('/api/tasks')
            .send({ title: `Setup Task ${i + 1}` })
        );
      }
      
      const createdTasks = await Promise.all(createTasks);
      const taskIds = createdTasks.map(response => response.body.data.id);

      // Now perform mixed operations concurrently
      const mixedRequests = [
        request(app).get('/api/tasks'),
        request(app).get('/api/stats'),
        request(app).get(`/api/tasks/${taskIds[0]}`),
        request(app).post('/api/tasks').send({ title: 'Mixed Op Task' }),
        request(app).put(`/api/tasks/${taskIds[1]}`).send({ 
          title: 'Updated Task', 
          description: '', 
          status: 'completed', 
          priority: 'high' 
        })
      ];

      const start = Date.now();
      const responses = await Promise.all(mixedRequests);
      const totalDuration = Date.now() - start;

      // Verify all operations succeeded
      expect(responses[0].status).toBe(200); // GET all tasks
      expect(responses[1].status).toBe(200); // GET stats
      expect(responses[2].status).toBe(200); // GET specific task
      expect(responses[3].status).toBe(201); // POST new task
      expect(responses[4].status).toBe(200); // PUT update task

      expect(totalDuration).toBeLessThan(1500); // 1.5 seconds for mixed operations
    });
  });

  describe('Database Performance Tests', () => {
    test('should handle creating many tasks efficiently', async () => {
      const taskCount = 50;
      const batchSize = 10;
      const batches = [];

      // Create tasks in batches to test bulk operations
      for (let i = 0; i < taskCount; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, taskCount); j++) {
          batch.push(
            request(app)
              .post('/api/tasks')
              .send({
                title: `Bulk Task ${j + 1}`,
                status: j % 3 === 0 ? 'pending' : j % 3 === 1 ? 'in_progress' : 'completed',
                priority: j % 3 === 0 ? 'low' : j % 3 === 1 ? 'medium' : 'high'
              })
          );
        }
        batches.push(Promise.all(batch));
      }

      const start = Date.now();
      
      // Execute all batches
      for (const batch of batches) {
        const responses = await batch;
        responses.forEach(response => {
          expect(response.status).toBe(201);
        });
      }

      const duration = Date.now() - start;

      // Verify all tasks were created
      const allTasksResponse = await request(app).get('/api/tasks');
      expect(allTasksResponse.body.total).toBeGreaterThanOrEqual(taskCount);

      // Performance check - should create 50 tasks in reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    test('should handle filtering on large dataset efficiently', async () => {
      // Assuming tasks were created in previous test
      const start = Date.now();

      const [
        allTasksResponse,
        pendingTasksResponse,
        completedTasksResponse,
        highPriorityResponse,
        combinedFilterResponse
      ] = await Promise.all([
        request(app).get('/api/tasks'),
        request(app).get('/api/tasks?status=pending'),
        request(app).get('/api/tasks?status=completed'),
        request(app).get('/api/tasks?priority=high'),
        request(app).get('/api/tasks?status=in_progress&priority=medium')
      ]);

      const duration = Date.now() - start;

      // All requests should succeed
      expect(allTasksResponse.status).toBe(200);
      expect(pendingTasksResponse.status).toBe(200);
      expect(completedTasksResponse.status).toBe(200);
      expect(highPriorityResponse.status).toBe(200);
      expect(combinedFilterResponse.status).toBe(200);

      // Filtering should be fast even with many tasks
      expect(duration).toBeLessThan(1000); // 1 second for all filter operations
    });

    test('should calculate stats efficiently on large dataset', async () => {
      const start = Date.now();
      
      const statsResponse = await request(app)
        .get('/api/stats');
      
      const duration = Date.now() - start;

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.total).toBeGreaterThan(0);

      // Stats calculation should be fast
      expect(duration).toBeLessThan(300); // 300ms for stats calculation
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/tasks')
          .send({ title: `Memory Test Task ${i}` });
        
        await request(app).get('/api/tasks');
        await request(app).get('/api/stats');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle rapid sequential requests without blocking', async () => {
      const requestCount = 20;
      const delays = [];

      for (let i = 0; i < requestCount; i++) {
        const start = Date.now();
        
        await request(app)
          .get('/health')
          .expect(200);
        
        delays.push(Date.now() - start);
      }

      // No request should take significantly longer than others (no blocking)
      const maxDelay = Math.max(...delays);
      const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;

      expect(maxDelay).toBeLessThan(avgDelay * 3); // Max delay shouldn't be more than 3x average
      expect(avgDelay).toBeLessThan(100); // Average should be under 100ms
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle invalid requests quickly', async () => {
      const start = Date.now();

      const errorRequests = await Promise.all([
        request(app).get('/api/tasks/invalid-id'),
        request(app).post('/api/tasks').send({}),
        request(app).put('/api/tasks/999999').send({ title: 'Test' }),
        request(app).delete('/api/tasks/999999'),
        request(app).get('/api/nonexistent')
      ]);

      const duration = Date.now() - start;

      // All should return appropriate error status codes
      expect(errorRequests[0].status).toBe(404);
      expect(errorRequests[1].status).toBe(400);
      expect(errorRequests[2].status).toBe(404);
      expect(errorRequests[3].status).toBe(404);
      expect(errorRequests[4].status).toBe(404);

      // Error handling should be fast
      expect(duration).toBeLessThan(500); // 500ms for all error requests
    });
  });
}); 