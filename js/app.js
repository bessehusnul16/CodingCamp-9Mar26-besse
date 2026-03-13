/**
 * Productivity Dashboard - Main Application
 * A vanilla JavaScript productivity dashboard with timer, tasks, and quick links
 */

const ProductivityDashboard = (function() {
    'use strict';
    
    // Private variables
    let components = {};
    let services = {};
    
    // Utility functions for performance optimization
    const Utils = {
        // Debounce function to limit rapid function calls
        debounce: function(func, wait, immediate) {
            let timeout;
            return function executedFunction() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },
        
        // Throttle function for performance-critical operations
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Element cache for optimized DOM queries
        elementCache: new Map(),
        
        // Cached element getter
        getElement: function(selector, context = document) {
            const cacheKey = `${context === document ? 'doc' : 'ctx'}_${selector}`;
            if (!this.elementCache.has(cacheKey)) {
                const element = context.querySelector(selector);
                if (element) {
                    this.elementCache.set(cacheKey, element);
                }
                return element;
            }
            return this.elementCache.get(cacheKey);
        },
        
        // Performance timing utility
        measurePerformance: function(name, fn) {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            console.log(`${name} took ${end - start} milliseconds`);
            return result;
        }
    };
    
    // Storage Service - Centralized Local Storage management
    const StorageService = {
        // Browser compatibility flags
        _isSupported: null,
        _fallbackStorage: new Map(),
        
        save: function(key, data) {
            try {
                if (!this.isSupported()) {
                    // Fallback to in-memory storage
                    this._fallbackStorage.set(key, JSON.stringify(data));
                    console.warn('Using fallback storage - data will not persist across sessions');
                    return true;
                }
                
                // Test storage quota before saving
                const serialized = JSON.stringify(data);
                if (this._checkStorageQuota(serialized)) {
                    localStorage.setItem(key, serialized);
                    return true;
                } else {
                    throw new Error('Storage quota exceeded');
                }
            } catch (error) {
                console.error('Storage save error:', error);
                // Try fallback storage
                try {
                    this._fallbackStorage.set(key, JSON.stringify(data));
                    console.warn('Using fallback storage due to error:', error.message);
                    return true;
                } catch (fallbackError) {
                    console.error('Fallback storage also failed:', fallbackError);
                    return false;
                }
            }
        },
        
        load: function(key) {
            try {
                if (!this.isSupported()) {
                    // Use fallback storage
                    const data = this._fallbackStorage.get(key);
                    return data ? JSON.parse(data) : null;
                }
                
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('Storage load error:', error);
                // Try fallback storage
                try {
                    const data = this._fallbackStorage.get(key);
                    return data ? JSON.parse(data) : null;
                } catch (fallbackError) {
                    console.error('Fallback storage load failed:', fallbackError);
                    return null;
                }
            }
        },
        
        remove: function(key) {
            try {
                if (!this.isSupported()) {
                    this._fallbackStorage.delete(key);
                    return true;
                }
                
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                // Try fallback storage
                try {
                    this._fallbackStorage.delete(key);
                    return true;
                } catch (fallbackError) {
                    console.error('Fallback storage remove failed:', fallbackError);
                    return false;
                }
            }
        },
        
        isSupported: function() {
            if (this._isSupported !== null) {
                return this._isSupported;
            }
            
            try {
                // Test for localStorage existence
                if (typeof Storage === 'undefined' || !localStorage) {
                    this._isSupported = false;
                    return false;
                }
                
                // Test actual functionality
                const testKey = '__storage_test__';
                const testValue = 'test';
                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                
                this._isSupported = retrieved === testValue;
                return this._isSupported;
            } catch (error) {
                console.warn('Local Storage test failed:', error);
                this._isSupported = false;
                return false;
            }
        },
        
        _checkStorageQuota: function(data) {
            try {
                // Estimate current usage
                let currentSize = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        currentSize += localStorage[key].length + key.length;
                    }
                }
                
                // Rough estimate: most browsers allow 5-10MB
                const estimatedLimit = 5 * 1024 * 1024; // 5MB
                const dataSize = data.length;
                
                return (currentSize + dataSize) < estimatedLimit * 0.9; // Use 90% as safety margin
            } catch (error) {
                console.warn('Storage quota check failed:', error);
                return true; // Assume it's okay if we can't check
            }
        },
        
        getStorageInfo: function() {
            return {
                supported: this.isSupported(),
                usingFallback: !this.isSupported(),
                fallbackSize: this._fallbackStorage.size,
                type: this.isSupported() ? 'localStorage' : 'memory'
            };
        },
        
        // Clear all fallback storage (useful for testing)
        clearFallback: function() {
            this._fallbackStorage.clear();
        }
    };
    
    // Greeting Display Component
    const GreetingDisplay = {
        element: null,
        greetingText: null,
        currentTime: null,
        currentDate: null,
        updateInterval: null,
        
        init: function(element) {
            this.element = element;
            this.greetingText = element.querySelector('#greeting');
            this.currentTime = element.querySelector('#current-time');
            this.currentDate = element.querySelector('#current-date');
            
            this.updateDisplay();
            this.startUpdateInterval();
        },
        
        updateDisplay: function() {
            const now = new Date();
            this.greetingText.textContent = this.getTimeBasedGreeting(now);
            this.currentTime.textContent = this.formatTime(now);
            this.currentDate.textContent = this.formatDate(now);
        },
        
        getTimeBasedGreeting: function(date) {
            const hour = date.getHours();
            if (hour >= 5 && hour < 12) return 'Good Morning';
            if (hour >= 12 && hour < 17) return 'Good Afternoon';
            if (hour >= 17 && hour < 21) return 'Good Evening';
            return 'Good Night';
        },
        
        formatTime: function(date) {
            try {
                // Try modern toLocaleTimeString first
                return date.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                // Fallback for older browsers
                try {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                } catch (fallbackError) {
                    // Last resort
                    return date.toTimeString().substring(0, 5);
                }
            }
        },
        
        formatDate: function(date) {
            try {
                // Try modern toLocaleDateString first
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                // Fallback for older browsers
                try {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                    
                    const dayName = days[date.getDay()];
                    const monthName = months[date.getMonth()];
                    const day = date.getDate();
                    const year = date.getFullYear();
                    
                    return `${dayName}, ${monthName} ${day}, ${year}`;
                } catch (fallbackError) {
                    // Last resort
                    return date.toDateString();
                }
            }
        },
        
        startUpdateInterval: function() {
            // Update every minute
            this.updateInterval = setInterval(() => {
                this.updateDisplay();
            }, 60000);
        },
        
        destroy: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        }
    };
    
    // Timer Component
    const TimerComponent = {
        element: null,
        display: null,
        startBtn: null,
        stopBtn: null,
        resetBtn: null,
        notification: null,
        
        // Timer state
        timeRemaining: 1500, // 25 minutes in seconds
        isRunning: false,
        intervalId: null,
        
        init: function(element) {
            this.element = element;
            this.display = element.querySelector('#timer-display');
            this.startBtn = element.querySelector('#start-timer');
            this.stopBtn = element.querySelector('#stop-timer');
            this.resetBtn = element.querySelector('#reset-timer');
            this.notification = element.querySelector('#timer-notification');
            
            this.bindEvents();
            this.updateDisplay();
        },
        
        bindEvents: function() {
            this.startBtn.addEventListener('click', () => this.start());
            this.stopBtn.addEventListener('click', () => this.stop());
            this.resetBtn.addEventListener('click', () => this.reset());
        },
        
        start: function() {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.clearNotification();
            
            // Add visual feedback for running state
            this.element.classList.add('timer-running');
            
            this.intervalId = setInterval(() => {
                this.timeRemaining--;
                this.updateDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.onComplete();
                }
            }, 1000);
        },
        
        stop: function() {
            if (!this.isRunning) return;
            
            this.isRunning = false;
            this.element.classList.remove('timer-running');
            
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },
        
        reset: function() {
            this.stop();
            this.timeRemaining = 1500; // Reset to 25 minutes
            this.updateDisplay();
            this.clearNotification();
        },
        
        updateDisplay: function() {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            this.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },
        
        onComplete: function() {
            this.stop();
            this.showNotification('Focus session complete! Time for a break.');
        },
        
        showNotification: function(message) {
            this.notification.textContent = message;
            this.notification.className = 'timer-notification success';
        },
        
        clearNotification: function() {
            this.notification.textContent = '';
            this.notification.className = 'timer-notification';
        }
    };
    
    // Task Manager Component
    const TaskManager = {
        element: null,
        taskInput: null,
        addTaskBtn: null,
        taskList: null,
        tasks: [],
        
        // Cached DOM elements for performance
        cachedElements: {},
        
        init: function(element) {
            this.element = element;
            this.cacheElements();
            this.bindEvents();
            this.loadTasks();
            this.renderTasks();
        },
        
        cacheElements: function() {
            this.taskInput = Utils.getElement('#task-input', this.element);
            this.addTaskBtn = Utils.getElement('#add-task', this.element);
            this.taskList = Utils.getElement('#task-list', this.element);
        },
        
        bindEvents: function() {
            // Debounced add task to prevent rapid submissions
            const debouncedAddTask = Utils.debounce(() => this.addTask(), 300);
            
            this.addTaskBtn.addEventListener('click', debouncedAddTask);
            
            // Optimized keypress handler
            this.taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    debouncedAddTask();
                }
            });
            
            // Add input validation feedback
            this.taskInput.addEventListener('input', Utils.throttle((e) => {
                this.validateTaskInput(e.target.value);
            }, 100));
        },
        
        validateTaskInput: function(value) {
            const isValid = value.trim().length > 0;
            this.addTaskBtn.disabled = !isValid;
            this.taskInput.classList.toggle('invalid', !isValid && value.length > 0);
        },
        
        addTask: function() {
            const description = this.taskInput.value.trim();
            if (!description) return;
            
            // Add visual feedback
            this.addTaskBtn.classList.add('loading');
            
            const task = {
                id: Date.now().toString(),
                description: description,
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            this.tasks.push(task);
            
            // Use requestAnimationFrame for smooth UI updates
            requestAnimationFrame(() => {
                this.saveTasks();
                this.renderTasks();
                this.taskInput.value = '';
                this.addTaskBtn.classList.remove('loading');
                this.addTaskBtn.disabled = true;
                
                // Add success feedback
                this.showSuccessFeedback();
            });
        },
        
        showSuccessFeedback: function() {
            this.taskInput.classList.add('success-feedback');
            setTimeout(() => {
                this.taskInput.classList.remove('success-feedback');
            }, 600);
        },
        
        editTask: function(id, newDescription) {
            const task = this.tasks.find(t => t.id === id);
            if (task && newDescription.trim()) {
                task.description = newDescription.trim();
                task.updatedAt = new Date();
                
                // Batch DOM updates for better performance
                requestAnimationFrame(() => {
                    this.saveTasks();
                    this.renderTasks();
                });
            }
        },
        
        toggleTask: function(id) {
            const task = this.tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                task.updatedAt = new Date();
                
                // Immediate visual feedback
                const taskElement = Utils.getElement(`[data-task-id="${id}"]`);
                if (taskElement) {
                    taskElement.classList.toggle('completed', task.completed);
                }
                
                // Batch save operation
                requestAnimationFrame(() => {
                    this.saveTasks();
                });
            }
        },
        
        deleteTask: function(id) {
            if (confirm('Are you sure you want to delete this task?')) {
                this.tasks = this.tasks.filter(t => t.id !== id);
                
                // Smooth removal animation
                const taskElement = Utils.getElement(`[data-task-id="${id}"]`);
                if (taskElement) {
                    taskElement.style.transition = 'all 0.3s ease';
                    taskElement.style.transform = 'translateX(-100%)';
                    taskElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.saveTasks();
                        this.renderTasks();
                    }, 300);
                }
            }
        },
        
        renderTasks: function() {
            // Use DocumentFragment for efficient DOM manipulation
            const fragment = document.createDocumentFragment();
            
            this.tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.setAttribute('data-task-id', task.id);
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <input type="text" class="task-text" value="${task.description}" readonly>
                    <div class="task-actions">
                        <button class="task-btn edit-btn" aria-label="Edit task">Edit</button>
                        <button class="task-btn delete-btn" aria-label="Delete task">Delete</button>
                    </div>
                `;
                
                // Bind events for this task with optimized handlers
                this.bindTaskEvents(li, task);
                fragment.appendChild(li);
            });
            
            // Single DOM update
            this.taskList.innerHTML = '';
            this.taskList.appendChild(fragment);
        },
        
        bindTaskEvents: function(taskElement, task) {
            const checkbox = taskElement.querySelector('.task-checkbox');
            const textInput = taskElement.querySelector('.task-text');
            const editBtn = taskElement.querySelector('.edit-btn');
            const deleteBtn = taskElement.querySelector('.delete-btn');
            
            // Optimized event handlers
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            // Debounced edit functionality
            const debouncedEdit = Utils.debounce((newValue) => {
                this.editTask(task.id, newValue);
            }, 500);
            
            editBtn.addEventListener('click', () => {
                if (textInput.readOnly) {
                    textInput.readOnly = false;
                    textInput.focus();
                    textInput.select();
                    editBtn.textContent = 'Save';
                } else {
                    debouncedEdit(textInput.value);
                    textInput.readOnly = true;
                    editBtn.textContent = 'Edit';
                }
            });
            
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    debouncedEdit(textInput.value);
                    textInput.readOnly = true;
                    editBtn.textContent = 'Edit';
                }
            });
        },
        
        loadTasks: function() {
            const saved = StorageService.load('productivity-dashboard-tasks');
            this.tasks = saved || [];
        },
        
        saveTasks: function() {
            StorageService.save('productivity-dashboard-tasks', this.tasks);
        }
    };
    
    // Link Manager Component
    const LinkManager = {
        element: null,
        urlInput: null,
        labelInput: null,
        addLinkBtn: null,
        linksGrid: null,
        links: [],
        
        init: function(element) {
            this.element = element;
            this.cacheElements();
            this.bindEvents();
            this.loadLinks();
            this.renderLinks();
        },
        
        cacheElements: function() {
            this.urlInput = Utils.getElement('#link-url', this.element);
            this.labelInput = Utils.getElement('#link-label', this.element);
            this.addLinkBtn = Utils.getElement('#add-link', this.element);
            this.linksGrid = Utils.getElement('#links-grid', this.element);
        },
        
        bindEvents: function() {
            // Debounced add link to prevent rapid submissions
            const debouncedAddLink = Utils.debounce(() => this.addLink(), 300);
            
            this.addLinkBtn.addEventListener('click', debouncedAddLink);
            
            // Optimized input handlers
            this.urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.labelInput.focus();
                }
            });
            
            this.labelInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    debouncedAddLink();
                }
            });
            
            // Real-time validation with throttling
            this.urlInput.addEventListener('input', Utils.throttle((e) => {
                this.validateInputs();
            }, 200));
            
            this.labelInput.addEventListener('input', Utils.throttle((e) => {
                this.validateInputs();
            }, 200));
        },
        
        validateInputs: function() {
            const url = this.urlInput.value.trim();
            const label = this.labelInput.value.trim();
            const isValid = url && label && this.isValidUrl(url);
            
            this.addLinkBtn.disabled = !isValid;
            this.urlInput.classList.toggle('invalid', url && !this.isValidUrl(url));
        },
        
        addLink: function() {
            const url = this.urlInput.value.trim();
            const label = this.labelInput.value.trim();
            
            if (!url || !label) return;
            
            // Basic URL validation
            if (!this.isValidUrl(url)) {
                this.showError('Please enter a valid URL');
                return;
            }
            
            // Add visual feedback
            this.addLinkBtn.classList.add('loading');
            
            const link = {
                id: Date.now().toString(),
                url: url,
                label: label,
                createdAt: new Date()
            };
            
            this.links.push(link);
            
            // Batch DOM updates
            requestAnimationFrame(() => {
                this.saveLinks();
                this.renderLinks();
                this.urlInput.value = '';
                this.labelInput.value = '';
                this.addLinkBtn.classList.remove('loading');
                this.addLinkBtn.disabled = true;
                
                // Success feedback
                this.showSuccessFeedback();
            });
        },
        
        showSuccessFeedback: function() {
            this.urlInput.classList.add('success-feedback');
            setTimeout(() => {
                this.urlInput.classList.remove('success-feedback');
            }, 600);
        },
        
        showError: function(message) {
            // Simple error display - could be enhanced with a proper notification system
            console.error(message);
            alert(message);
        },
        
        editLink: function(id, newUrl, newLabel) {
            const link = this.links.find(l => l.id === id);
            if (link && newUrl.trim() && newLabel.trim()) {
                if (!this.isValidUrl(newUrl)) {
                    this.showError('Please enter a valid URL');
                    return false;
                }
                link.url = newUrl.trim();
                link.label = newLabel.trim();
                
                // Batch DOM updates
                requestAnimationFrame(() => {
                    this.saveLinks();
                    this.renderLinks();
                });
                return true;
            }
            return false;
        },
        
        deleteLink: function(id) {
            if (confirm('Are you sure you want to delete this link?')) {
                // Smooth removal animation
                const linkElement = Utils.getElement(`[data-link-id="${id}"]`);
                if (linkElement) {
                    linkElement.style.transition = 'all 0.3s ease';
                    linkElement.style.transform = 'scale(0.8)';
                    linkElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.links = this.links.filter(l => l.id !== id);
                        this.saveLinks();
                        this.renderLinks();
                    }, 300);
                } else {
                    this.links = this.links.filter(l => l.id !== id);
                    this.saveLinks();
                    this.renderLinks();
                }
            }
        },
        
        openLink: function(url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        },
        
        isValidUrl: function(string) {
            // Enhanced URL validation with fallback for older browsers
            try {
                // First try the modern URL constructor
                const url = new URL(string);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (error) {
                // Fallback to regex validation for older browsers
                try {
                    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
                    return urlPattern.test(string);
                } catch (fallbackError) {
                    // Last resort: basic protocol check
                    return string.startsWith('http://') || string.startsWith('https://');
                }
            }
        },
        
        renderLinks: function() {
            // Use DocumentFragment for efficient DOM manipulation
            const fragment = document.createDocumentFragment();
            
            this.links.forEach(link => {
                const div = document.createElement('div');
                div.className = 'link-item';
                div.setAttribute('data-link-id', link.id);
                div.innerHTML = `
                    <a href="${link.url}" class="link-button" target="_blank" rel="noopener noreferrer">${link.label}</a>
                    <div class="link-actions">
                        <button class="link-edit-btn" aria-label="Edit link">Edit</button>
                        <button class="link-delete-btn" aria-label="Delete link">Delete</button>
                    </div>
                `;
                
                // Bind events for this link with optimized handlers
                this.bindLinkEvents(div, link);
                fragment.appendChild(div);
            });
            
            // Single DOM update
            this.linksGrid.innerHTML = '';
            this.linksGrid.appendChild(fragment);
        },
        
        bindLinkEvents: function(linkElement, link) {
            const editBtn = linkElement.querySelector('.link-edit-btn');
            const deleteBtn = linkElement.querySelector('.link-delete-btn');
            
            deleteBtn.addEventListener('click', () => this.deleteLink(link.id));
            
            editBtn.addEventListener('click', () => {
                const newUrl = prompt('Enter new URL:', link.url);
                const newLabel = prompt('Enter new label:', link.label);
                
                if (newUrl !== null && newLabel !== null) {
                    this.editLink(link.id, newUrl, newLabel);
                }
            });
        },
        
        loadLinks: function() {
            const saved = StorageService.load('productivity-dashboard-links');
            this.links = saved || [];
        },
        
        saveLinks: function() {
            StorageService.save('productivity-dashboard-links', this.links);
        }
    };
    
    // Dashboard Controller - Main initialization and coordination
    const DashboardController = {
        // Browser compatibility information
        browserInfo: null,
        
        init: function() {
            // Detect browser and check compatibility
            this.browserInfo = this.detectBrowser();
            
            // Show browser compatibility warnings if needed
            if (!this.browserInfo.isSupported) {
                this.showBrowserWarning();
            }
            
            // Check for required features
            const featureCheck = this.checkRequiredFeatures();
            if (!featureCheck.allSupported) {
                this.showFeatureWarning(featureCheck);
            }
            
            // Initialize all components
            this.initializeComponents();
            
            // Set up global error handling
            this.setupErrorHandling();
            
            // Log browser compatibility info
            console.log('Browser compatibility:', this.browserInfo);
            console.log('Feature support:', featureCheck);
        },
        
        detectBrowser: function() {
            const ua = navigator.userAgent;
            const browserInfo = {
                userAgent: ua,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            };

            // Detect browser type and version
            let browserName = 'Unknown';
            let browserVersion = 'Unknown';

            if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
                browserName = 'Chrome';
                browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
            } else if (ua.indexOf('Firefox') > -1) {
                browserName = 'Firefox';
                browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
            } else if (ua.indexOf('Edg') > -1) {
                browserName = 'Edge';
                browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
            } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
                browserName = 'Safari';
                browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
            }

            browserInfo.name = browserName;
            browserInfo.version = browserVersion;
            browserInfo.isSupported = this.checkBrowserSupport(browserName, browserVersion);

            return browserInfo;
        },
        
        checkBrowserSupport: function(name, version) {
            const minVersions = {
                'Chrome': 80,
                'Firefox': 75,
                'Edge': 80,
                'Safari': 13
            };

            const minVersion = minVersions[name];
            if (!minVersion) return false;

            const versionNum = parseInt(version);
            return versionNum >= minVersion;
        },
        
        checkRequiredFeatures: function() {
            const features = {
                localStorage: this.testLocalStorage(),
                dateTimeAPI: this.testDateTimeAPI(),
                timerAPI: this.testTimerAPI(),
                domAPI: this.testDOMAPI(),
                urlAPI: this.testURLAPI(),
                cssGrid: this.testCSSGrid()
            };
            
            const supportedFeatures = Object.values(features).filter(f => f).length;
            const totalFeatures = Object.keys(features).length;
            
            return {
                features: features,
                supportedCount: supportedFeatures,
                totalCount: totalFeatures,
                allSupported: supportedFeatures === totalFeatures,
                criticalSupported: features.localStorage && features.dateTimeAPI && features.domAPI
            };
        },
        
        testLocalStorage: function() {
            return StorageService.isSupported();
        },
        
        testDateTimeAPI: function() {
            try {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return /^\d{2}:\d{2}$/.test(timeString);
            } catch (error) {
                return false;
            }
        },
        
        testTimerAPI: function() {
            try {
                return typeof setTimeout === 'function' && typeof setInterval === 'function';
            } catch (error) {
                return false;
            }
        },
        
        testDOMAPI: function() {
            try {
                return typeof document.querySelector === 'function' && 
                       typeof document.createElement === 'function' &&
                       typeof Element.prototype.addEventListener === 'function';
            } catch (error) {
                return false;
            }
        },
        
        testURLAPI: function() {
            try {
                new URL('https://example.com');
                return true;
            } catch (error) {
                return false;
            }
        },
        
        testCSSGrid: function() {
            try {
                const testDiv = document.createElement('div');
                testDiv.style.display = 'grid';
                return testDiv.style.display === 'grid';
            } catch (error) {
                return false;
            }
        },
        
        showBrowserWarning: function() {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #fff3cd;
                color: #856404;
                padding: 1rem;
                text-align: center;
                border-bottom: 2px solid #ffeaa7;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            warningDiv.innerHTML = `
                <strong>Browser Compatibility Warning:</strong> 
                You are using ${this.browserInfo.name} ${this.browserInfo.version}. 
                For the best experience, please use Chrome 80+, Firefox 75+, Edge 80+, or Safari 13+.
                <button onclick="this.parentElement.remove()" style="margin-left: 1rem; padding: 0.25rem 0.5rem; background: #856404; color: white; border: none; border-radius: 3px; cursor: pointer;">Dismiss</button>
            `;
            
            document.body.insertBefore(warningDiv, document.body.firstChild);
        },
        
        showFeatureWarning: function(featureCheck) {
            if (!featureCheck.criticalSupported) {
                // Show critical error
                const dashboard = document.querySelector('.dashboard');
                if (dashboard) {
                    dashboard.innerHTML = `
                        <div style="text-align: center; padding: 2rem; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 2rem;">
                            <h2>Browser Not Supported</h2>
                            <p>Your browser does not support the required features for this application.</p>
                            <p><strong>Missing critical features:</strong></p>
                            <ul style="text-align: left; display: inline-block;">
                                ${!featureCheck.features.localStorage ? '<li>Local Storage</li>' : ''}
                                ${!featureCheck.features.dateTimeAPI ? '<li>Date/Time API</li>' : ''}
                                ${!featureCheck.features.domAPI ? '<li>DOM API</li>' : ''}
                            </ul>
                            <p>Please update your browser or use a modern browser like Chrome, Firefox, Edge, or Safari.</p>
                        </div>
                    `;
                }
                return;
            }
            
            // Show non-critical warnings
            const missingFeatures = Object.entries(featureCheck.features)
                .filter(([name, supported]) => !supported)
                .map(([name]) => name);
                
            if (missingFeatures.length > 0) {
                console.warn('Some features are not supported:', missingFeatures);
                
                // Show a less intrusive warning
                const warningDiv = document.createElement('div');
                warningDiv.style.cssText = `
                    background: #fff3cd;
                    color: #856404;
                    padding: 1rem;
                    margin: 1rem;
                    border-radius: 8px;
                    border: 1px solid #ffeaa7;
                `;
                
                warningDiv.innerHTML = `
                    <strong>Feature Warning:</strong> Some features may not work optimally. 
                    Missing: ${missingFeatures.join(', ')}
                `;
                
                const dashboard = document.querySelector('.dashboard');
                if (dashboard) {
                    dashboard.insertBefore(warningDiv, dashboard.firstChild);
                }
            }
        },
        
        initializeComponents: function() {
            try {
                // Initialize Greeting Display
                const greetingSection = document.querySelector('.greeting-section');
                if (greetingSection) {
                    components.greeting = Object.create(GreetingDisplay);
                    components.greeting.init(greetingSection);
                }
                
                // Initialize Timer Component
                const timerSection = document.querySelector('.timer-section');
                if (timerSection) {
                    components.timer = Object.create(TimerComponent);
                    components.timer.init(timerSection);
                }
                
                // Initialize Task Manager
                const tasksSection = document.querySelector('.tasks-section');
                if (tasksSection) {
                    components.taskManager = Object.create(TaskManager);
                    components.taskManager.init(tasksSection);
                }
                
                // Initialize Link Manager
                const linksSection = document.querySelector('.links-section');
                if (linksSection) {
                    components.linkManager = Object.create(LinkManager);
                    components.linkManager.init(linksSection);
                }
                
                // Show storage info if using fallback
                const storageInfo = StorageService.getStorageInfo();
                if (storageInfo.usingFallback) {
                    this.showStorageWarning();
                }
                
                console.log('Productivity Dashboard initialized successfully');
            } catch (error) {
                console.error('Error initializing components:', error);
                this.showInitializationError(error);
            }
        },
        
        showStorageWarning: function() {
            const warningDiv = document.createElement('div');
            warningDiv.style.cssText = `
                background: #fff3cd;
                color: #856404;
                padding: 1rem;
                margin: 1rem;
                border-radius: 8px;
                border: 1px solid #ffeaa7;
                text-align: center;
            `;
            
            warningDiv.innerHTML = `
                <strong>Storage Notice:</strong> Local Storage is not available. 
                Your data will be stored temporarily and will be lost when you close the browser.
            `;
            
            const dashboard = document.querySelector('.dashboard');
            if (dashboard) {
                dashboard.insertBefore(warningDiv, dashboard.firstChild);
            }
        },
        
        setupErrorHandling: function() {
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.handleGlobalError(event.error);
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.handleGlobalError(event.reason);
            });
        },
        
        handleGlobalError: function(error) {
            // Don't show error UI for every error, just log them
            // Only show UI for critical errors that break functionality
            if (error && error.message && error.message.includes('Storage')) {
                this.showStorageError();
            }
        },
        
        showStorageError: function() {
            const dashboard = document.querySelector('.dashboard');
            if (dashboard) {
                dashboard.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: #f8d7da; color: #721c24; border-radius: 8px;">
                        <h2>Storage Error</h2>
                        <p>There was a problem with data storage. Your changes may not be saved.</p>
                        <p>Please try refreshing the page or using a different browser.</p>
                        <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #721c24; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">Refresh Page</button>
                    </div>
                `;
            }
        },
        
        showInitializationError: function(error) {
            const dashboard = document.querySelector('.dashboard');
            if (dashboard) {
                dashboard.innerHTML = `
                    <div style="text-align: center; padding: 2rem; background: #f8d7da; color: #721c24; border-radius: 8px;">
                        <h2>Initialization Error</h2>
                        <p>There was an error loading the dashboard: ${error?.message || 'Unknown error'}</p>
                        <p>Please refresh the page and try again.</p>
                        <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #721c24; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">Refresh Page</button>
                    </div>
                `;
            }
        },
        
        // Public API for external access if needed
        getComponent: function(name) {
            return components[name];
        },
        
        getBrowserInfo: function() {
            return this.browserInfo;
        },
        
        getFeatureSupport: function() {
            return this.checkRequiredFeatures();
        },
        
        getService: function(name) {
            return services[name];
        }
    };
    
    // Store services for external access
    services.storage = StorageService;
    
    // Public API
    return {
        init: DashboardController.init.bind(DashboardController),
        getComponent: DashboardController.getComponent.bind(DashboardController),
        getService: DashboardController.getService.bind(DashboardController)
    };
})();

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', ProductivityDashboard.init);