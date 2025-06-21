const createApp = require('./src/app');

const PORT = process.env.PORT || 3000;
const app = createApp();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Task Management API server is running on http://localhost:${PORT}`);
  console.log(`📊 Frontend available at http://localhost:${PORT}`);
  console.log(`📋 API Documentation: Check README.md for endpoint details`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  app.db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed.');
    }
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
});

module.exports = app; 