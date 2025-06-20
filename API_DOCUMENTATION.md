<div align="center">

# 📋 **TaskMaster-API Documentation** 📋
### *Complete RESTful API Reference for Task Management*

[![API Version](https://img.shields.io/badge/API-v2.0.0-blue?style=flat-square)](https://github.com/prabalpatra/TaskMaster-API)
[![Node.js](https://img.shields.io/badge/Node.js-v16.10.0+-green?style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.18.2-lightgrey?style=flat-square)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-v5.1.7-blue?style=flat-square)](https://sqlite.org/)

*Professional-grade task management API with modern design and robust functionality*

</div>

---

## 📚 **Table of Contents**
1. [🎯 API Overview](#-api-overview)
2. [🚀 Quick Start](#-quick-start)
3. [🌐 Base Configuration](#-base-configuration)
4. [📊 Data Models](#-data-models)
5. [🛠️ API Endpoints](#️-api-endpoints)
6. [🔍 Error Handling](#-error-handling)
7. [📝 Code Examples](#-code-examples)
8. [🧪 Testing Guide](#-testing-guide)
9. [📈 Performance & Monitoring](#-performance--monitoring)
10. [🔧 Advanced Usage](#-advanced-usage)

---

## 🎯 **API Overview**

TaskMaster-API is a robust RESTful web service designed for comprehensive task management. Built with Express.js and SQLite, it provides full CRUD operations, advanced filtering, real-time statistics, and beautiful frontend integration.

### **🌟 Key Features**
- ✅ **Full CRUD Operations** - Create, Read, Update, Delete tasks
- 🔍 **Advanced Filtering** - Filter by status, priority, and custom criteria
- 📊 **Real-time Statistics** - Live task analytics and metrics
- 🎨 **Beautiful Frontend** - Modern glass morphism UI design
- 🔒 **Robust Validation** - Comprehensive input validation and sanitization
- 📈 **Performance Monitoring** - Built-in logging and performance tracking
- 🧪 **Testing Suite** - Comprehensive API testing utilities

### **🏗️ Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    TaskMaster-API                           │
├─────────────────────────────────────────────────────────────┤
│  Frontend (HTML/CSS/JS)  │  Backend (Express.js)            │
│  • Glass morphism UI     │  • RESTful API endpoints         │
│  • Real-time updates     │  • Input validation              │
│  • Responsive design     │  • Error handling                │
│  • Interactive forms     │  • Request logging               │
├─────────────────────────────────────────────────────────────┤
│                Database (SQLite3)                           │
│  • Persistent storage    │  • ACID compliance              │
│  • Auto-incrementing IDs │  • Timestamp tracking           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start**

### **🔧 Prerequisites**
- Node.js v16.10.0 or higher
- npm or pnpm package manager
- SQLite3 (auto-installed)

### **⚡ Installation**
```bash
# Clone the repository
git clone https://github.com/prabalpatra/TaskMaster-API.git
cd TaskMaster-API

# Install dependencies
npm install

# Rebuild SQLite3 bindings (if needed)
npm rebuild sqlite3

# Start the server
npm start
```

### **🎯 Quick Test**
```bash
# Test server health
curl http://localhost:3002/health

# Create your first task
curl -X POST http://localhost:3002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Task","description":"Getting started with TaskMaster-API"}'

# View all tasks
curl http://localhost:3002/api/tasks
```

---

## 🌐 **Base Configuration**

### **🌍 Base URLs**
| Environment | URL | Description |
|-------------|-----|-------------|
| **Local Development** | `http://localhost:3002` | Default development server |
| **Custom Port** | `http://localhost:{PORT}` | Use `PORT=3003 npm start` |
| **Production** | `https://taskmaster-api.vercel.app` | Live deployment |

### **📡 API Base URL**
```
http://localhost:3002/api
```

### **🔒 Authentication**
Currently, the API is **public** and doesn't require authentication. All endpoints are accessible without tokens or API keys.

> **🚀 Future Enhancement**: Authentication system with JWT tokens is planned for v3.0.0

### **📋 Request Headers**
```http
Content-Type: application/json
Accept: application/json
```

---

## 📊 **Data Models**

### **📋 Task Object**
Complete task data structure with all properties:

```typescript
interface Task {
  id: number;                    // Auto-incrementing unique identifier
  title: string;                 // Task title (required, max 255 chars)
  description?: string;          // Optional task description
  status: 'pending' | 'in_progress' | 'completed';  // Task status
  priority: 'low' | 'medium' | 'high';              // Task priority
  created_at: string;            // ISO timestamp of creation
  updated_at: string;            // ISO timestamp of last update
}
```

### **📊 Statistics Object**
Task statistics and analytics:

```typescript
interface TaskStats {
  total: number;                 // Total number of tasks
  pending: number;               // Count of pending tasks
  in_progress: number;           // Count of in-progress tasks
  completed: number;             // Count of completed tasks
  high_priority: number;         // Count of high priority tasks
  medium_priority: number;       // Count of medium priority tasks
  low_priority: number;          // Count of low priority tasks
}
```

### **✅ Response Formats**

**Success Response:**
```json
{
  "success": true,
  "data": { /* Task object or array */ },
  "message": "Optional success message",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/tasks"
}
```

---

## 🛠️ **API Endpoints**

### **💚 Health Check**
Monitor API server status and health.

```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "message": "TaskMaster-API is running smoothly",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "2.0.0",
  "uptime": 3600
}
```

---

### **📋 Get All Tasks**
Retrieve all tasks with optional filtering and pagination.

```http
GET /api/tasks
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by status | `?status=pending` |
| `priority` | string | Filter by priority | `?priority=high` |
| `limit` | number | Limit results (future) | `?limit=10` |
| `offset` | number | Pagination offset (future) | `?offset=20` |

**Examples:**
```bash
# Get all tasks
curl "http://localhost:3002/api/tasks"

# Get pending tasks only
curl "http://localhost:3002/api/tasks?status=pending"

# Get high priority tasks
curl "http://localhost:3002/api/tasks?priority=high"

# Get pending high priority tasks
curl "http://localhost:3002/api/tasks?status=pending&priority=high"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Complete TaskMaster-API Documentation",
      "description": "Write comprehensive API documentation with examples",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2024-01-01T10:00:00.000Z",
      "updated_at": "2024-01-01T14:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Design Database Schema",
      "description": "Create optimized SQLite schema for task management",
      "status": "completed",
      "priority": "medium",
      "created_at": "2024-01-01T09:00:00.000Z",
      "updated_at": "2024-01-01T11:45:00.000Z"
    }
  ],
  "total": 2,
  "timestamp": "2024-01-01T15:00:00.000Z"
}
```

---

### **🔍 Get Task by ID**
Retrieve a specific task using its unique identifier.

```http
GET /api/tasks/{id}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | ✅ Yes | Unique task identifier |

**Example:**
```bash
curl "http://localhost:3002/api/tasks/1"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Complete TaskMaster-API Documentation",
    "description": "Write comprehensive API documentation with examples",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T14:30:00.000Z"
  },
  "timestamp": "2024-01-01T15:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found",
  "code": "TASK_NOT_FOUND",
  "timestamp": "2024-01-01T15:00:00.000Z",
  "path": "/api/tasks/999"
}
```

---

### **✨ Create New Task**
Create a new task with validation and auto-generated metadata.

```http
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "Task title (required)",
  "description": "Detailed task description (optional)",
  "status": "pending|in_progress|completed (optional, default: pending)",
  "priority": "low|medium|high (optional, default: medium)"
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters, trimmed
- `description`: Optional, max 1000 characters
- `status`: Must be one of: `pending`, `in_progress`, `completed`
- `priority`: Must be one of: `low`, `medium`, `high`

**Examples:**

**Minimal Task:**
```bash
curl -X POST "http://localhost:3002/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title": "Simple Task"}'
```

**Complete Task:**
```bash
curl -X POST "http://localhost:3002/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement User Authentication",
    "description": "Add JWT-based authentication system with login/logout functionality",
    "status": "pending",
    "priority": "high"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Implement User Authentication",
    "description": "Add JWT-based authentication system with login/logout functionality",
    "status": "pending",
    "priority": "high",
    "created_at": "2024-01-01T15:30:00.000Z",
    "updated_at": "2024-01-01T15:30:00.000Z"
  },
  "message": "Task created successfully",
  "timestamp": "2024-01-01T15:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "error": "Title is required and must be a non-empty string",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T15:30:00.000Z",
  "path": "/api/tasks"
}
```

---

### **📝 Update Task**
Update an existing task with partial or complete data.

```http
PUT /api/tasks/{id}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | ✅ Yes | Unique task identifier |

**Request Body:**
```json
{
  "title": "Updated task title (required)",
  "description": "Updated description (optional)",
  "status": "pending|in_progress|completed (optional)",
  "priority": "low|medium|high (optional)"
}
```

**Example:**
```bash
curl -X PUT "http://localhost:3002/api/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete TaskMaster-API Documentation",
    "description": "Write comprehensive API documentation with examples and testing guide",
    "status": "completed",
    "priority": "high"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Complete TaskMaster-API Documentation",
    "description": "Write comprehensive API documentation with examples and testing guide",
    "status": "completed",
    "priority": "high",
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T16:00:00.000Z"
  },
  "message": "Task updated successfully",
  "timestamp": "2024-01-01T16:00:00.000Z"
}
```

---

### **🗑️ Delete Task**
Permanently delete a task from the database.

```http
DELETE /api/tasks/{id}
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | ✅ Yes | Unique task identifier |

**Example:**
```bash
curl -X DELETE "http://localhost:3002/api/tasks/1"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "timestamp": "2024-01-01T16:15:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found",
  "code": "TASK_NOT_FOUND",
  "timestamp": "2024-01-01T16:15:00.000Z",
  "path": "/api/tasks/999"
}
```

---

### **📊 Get Statistics**
Retrieve comprehensive task statistics and analytics.

```http
GET /api/stats
```

**Example:**
```bash
curl "http://localhost:3002/api/stats"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "pending": 5,
    "in_progress": 7,
    "completed": 3,
    "high_priority": 4,
    "medium_priority": 8,
    "low_priority": 3,
    "completion_rate": 20.0,
    "last_updated": "2024-01-01T16:20:00.000Z"
  },
  "timestamp": "2024-01-01T16:20:00.000Z"
}
```

---

## 🔍 **Error Handling**

TaskMaster-API implements comprehensive error handling with detailed responses and appropriate HTTP status codes.

### **📋 HTTP Status Codes**

| Code | Status | Description | Common Causes |
|------|--------|-------------|---------------|
| **200** | OK | Request successful | Successful GET, PUT, DELETE |
| **201** | Created | Resource created | Successful POST |
| **400** | Bad Request | Invalid request data | Missing title, invalid status/priority |
| **404** | Not Found | Resource not found | Non-existent task ID, invalid endpoint |
| **500** | Internal Server Error | Server error | Database connection, unexpected errors |

### **🚨 Error Response Format**

All errors follow a consistent format for easy parsing:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "timestamp": "2024-01-01T16:30:00.000Z",
  "path": "/api/endpoint",
  "details": {
    "field": "Additional error details (optional)"
  }
}
```

### **📝 Common Error Scenarios**

**Validation Errors:**
```json
{
  "error": "Title is required and must be a non-empty string",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T16:30:00.000Z",
  "path": "/api/tasks"
}
```

**Not Found Errors:**
```json
{
  "error": "Task not found",
  "code": "TASK_NOT_FOUND",
  "timestamp": "2024-01-01T16:30:00.000Z",
  "path": "/api/tasks/999"
}
```

**Invalid Status/Priority:**
```json
{
  "error": "Status must be one of: pending, in_progress, completed",
  "code": "INVALID_STATUS",
  "timestamp": "2024-01-01T16:30:00.000Z",
  "path": "/api/tasks"
}
```

---

## 📝 **Code Examples**

### **🌐 JavaScript (Fetch API)**

**Complete Task Management Class:**
```javascript
class TaskMasterAPI {
  constructor(baseUrl = 'http://localhost:3002/api') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Get all tasks with optional filtering
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/tasks${queryString}`);
  }

  // Get single task by ID
  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  // Create new task
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  // Update existing task
  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  }

  // Delete task
  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  // Get statistics
  async getStats() {
    return this.request('/stats');
  }
}

// Usage examples
const api = new TaskMasterAPI();

// Create a new task
const newTask = await api.createTask({
  title: 'Build TaskMaster Frontend',
  description: 'Create beautiful glass morphism UI',
  priority: 'high'
});

// Get all high priority pending tasks
const tasks = await api.getTasks({
  status: 'pending',
  priority: 'high'
});

// Update task status
await api.updateTask(1, {
  title: 'Build TaskMaster Frontend',
  status: 'completed'
});

// Get statistics
const stats = await api.getStats();
console.log(`Total tasks: ${stats.data.total}`);
```

### **🐍 Python (requests)**

**Complete Python Client:**
```python
import requests
import json
from datetime import datetime
from typing import Dict, List, Optional

class TaskMasterAPI:
    def __init__(self, base_url: str = "http://localhost:3002/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Request failed: {e}")
            if hasattr(e.response, 'json'):
                error_data = e.response.json()
                print(f"Error details: {error_data}")
            raise

    def get_tasks(self, status: Optional[str] = None, 
                  priority: Optional[str] = None) -> Dict:
        """Get all tasks with optional filtering"""
        params = {}
        if status:
            params['status'] = status
        if priority:
            params['priority'] = priority
        
        return self._request('GET', '/tasks', params=params)

    def get_task(self, task_id: int) -> Dict:
        """Get single task by ID"""
        return self._request('GET', f'/tasks/{task_id}')

    def create_task(self, title: str, description: str = "", 
                   status: str = "pending", priority: str = "medium") -> Dict:
        """Create new task"""
        task_data = {
            'title': title,
            'description': description,
            'status': status,
            'priority': priority
        }
        return self._request('POST', '/tasks', json=task_data)

    def update_task(self, task_id: int, **updates) -> Dict:
        """Update existing task"""
        return self._request('PUT', f'/tasks/{task_id}', json=updates)

    def delete_task(self, task_id: int) -> Dict:
        """Delete task"""
        return self._request('DELETE', f'/tasks/{task_id}')

    def get_stats(self) -> Dict:
        """Get task statistics"""
        return self._request('GET', '/stats')

# Usage examples
if __name__ == "__main__":
    api = TaskMasterAPI()

    # Create a new task
    new_task = api.create_task(
        title="Setup CI/CD Pipeline",
        description="Configure GitHub Actions for automated testing",
        priority="high"
    )
    print(f"Created task: {new_task['data']['title']}")

    # Get all tasks
    all_tasks = api.get_tasks()
    print(f"Total tasks: {all_tasks['total']}")

    # Filter high priority tasks
    high_priority = api.get_tasks(priority="high")
    print(f"High priority tasks: {len(high_priority['data'])}")

    # Update task
    if all_tasks['data']:
        first_task = all_tasks['data'][0]
        updated = api.update_task(
            first_task['id'],
            status="in_progress"
        )
        print(f"Updated task status: {updated['data']['status']}")

    # Get statistics
    stats = api.get_stats()
    print(f"Statistics: {json.dumps(stats['data'], indent=2)}")
```

### **⚡ Node.js (axios)**

**Complete Node.js Client:**
```javascript
const axios = require('axios');

class TaskMasterAPI {
  constructor(baseUrl = 'http://localhost:3002/api') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error.response?.data || error;
      }
    );
  }

  async getTasks(filters = {}) {
    return this.client.get('/tasks', { params: filters });
  }

  async getTask(id) {
    return this.client.get(`/tasks/${id}`);
  }

  async createTask(taskData) {
    return this.client.post('/tasks', taskData);
  }

  async updateTask(id, taskData) {
    return this.client.put(`/tasks/${id}`, taskData);
  }

  async deleteTask(id) {
    return this.client.delete(`/tasks/${id}`);
  }

  async getStats() {
    return this.client.get('/stats');
  }
}

// Usage examples
async function main() {
  const api = new TaskMasterAPI();

  try {
    // Create multiple tasks
    const tasks = [
      {
        title: 'Setup Development Environment',
        description: 'Install Node.js, npm, and required dependencies',
        priority: 'high'
      },
      {
        title: 'Write Unit Tests',
        description: 'Create comprehensive test suite',
        priority: 'medium'
      },
      {
        title: 'Deploy to Production',
        description: 'Setup production deployment pipeline',
        priority: 'low',
        status: 'pending'
      }
    ];

    for (const taskData of tasks) {
      const result = await api.createTask(taskData);
      console.log(`Created: ${result.data.title}`);
    }

    // Get all tasks and log summary
    const allTasks = await api.getTasks();
    console.log(`\nTotal tasks: ${allTasks.total}`);

    // Get statistics
    const stats = await api.getStats();
    console.log('\nStatistics:', JSON.stringify(stats.data, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

---

## 🧪 **Testing Guide**

### **🔬 Built-in Test Suite**

TaskMaster-API includes a comprehensive testing utility:

```bash
# Run all API tests
node test-api.js

# Example output:
# ✅ Health Check: OK
# ✅ Create Task: SUCCESS
# ✅ Get All Tasks: SUCCESS
# ✅ Get Task by ID: SUCCESS
# ✅ Update Task: SUCCESS
# ✅ Delete Task: SUCCESS
# ✅ Get Statistics: SUCCESS
# 
# 🎉 All tests passed! API is working correctly.
```

### **🧪 Manual Testing with cURL**

**Complete Test Sequence:**
```bash
#!/bin/bash

echo "🧪 Testing TaskMaster-API..."

# 1. Health check
echo "1. Testing health endpoint..."
curl -s "http://localhost:3002/health" | jq

# 2. Create test tasks
echo -e "\n2. Creating test tasks..."
TASK1=$(curl -s -X POST "http://localhost:3002/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task 1","priority":"high"}' | jq -r '.data.id')

TASK2=$(curl -s -X POST "http://localhost:3002/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task 2","status":"in_progress","priority":"medium"}' | jq -r '.data.id')

echo "Created tasks with IDs: $TASK1, $TASK2"

# 3. Get all tasks
echo -e "\n3. Getting all tasks..."
curl -s "http://localhost:3002/api/tasks" | jq

# 4. Filter tasks
echo -e "\n4. Getting high priority tasks..."
curl -s "http://localhost:3002/api/tasks?priority=high" | jq

# 5. Update task
echo -e "\n5. Updating task $TASK1..."
curl -s -X PUT "http://localhost:3002/api/tasks/$TASK1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Test Task","status":"completed"}' | jq

# 6. Get statistics
echo -e "\n6. Getting statistics..."
curl -s "http://localhost:3002/api/stats" | jq

# 7. Delete test tasks
echo -e "\n7. Cleaning up test tasks..."
curl -s -X DELETE "http://localhost:3002/api/tasks/$TASK1" | jq
curl -s -X DELETE "http://localhost:3002/api/tasks/$TASK2" | jq

echo -e "\n✅ Testing complete!"
```

### **📱 Postman Collection**

**Import this collection into Postman:**

```json
{
  "info": {
    "name": "TaskMaster-API",
    "description": "Complete API test collection for TaskMaster-API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3002",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Get All Tasks",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/tasks"
      }
    },
    {
      "name": "Create Task",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Sample Task\",\n  \"description\": \"This is a sample task\",\n  \"priority\": \"high\"\n}"
        },
        "url": "{{baseUrl}}/api/tasks"
      }
    },
    {
      "name": "Get Task by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/tasks/1"
      }
    },
    {
      "name": "Update Task",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Updated Task\",\n  \"status\": \"completed\"\n}"
        },
        "url": "{{baseUrl}}/api/tasks/1"
      }
    },
    {
      "name": "Delete Task",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": "{{baseUrl}}/api/tasks/1"
      }
    },
    {
      "name": "Get Statistics",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/stats"
      }
    }
  ]
}
```

---

## 📈 **Performance & Monitoring**

### **📊 Performance Metrics**

TaskMaster-API includes built-in performance monitoring:

```javascript
// Example performance data from server logs
[2024-01-01T16:45:23.123Z] GET /api/tasks - 200 - 15ms
[2024-01-01T16:45:24.456Z] POST /api/tasks - 201 - 32ms
[2024-01-01T16:45:25.789Z] PUT /api/tasks/1 - 200 - 18ms
```

### **🔍 Monitoring Endpoints**

**Server Health:**
```bash
curl "http://localhost:3002/health"
```

**Database Stats:**
```bash
# Check database file size
ls -lh tasks.db

# View database schema
sqlite3 tasks.db ".schema"

# Count total records
sqlite3 tasks.db "SELECT COUNT(*) FROM tasks;"
```

### **📈 Performance Best Practices**

1. **Database Optimization:**
   - Use indexed queries for better performance
   - Regular database cleanup for deleted records
   - Monitor database file size growth

2. **API Response Times:**
   - Target < 50ms for GET requests
   - Target < 100ms for POST/PUT requests
   - Monitor for performance degradation

3. **Memory Management:**
   - Regular monitoring of Node.js memory usage
   - Proper database connection handling
   - Efficient query patterns

---

## 🔧 **Advanced Usage**

### **🔒 Database Management**

**Direct SQLite Operations:**
```bash
# Connect to database
sqlite3 tasks.db

# View all tables
.tables

# View table schema
.schema tasks

# Run custom queries
SELECT * FROM tasks WHERE priority = 'high';

# Export data
.mode csv
.output tasks_backup.csv
SELECT * FROM tasks;

# Import data
.mode csv
.import new_tasks.csv tasks
```

### **🚀 Scaling Considerations**

**Database Optimization:**
```sql
-- Create indexes for better performance
CREATE INDEX idx_status ON tasks(status);
CREATE INDEX idx_priority ON tasks(priority);
CREATE INDEX idx_created_at ON tasks(created_at);

-- Optimize queries with EXPLAIN QUERY PLAN
EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE status = 'pending';
```

**Server Configuration:**
```javascript
// Example production configuration
const config = {
  port: process.env.PORT || 3002,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    credentials: true
  },
  database: {
    filename: process.env.DB_PATH || './tasks.db',
    timeout: 30000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined'
  }
};
```

### **🔐 Security Enhancements**

**Input Sanitization:**
```javascript
// Example sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body.title) {
    req.body.title = req.body.title.trim().substring(0, 255);
  }
  if (req.body.description) {
    req.body.description = req.body.description.trim().substring(0, 1000);
  }
  next();
};
```

**Rate Limiting (Future Enhancement):**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api', limiter);
```

---

<div align="center">

## 🎉 **Ready to Build Amazing Things?**

**TaskMaster-API provides everything you need for robust task management!**

[![Get Started](https://img.shields.io/badge/Get%20Started-Now-brightgreen?style=for-the-badge&logo=rocket)](https://github.com/prabalpatra/TaskMaster-API)
[![View Examples](https://img.shields.io/badge/View%20Examples-blue?style=for-the-badge&logo=code)](https://github.com/prabalpatra/TaskMaster-API/tree/main/examples)
[![Join Community](https://img.shields.io/badge/Join%20Community-purple?style=for-the-badge&logo=discord)](https://github.com/prabalpatra/TaskMaster-API/discussions)

### 📞 **Need Help?**

- 📚 **Documentation**: [Complete API Reference](https://github.com/prabalpatra/TaskMaster-API/blob/main/API_DOCUMENTATION.md)
- 🐛 **Issues**: [Report Bugs](https://github.com/prabalpatra/TaskMaster-API/issues)
- 💬 **Discussions**: [Community Forum](https://github.com/prabalpatra/TaskMaster-API/discussions)
- 📧 **Contact**: [prabalpatra@example.com](mailto:prabalpatra@example.com)

**💝 Built with ❤️ by the TaskMaster-API Team**

</div>

---

**Last Updated:** January 2024 | **Version:** 2.0.0 | **License:** MIT 