const createApp = require('../src/app');

const app = createApp();

// Add debug endpoint to test basic functionality
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL 
  });
});

// Export as handler for Vercel serverless functions
module.exports = (req, res) => {
  return app(req, res);
}; 