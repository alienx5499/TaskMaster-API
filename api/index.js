const createApp = require('../src/app');

const app = createApp();

// Export for Vercel serverless functions
module.exports = app; 