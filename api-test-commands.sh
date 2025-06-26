#!/bin/bash

# TaskMaster API Test Commands
# Make sure your server is running on port 3002: npm start

echo "🚀 Testing TaskMaster API endpoints..."
echo "============================================="

BASE_URL="http://localhost:3002"

echo ""
echo "1. 🔍 Health Check"
echo "-------------------"
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "2. 📋 Get All Tasks"
echo "-------------------"
curl -X GET "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "3. ➕ Create a New Task"
echo "----------------------"
curl -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete API Testing with Keploy",
    "description": "Integrate Keploy AI testing into CI/CD pipeline",
    "status": "pending",
    "priority": "high"
  }' \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "4. ➕ Create Another Task"
echo "------------------------"
curl -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Set up OpenAPI Documentation",
    "description": "Create comprehensive OpenAPI schema for the API",
    "status": "in_progress",
    "priority": "medium"
  }' \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "5. 📋 Get All Tasks (After Creation)"
echo "------------------------------------"
curl -X GET "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "6. 🔍 Get Task by ID (ID: 1)"
echo "----------------------------"
curl -X GET "$BASE_URL/api/tasks/1" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "7. ✏️ Update Task (ID: 1)"
echo "-------------------------"
curl -X PUT "$BASE_URL/api/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete API Testing with Keploy - UPDATED",
    "description": "Successfully integrated Keploy AI testing into CI/CD pipeline",
    "status": "completed",
    "priority": "high"
  }' \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "8. 📊 Get Task Statistics"
echo "-------------------------"
curl -X GET "$BASE_URL/api/stats" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "9. 🔍 Filter Tasks by Status (pending)"
echo "--------------------------------------"
curl -X GET "$BASE_URL/api/tasks?status=pending" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "10. 🔍 Filter Tasks by Priority (high)"
echo "--------------------------------------"
curl -X GET "$BASE_URL/api/tasks?priority=high" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "11. 🗑️ Delete Task (ID: 2)"
echo "---------------------------"
curl -X DELETE "$BASE_URL/api/tasks/2" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "12. 📊 Final Statistics"
echo "----------------------"
curl -X GET "$BASE_URL/api/stats" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "13. ❌ Test 404 Error (Non-existent Task)"
echo "-----------------------------------------"
curl -X GET "$BASE_URL/api/tasks/999" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "14. ❌ Test API 404 (Non-existent Endpoint)"
echo "-------------------------------------------"
curl -X GET "$BASE_URL/api/nonexistent" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

echo ""
echo "✅ API testing completed!"
echo "=========================" 