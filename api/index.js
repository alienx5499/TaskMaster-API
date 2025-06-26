// Simple test to debug Vercel deployment
const express = require('express');

// Create a minimal Express app for debugging
const app = express();

// Basic middleware
app.use(express.json());

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
    message: 'Minimal API is working',
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