const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      // For Vercel production - use in-memory database
      // In a real app, you'd use Vercel Postgres or another cloud DB
      console.log('🌐 Using in-memory database for Vercel deployment');
      this.db = new sqlite3.Database(':memory:');
    } else {
      // For local development
      console.log('💾 Using local SQLite database');
      this.db = new sqlite3.Database('./tasks.db');
    }

    this.createTables();
  }

  createTables() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.serialize(() => {
      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating tasks table:', err);
        } else {
          console.log('✅ Tasks table ready');
          
          // Add some sample data for production demo
          if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
            this.addSampleData();
          }
        }
      });
    });
  }

  addSampleData() {
    const sampleTasks = [
      {
        title: 'Welcome to TaskMaster API',
        description: 'This is a demo task in your deployed API',
        status: 'completed',
        priority: 'high'
      },
      {
        title: 'Test Keploy AI Integration',
        description: 'Verify that all API endpoints work correctly',
        status: 'in_progress',
        priority: 'high'
      },
      {
        title: 'API Documentation Complete',
        description: 'OpenAPI schema is ready and comprehensive',
        status: 'completed',
        priority: 'medium'
      }
    ];

    sampleTasks.forEach(task => {
      this.db.run(
        'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
        [task.title, task.description, task.status, task.priority]
      );
    });

    console.log('🎯 Sample data added for demo');
  }

  getDatabase() {
    return this.db;
  }

  close(callback) {
    if (this.db) {
      this.db.close(callback);
    }
  }
}

module.exports = Database; 