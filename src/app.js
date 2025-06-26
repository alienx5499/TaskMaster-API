const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database');

function createApp(dbPath = './tasks.db') {
  const app = express();

  // Middleware
  app.use(cors());

  // Enhanced body parsing with better error handling
  app.use('/api/*', (req, res, next) => {
    // Ensure we always respond with JSON for API routes
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  // JSON body parser with error handling
  app.use(bodyParser.json({ 
    limit: '10mb',
    type: 'application/json'
  }));

  // Handle JSON parsing errors
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('JSON parsing error:', err.message);
      }
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    next(err);
  });
  app.use(bodyParser.urlencoded({ extended: true }));

  // Add request logging for API calls (only in non-test environment)
  if (process.env.NODE_ENV !== 'test') {
    app.use('/api/*', (req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
        body: req.body,
        query: req.query
      });
      next();
    });
  }

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, '../public')));

  // Initialize Database
  const database = new Database();
  const db = database.getDatabase();

  // Health check endpoint (before API routes)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Task Management API is running',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes

  // 1. GET /api/tasks - Retrieve all tasks
  app.get('/api/tasks', (req, res) => {
    const { status, priority } = req.query;
    let query = 'SELECT * FROM tasks';
    let params = [];
    
    if (status || priority) {
      query += ' WHERE';
      if (status) {
        query += ' status = ?';
        params.push(status);
      }
      if (priority) {
        if (status) query += ' AND';
        query += ' priority = ?';
        params.push(priority);
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        if (process.env.NODE_ENV !== 'test') {
        console.error('Database error:', err);
        }
        res.status(500).json({ error: err.message });
      } else {
        res.json({
          success: true,
          data: rows,
          total: rows.length
        });
      }
    });
  });

  // 2. GET /api/tasks/:id - Retrieve a specific task by ID
  app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err) {
        if (process.env.NODE_ENV !== 'test') {
        console.error('Database error:', err);
        }
        res.status(500).json({ error: err.message });
      } else if (!row) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json({
          success: true,
          data: row
        });
      }
    });
  });

  // 3. POST /api/tasks - Create a new task
  app.post('/api/tasks', (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        console.log('POST /api/tasks - Request received:', req.body);
      }
      
      // Validate request body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' });
      }
      
    const { title, description, status = 'pending', priority = 'medium' } = req.body;
    
      // Validate title
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
      }
      
      // Validate status
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status must be one of: pending, in_progress, completed' });
      }
      
      // Validate priority
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Priority must be one of: low, medium, high' });
    }
    
    const query = `INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)`;
      const params = [title.trim(), description || '', status, priority];
      
      if (process.env.NODE_ENV !== 'test') {
        console.log('Executing database query:', { query, params });
      }
    
      db.run(query, params, function(err) {
      if (err) {
          if (process.env.NODE_ENV !== 'test') {
          console.error('Database error:', err);
          }
          return res.status(500).json({ error: 'Database error: ' + err.message });
      } else {
          const responseData = {
          success: true,
          data: {
            id: this.lastID,
              title: title.trim(),
              description: description || '',
            status,
              priority,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
          },
          message: 'Task created successfully'
          };
          
          if (process.env.NODE_ENV !== 'test') {
            console.log('Task created successfully:', responseData);
          }
          res.status(201).json(responseData);
      }
    });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
      console.error('Unexpected error in POST /api/tasks:', error);
      }
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  });

  // 4. PUT /api/tasks/:id - Update an existing task
  app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const query = `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(query, [title.trim(), description || '', status, priority, id], function(err) {
      if (err) {
        if (process.env.NODE_ENV !== 'test') {
        console.error('Database error:', err);
        }
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json({
          success: true,
          data: { id, title: title.trim(), description: description || '', status, priority },
          message: 'Task updated successfully'
        });
      }
    });
  });

  // 5. DELETE /api/tasks/:id - Delete a task
  app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
      if (err) {
        if (process.env.NODE_ENV !== 'test') {
        console.error('Database error:', err);
        }
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json({
          success: true,
          message: 'Task deleted successfully'
        });
      }
    });
  });

  // 6. GET /api/stats - Get task statistics
  app.get('/api/stats', async (req, res) => {
    try {
      // Use a single query with CASE statements for better performance and reliability
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress
        FROM tasks
      `;
      
      db.get(query, (err, row) => {
        if (err) {
          if (process.env.NODE_ENV !== 'test') {
          console.error('Database error in stats:', err);
          }
          return res.status(500).json({ error: 'Failed to fetch statistics' });
        }
        
            res.json({
              success: true,
          data: {
            total: row.total || 0,
            pending: row.pending || 0,
            completed: row.completed || 0,
            in_progress: row.in_progress || 0
          }
            });
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
      console.error('Unexpected error in stats endpoint:', error);
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API 404 handler for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Serve the frontend for non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });

  // Global error handler
  app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
    }
    if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'Something went wrong!' });
    } else {
      res.status(500).send('Something went wrong!');
    }
  });

  // Expose the database for testing
  app.db = db;
  app.database = database;
  
  return app;
}

module.exports = createApp; 