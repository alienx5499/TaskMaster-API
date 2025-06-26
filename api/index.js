const createApp = require('../src/app');

// Create the Express app
const app = createApp();

// Export for Vercel serverless functions
module.exports = app; 