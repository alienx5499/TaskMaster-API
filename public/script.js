/**
 * TaskMaster Pro - Enhanced JavaScript Functionality
 * Advanced task management with beautiful animations and UX
 */

// Configuration
const CONFIG = {
    API_BASE: window.location.hostname === 'localhost' 
        ? 'http://localhost:3002/api' 
        : `${window.location.origin}/api`,
    ANIMATION_DELAY: 100,
    ALERT_DURATION: 5000,
    COUNTER_ANIMATION_SPEED: 50,
    DEBOUNCE_DELAY: 300
};

// Global State
let editingTaskId = null;
let isLoading = false;
let tasksCache = [];

// Utility Functions
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateString));
};

const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Enhanced Alert System
class AlertManager {
    constructor() {
        this.container = document.getElementById('alerts');
        this.alerts = new Map();
    }

    show(message, type = 'success', duration = CONFIG.ALERT_DURATION) {
        const alertId = Date.now().toString();
        
        const alertTypes = {
            success: { 
                bg: 'bg-gradient-to-r from-green-500 to-emerald-500', 
                icon: 'fas fa-check-circle',
                borderColor: 'border-green-400'
            },
            error: { 
                bg: 'bg-gradient-to-r from-red-500 to-rose-500', 
                icon: 'fas fa-exclamation-circle',
                borderColor: 'border-red-400'
            },
            info: { 
                bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
                icon: 'fas fa-info-circle',
                borderColor: 'border-blue-400'
            },
            warning: { 
                bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', 
                icon: 'fas fa-exclamation-triangle',
                borderColor: 'border-yellow-400'
            }
        };
        
        const config = alertTypes[type] || alertTypes.info;
        
        const alert = document.createElement('div');
        alert.id = `alert-${alertId}`;
        alert.className = `${config.bg} ${config.borderColor} text-white px-6 py-4 rounded-xl shadow-2xl transform translate-x-full transition-all duration-500 flex items-center space-x-3 max-w-sm border-l-4 backdrop-blur-sm`;
        
        alert.innerHTML = `
            <div class="flex-shrink-0">
                <i class="${config.icon} text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-relaxed">${sanitizeHTML(message)}</p>
            </div>
            <button 
                onclick="alertManager.remove('${alertId}')" 
                class="flex-shrink-0 text-white hover:text-gray-200 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                aria-label="Close alert"
            >
                <i class="fas fa-times text-sm"></i>
            </button>
        `;
        
        this.container.appendChild(alert);
        this.alerts.set(alertId, alert);
        
        // Animate in
        requestAnimationFrame(() => {
            alert.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(alertId), duration);
        }
        
        return alertId;
    }

    remove(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.style.transform = 'translateX(100%)';
            alert.style.opacity = '0';
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
                this.alerts.delete(alertId);
            }, 500);
        }
    }

    clear() {
        this.alerts.forEach((_, alertId) => this.remove(alertId));
    }
}

// Enhanced API Manager
class APIManager {
    async call(endpoint, options = {}) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alertManager.show('Network error. Please check your connection.', 'error');
            } else if (error.message.includes('JSON')) {
                alertManager.show('Server error: Invalid response format. Make sure the API server is running on http://localhost:3002', 'error');
            } else {
                alertManager.show(error.message, 'error');
            }
            
            throw error;
        }
    }
}

// Task Manager Class
class TaskManager {
    constructor() {
        this.apiManager = new APIManager();
        this.isLoading = false;
    }

    async loadTasks() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const statusFilter = document.getElementById('filterStatus').value;
            const priorityFilter = document.getElementById('filterPriority').value;
            
            let endpoint = '/tasks';
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);
            if (params.toString()) endpoint += '?' + params.toString();
            
            const response = await this.apiManager.call(endpoint);
            tasksCache = response.data;
            
            this.displayTasks(response.data);
            await this.loadStats();
            
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    displayTasks(tasks) {
        const taskList = document.getElementById('taskList');
        
        if (tasks.length === 0) {
            taskList.innerHTML = this.getEmptyState();
            return;
        }
        
        const tasksHTML = tasks.map((task, index) => this.createTaskCard(task, index)).join('');
        taskList.innerHTML = tasksHTML;
        
        // Animate cards
        this.animateTaskCards();
    }

    createTaskCard(task, index) {
        const statusIcon = this.getStatusIcon(task.status);
        const priorityIcon = this.getPriorityIcon(task.priority);
        const formattedDate = formatDate(task.created_at);
        
        return `
            <div class="glass-subtle rounded-2xl p-6 card-hover border border-white border-opacity-30 transform opacity-0 translate-y-4 gpu-accelerated task-card-item" 
                 style="animation-delay: ${index * CONFIG.ANIMATION_DELAY}ms;" 
                 data-task-id="${task.id}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1 mr-4">
                        <h4 class="text-xl font-bold text-gray-800 mb-2 leading-tight">${sanitizeHTML(task.title)}</h4>
                        ${task.description ? `<p class="text-gray-600 leading-relaxed">${sanitizeHTML(task.description)}</p>` : ''}
                    </div>
                    <div class="flex space-x-2 flex-shrink-0">
                        <button 
                            onclick="taskManager.editTask(${task.id})" 
                            class="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 btn-hover focus-ring transition-all duration-200 shadow-lg"
                            title="Edit Task"
                            aria-label="Edit task: ${sanitizeHTML(task.title)}"
                        >
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button 
                            onclick="taskManager.deleteTask(${task.id})" 
                            class="p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 btn-hover focus-ring transition-all duration-200 shadow-lg"
                            title="Delete Task"
                            aria-label="Delete task: ${sanitizeHTML(task.title)}"
                        >
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-gray-200 border-opacity-50">
                    <div class="flex space-x-3">
                        <span class="status-${task.status} px-4 py-2 rounded-full text-xs font-semibold border shadow-sm">
                            ${statusIcon} ${task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span class="priority-${task.priority} px-4 py-2 rounded-full text-xs font-semibold border shadow-sm">
                            ${priorityIcon} ${task.priority.toUpperCase()}
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 flex items-center">
                        <i class="fas fa-calendar-alt mr-2"></i>
                        <time datetime="${task.created_at}">${formattedDate}</time>
                    </div>
                </div>
            </div>
        `;
    }

    animateTaskCards() {
        const cards = document.querySelectorAll('.task-card-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-slide-up');
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * CONFIG.ANIMATION_DELAY);
        });
    }

    getEmptyState() {
        return `
            <div class="text-center py-16 animate-fade-scale">
                <div class="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <i class="fas fa-tasks text-4xl text-purple-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
                <p class="text-gray-500 text-lg mb-6">Create your first task to get started!</p>
                <button 
                    onclick="document.getElementById('title').focus()" 
                    class="btn-hover gradient-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
                >
                    <i class="fas fa-plus mr-2"></i>Create Task
                </button>
            </div>
        `;
    }

    showLoadingState() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = `
            <div class="text-center py-16">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                <p class="text-gray-500">Loading tasks...</p>
            </div>
        `;
    }

    showErrorState() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = `
            <div class="text-center py-16">
                <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Error loading tasks</h3>
                <p class="text-gray-500 mb-4">Please try again later</p>
                <button 
                    onclick="taskManager.loadTasks()" 
                    class="btn-hover bg-red-500 text-white px-6 py-2 rounded-lg"
                >
                    <i class="fas fa-redo mr-2"></i>Retry
                </button>
            </div>
        `;
    }

    hideLoadingState() {
        // Remove any loading indicators
    }

    async loadStats() {
        try {
            const response = await this.apiManager.call('/stats');
            const stats = response.data;
            
            // Animate counter updates
            this.animateCounter('totalTasks', stats.total || 0);
            this.animateCounter('pendingTasks', stats.pending || 0);
            this.animateCounter('inProgressTasks', stats.in_progress || 0);
            this.animateCounter('completedTasks', stats.completed || 0);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    animateCounter(elementId, finalValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil(Math.abs(finalValue - currentValue) / 20);
        
        if (currentValue !== finalValue) {
            const nextValue = currentValue < finalValue 
                ? Math.min(currentValue + increment, finalValue)
                : Math.max(currentValue - increment, finalValue);
                
            element.textContent = nextValue;
            setTimeout(() => this.animateCounter(elementId, finalValue), CONFIG.COUNTER_ANIMATION_SPEED);
        }
    }

    async saveTask(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        this.setButtonLoading(submitBtn, true);
        
        try {
            if (editingTaskId) {
                await this.apiManager.call(`/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                alertManager.show('Task updated successfully! 🎉', 'success');
            } else {
                await this.apiManager.call('/tasks', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                alertManager.show('Task created successfully! 🚀', 'success');
            }
            
            this.resetForm();
            await this.loadTasks();
            
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }

    getFormData() {
        return {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            status: document.getElementById('status').value,
            priority: document.getElementById('priority').value
        };
    }

    validateForm(formData) {
        if (!formData.title) {
            alertManager.show('Please enter a task title', 'warning');
            document.getElementById('title').focus();
            return false;
        }
        
        if (formData.title.length > 200) {
            alertManager.show('Task title is too long (max 200 characters)', 'warning');
            return false;
        }
        
        if (formData.description.length > 1000) {
            alertManager.show('Task description is too long (max 1000 characters)', 'warning');
            return false;
        }
        
        return true;
    }

    setButtonLoading(button, isLoading, originalText = null) {
        if (isLoading) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.innerHTML = originalText || button.innerHTML;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    async editTask(id) {
        try {
            const response = await this.apiManager.call(`/tasks/${id}`);
            const task = response.data;
            
            this.populateForm(task);
            this.scrollToForm();
            
            alertManager.show('Task loaded for editing ✏️', 'info');
        } catch (error) {
            console.error('Error loading task for edit:', error);
        }
    }

    populateForm(task) {
        document.getElementById('taskId').value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description || '';
        document.getElementById('status').value = task.status;
        document.getElementById('priority').value = task.priority;
        
        editingTaskId = task.id;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>Update Task';
        
        // Add visual feedback
        document.querySelector('.glass-effect').classList.add('ring-4', 'ring-purple-300', 'ring-opacity-50');
        setTimeout(() => {
            document.querySelector('.glass-effect').classList.remove('ring-4', 'ring-purple-300', 'ring-opacity-50');
        }, 2000);
    }

    scrollToForm() {
        document.querySelector('.glass-effect').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    async deleteTask(id) {
        const task = tasksCache.find(t => t.id === id);
        const taskTitle = task ? task.title : 'this task';
        
        if (!confirm(`⚠️ Are you sure you want to delete "${taskTitle}"?\n\nThis action cannot be undone.`)) {
            return;
        }
        
        try {
            await this.apiManager.call(`/tasks/${id}`, { method: 'DELETE' });
            alertManager.show('Task deleted successfully! 🗑️', 'success');
            
            // Animate out the task card
            const taskCard = document.querySelector(`[data-task-id="${id}"]`);
            if (taskCard) {
                taskCard.style.transform = 'translateX(-100%)';
                taskCard.style.opacity = '0';
                setTimeout(() => this.loadTasks(), 300);
            } else {
                await this.loadTasks();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    resetForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        editingTaskId = null;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save mr-2"></i>Create Task';
        document.getElementById('priority').value = 'medium';
        document.getElementById('status').value = 'pending';
        
        // Remove any visual feedback
        document.querySelector('.glass-effect').classList.remove('ring-4', 'ring-purple-300', 'ring-opacity-50');
    }

    getStatusIcon(status) {
        const icons = {
            pending: '📋',
            in_progress: '⚡',
            completed: '✅'
        };
        return icons[status] || '📋';
    }

    getPriorityIcon(priority) {
        const icons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        return icons[priority] || '🟡';
    }
}

// Initialize managers
const alertManager = new AlertManager();
const taskManager = new TaskManager();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    taskManager.loadTasks();
    
    // Form event listeners
    document.getElementById('taskForm').addEventListener('submit', (e) => taskManager.saveTask(e));
    document.getElementById('resetBtn').addEventListener('click', () => taskManager.resetForm());
    
    // Character counters
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('description');
    const titleCounter = document.getElementById('titleCounter');
    const descCounter = document.getElementById('descCounter');
    
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
        titleCounter.parentElement.className = titleInput.value.length > 180 
            ? 'mt-2 text-xs text-red-500' 
            : 'mt-2 text-xs text-gray-500';
    });
    
    descInput.addEventListener('input', () => {
        descCounter.textContent = descInput.value.length;
        descCounter.parentElement.className = descInput.value.length > 900 
            ? 'mt-2 text-xs text-red-500' 
            : 'mt-2 text-xs text-gray-500';
    });
    
    // Filter event listeners with debouncing
    const debouncedLoadTasks = debounce(() => taskManager.loadTasks(), CONFIG.DEBOUNCE_DELAY);
    document.getElementById('filterStatus').addEventListener('change', debouncedLoadTasks);
    document.getElementById('filterPriority').addEventListener('change', debouncedLoadTasks);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Welcome message
    setTimeout(() => {
        alertManager.show('Welcome to TaskMaster Pro! 🎯', 'info');
    }, 1000);
    
    // Auto-save draft functionality
    setupAutoSave();
    
    // Service worker removed - not needed for this deployment
});

// Keyboard Shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to save task
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('taskForm').requestSubmit();
    }
    
    // Escape to reset form
    if (event.key === 'Escape' && editingTaskId) {
        taskManager.resetForm();
        alertManager.show('Editing cancelled', 'info');
    }
    
    // Ctrl/Cmd + K for quick search (future feature)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('filterStatus').focus();
    }
}

// Auto-save draft functionality
function setupAutoSave() {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    
    const saveToLocalStorage = debounce(() => {
        if (!editingTaskId) { // Only save drafts for new tasks
            const draft = {
                title: titleInput.value,
                description: descriptionInput.value,
                timestamp: Date.now()
            };
            localStorage.setItem('taskDraft', JSON.stringify(draft));
        }
    }, 1000);
    
    titleInput.addEventListener('input', saveToLocalStorage);
    descriptionInput.addEventListener('input', saveToLocalStorage);
    
    // Load draft on page load
    const savedDraft = localStorage.getItem('taskDraft');
    if (savedDraft) {
        try {
            const draft = JSON.parse(savedDraft);
            // Only load draft if it's less than 24 hours old
            if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                titleInput.value = draft.title;
                descriptionInput.value = draft.description;
                if (draft.title || draft.description) {
                    alertManager.show('Draft restored', 'info');
                }
            }
        } catch (error) {
            console.error('Error loading draft:', error);
            localStorage.removeItem('taskDraft');
        }
    }
}

// Clear draft when task is saved
document.getElementById('taskForm').addEventListener('submit', () => {
    localStorage.removeItem('taskDraft');
});

// Export for global access
window.taskManager = taskManager;
window.alertManager = alertManager;
