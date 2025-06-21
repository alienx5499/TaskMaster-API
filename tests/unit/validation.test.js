const request = require('supertest');
const createApp = require('../../src/app');

describe('Unit Tests - Validation Logic', () => {
  let app;

  beforeEach(() => {
    // Create app with in-memory database for each test
    app = createApp(':memory:');
  });

  afterEach((done) => {
    // Close database connection after each test
    if (app.db) {
      app.db.close(done);
    } else {
      done();
    }
  });

  describe('POST /api/tasks - Input Validation', () => {
    test('should reject empty request body', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Request body is required');
    });

    test('should reject missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    test('should reject empty title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: '',
          description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    test('should reject whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: '   ',
          description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    test('should reject non-string title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 123,
          description: 'Test description'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    test('should reject invalid status', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          status: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Status must be one of: pending, in_progress, completed');
    });

    test('should reject invalid priority', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          priority: 'invalid_priority'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Priority must be one of: low, medium, high');
    });

    test('should accept valid task with default values', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Valid Task'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Valid Task');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.description).toBe('');
    });

    test('should accept valid task with all fields', async () => {
      const taskData = {
        title: 'Complete Task',
        description: 'Task description',
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

    test('should trim whitespace from title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: '  Trimmed Task  ',
          description: 'Test description'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Trimmed Task');
    });
  });

  describe('PUT /api/tasks/:id - Input Validation', () => {
    test('should reject empty title in update', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task'
        });

      const taskId = createResponse.body.data.id;

      // Try to update with empty title
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: '',
          description: 'Updated description'
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBe('Title is required');
    });

    test('should trim whitespace from title in update', async () => {
      // First create a task
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Original Task'
        });

      const taskId = createResponse.body.data.id;

      // Update with whitespace around title
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: '  Updated Task  ',
          description: 'Updated description'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe('Updated Task');
    });
  });

  describe('Query Parameters Validation', () => {
    test('should handle valid status filter', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle valid priority filter', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle combined filters', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending&priority=high');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid JSON in request body');
    });
  });
}); 