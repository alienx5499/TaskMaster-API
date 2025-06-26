// Simple test to debug Vercel deployment
const express = require('express');

// Create a minimal Express app for debugging
const app = express();

// Basic middleware
app.use(express.json());

// Mock data for testing
const mockTasks = [
  {
    id: 1,
    title: 'Welcome to TaskMaster API',
    description: 'This is a demo task in your deployed API',
    status: 'completed',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Test API Integration',
    description: 'Verify that all API endpoints work correctly',
    status: 'in_progress',
    priority: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let nextId = 3;

// GET /api/tasks - Return mock tasks
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: mockTasks,
    total: mockTasks.length
  });
});

// GET /api/tasks/:id - Get single task
app.get('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = mockTasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json({
    success: true,
    data: task
  });
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, status = 'pending', priority = 'medium' } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const newTask = {
    id: nextId++,
    title,
    description: description || '',
    status,
    priority,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockTasks.push(newTask);
  
  res.status(201).json({
    success: true,
    data: newTask,
    message: 'Task created successfully'
  });
});

// PUT /api/tasks/:id - Update task
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const { title, description, status, priority } = req.body;
  const task = mockTasks[taskIndex];
  
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  task.updated_at = new Date().toISOString();
  
  res.json({
    success: true,
    data: task,
    message: 'Task updated successfully'
  });
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  mockTasks.splice(taskIndex, 1);
  
  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Basic Express is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'TaskMaster API is working',
    timestamp: new Date().toISOString()
  });
});

// Test if we can load our app module
app.get('/api/debug', (req, res) => {
  try {
    const createApp = require('../src/app');
    res.json({
      success: true,
      message: 'Module loading works',
      appCreated: typeof createApp === 'function'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Catch all for debugging
app.use('*', (req, res) => {
  res.json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app; 