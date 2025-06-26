const createApp = require('../src/app');

// Set environment variables for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.VERCEL = '1';

let app;

try {
  // Create the Express app with error handling
  app = createApp();
  console.log('✅ Express app initialized successfully for Vercel');
} catch (error) {
  console.error('❌ Error initializing Express app:', error);
  
  // Create a basic error app as fallback
  const express = require('express');
  app = express();
  
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Application initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
}

// Export for Vercel serverless functions
module.exports = app; 