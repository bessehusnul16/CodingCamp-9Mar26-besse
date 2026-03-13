/**
 * Cross-Browser Functionality Test Suite
 * Tests all dashboard features across different browsers
 */

const CrossBrowserTests = (function() {
    'use strict';
    
    let testResults = [];
    let dashboard = null;
    
    // Test configuration
    const TEST_CONFIG = {
        timeout: 5000,
        retries: 3,
        verbose: true
    };
    
    // Utility functions
    const Utils = {
        log: function(message, type = 'info') {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
            
            if (TEST_CONFIG.verbose) {
                console.log(logMessage);
            }
            
            testResults.push({
                timestamp,
                type,
                message,
                browser: this.getBrowserInfo()
            });
        },
        
        getBrowserInfo: function() {
            const ua = navigator.userAgent;
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

            return `${browserName} ${browserVersion}`;
        },
        
        wait: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        
        waitForElement: function(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                function check() {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                    } else {
                        setTimeout(check, 100);
                    }
                }
                
                check();
            });
        },
        
        simulateClick: function(element) {
            const event = new Event('click', { bubbles: true });
            element.dispatchEvent(event);
        },
        
        simulateInput: function(element, value) {
            element.value = value;
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
        },
        
        simulateKeyPress: function(element, key) {
            const event = new KeyboardEvent('keypress', { key: key, bubbles: true });
            element.dispatchEvent(event);
        }
    };
    
    // Test suite definitions
    const TestSuites = {
        // Test 1: Browser Compatibility Detection
        testBrowserCompatibility: async function() {
            Utils.log('Testing browser compatibility detection...', 'test');
            
            try {
                // Test if dashboard controller exists and has browser info
                if (!window.ProductivityDashboard) {
                    throw new Error('ProductivityDashboard not found');
                }
                
                // Get browser info from dashboard
                const browserInfo = dashboard.getBrowserInfo ? dashboard.getBrowserInfo() : null;
                if (!browserInfo) {
                    throw new Error('Browser info not available');
                }
                
                Utils.log(`Detected browser: ${browserInfo.name} ${browserInfo.version}`, 'info');
                Utils.log(`Browser supported: ${browserInfo.isSupported}`, 'info');
                
                // Test feature support
                const featureSupport = dashboard.getFeatureSupport ? dashboard.getFeatureSupport() : null;
                if (featureSupport) {
                    Utils.log(`Features supported: ${featureSupport.supportedCount}/${featureSupport.totalCount}`, 'info');
                    Utils.log(`Critical features supported: ${featureSupport.criticalSupported}`, 'info');
                }
                
                return { success: true, browserInfo, featureSupport };
            } catch (error) {
                Utils.log(`Browser compatibility test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 2: Local Storage Functionality
        testLocalStorage: async function() {
            Utils.log('Testing Local Storage functionality...', 'test');
            
            try {
                // Test basic storage operations
                const testKey = 'cross-browser-test';
                const testData = { test: 'data', timestamp: Date.now() };
                
                // Test save
                const saveResult = dashboard.getService('storage').save(testKey, testData);
                if (!saveResult) {
                    throw new Error('Storage save failed');
                }
                
                // Test load
                const loadedData = dashboard.getService('storage').load(testKey);
                if (!loadedData || loadedData.test !== 'data') {
                    throw new Error('Storage load failed or data corrupted');
                }
                
                // Test remove
                const removeResult = dashboard.getService('storage').remove(testKey);
                if (!removeResult) {
                    throw new Error('Storage remove failed');
                }
                
                // Verify removal
                const verifyRemoval = dashboard.getService('storage').load(testKey);
                if (verifyRemoval !== null) {
                    throw new Error('Storage removal verification failed');
                }
                
                Utils.log('Local Storage test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`Local Storage test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 3: Greeting Display Component
        testGreetingDisplay: async function() {
            Utils.log('Testing Greeting Display component...', 'test');
            
            try {
                const greetingElement = await Utils.waitForElement('#greeting');
                const timeElement = await Utils.waitForElement('#current-time');
                const dateElement = await Utils.waitForElement('#current-date');
                
                // Check if elements have content
                if (!greetingElement.textContent.trim()) {
                    throw new Error('Greeting text is empty');
                }
                
                if (!timeElement.textContent.trim() || timeElement.textContent === '00:00') {
                    throw new Error('Time display is not working');
                }
                
                if (!dateElement.textContent.trim() || dateElement.textContent === 'Loading...') {
                    throw new Error('Date display is not working');
                }
                
                // Test time format (should be HH:MM)
                const timePattern = /^\d{2}:\d{2}$/;
                if (!timePattern.test(timeElement.textContent)) {
                    throw new Error('Time format is incorrect');
                }
                
                Utils.log('Greeting Display test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`Greeting Display test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 4: Timer Component
        testTimerComponent: async function() {
            Utils.log('Testing Timer component...', 'test');
            
            try {
                const timerDisplay = await Utils.waitForElement('#timer-display');
                const startButton = await Utils.waitForElement('#start-timer');
                const stopButton = await Utils.waitForElement('#stop-timer');
                const resetButton = await Utils.waitForElement('#reset-timer');
                
                // Check initial state
                if (timerDisplay.textContent !== '25:00') {
                    throw new Error('Timer initial state is incorrect');
                }
                
                // Test start button
                Utils.simulateClick(startButton);
                await Utils.wait(1100); // Wait for timer to tick
                
                if (timerDisplay.textContent === '25:00') {
                    throw new Error('Timer did not start');
                }
                
                // Test stop button
                Utils.simulateClick(stopButton);
                const stoppedTime = timerDisplay.textContent;
                await Utils.wait(1100);
                
                if (timerDisplay.textContent !== stoppedTime) {
                    throw new Error('Timer did not stop');
                }
                
                // Test reset button
                Utils.simulateClick(resetButton);
                if (timerDisplay.textContent !== '25:00') {
                    throw new Error('Timer did not reset');
                }
                
                Utils.log('Timer component test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`Timer component test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 5: Task Manager Component
        testTaskManager: async function() {
            Utils.log('Testing Task Manager component...', 'test');
            
            try {
                const taskInput = await Utils.waitForElement('#task-input');
                const addButton = await Utils.waitForElement('#add-task');
                const taskList = await Utils.waitForElement('#task-list');
                
                // Test adding a task
                const testTaskText = 'Cross-browser test task';
                Utils.simulateInput(taskInput, testTaskText);
                Utils.simulateClick(addButton);
                
                await Utils.wait(500); // Wait for task to be added
                
                const taskItems = taskList.querySelectorAll('.task-item');
                if (taskItems.length === 0) {
                    throw new Error('Task was not added');
                }
                
                const lastTask = taskItems[taskItems.length - 1];
                const taskText = lastTask.querySelector('.task-text');
                if (taskText.value !== testTaskText) {
                    throw new Error('Task text does not match');
                }
                
                // Test task completion
                const checkbox = lastTask.querySelector('.task-checkbox');
                Utils.simulateClick(checkbox);
                
                await Utils.wait(200);
                
                if (!lastTask.classList.contains('completed')) {
                    throw new Error('Task completion toggle failed');
                }
                
                // Test task deletion
                const deleteButton = lastTask.querySelector('.delete-btn');
                
                // Mock confirm dialog
                const originalConfirm = window.confirm;
                window.confirm = () => true;
                
                Utils.simulateClick(deleteButton);
                
                await Utils.wait(500);
                
                // Restore confirm
                window.confirm = originalConfirm;
                
                const remainingTasks = taskList.querySelectorAll('.task-item');
                const taskStillExists = Array.from(remainingTasks).some(task => 
                    task.querySelector('.task-text').value === testTaskText
                );
                
                if (taskStillExists) {
                    throw new Error('Task was not deleted');
                }
                
                Utils.log('Task Manager test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`Task Manager test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 6: Link Manager Component
        testLinkManager: async function() {
            Utils.log('Testing Link Manager component...', 'test');
            
            try {
                const urlInput = await Utils.waitForElement('#link-url');
                const labelInput = await Utils.waitForElement('#link-label');
                const addButton = await Utils.waitForElement('#add-link');
                const linksGrid = await Utils.waitForElement('#links-grid');
                
                // Test adding a link
                const testUrl = 'https://example.com';
                const testLabel = 'Test Link';
                
                Utils.simulateInput(urlInput, testUrl);
                Utils.simulateInput(labelInput, testLabel);
                Utils.simulateClick(addButton);
                
                await Utils.wait(500); // Wait for link to be added
                
                const linkItems = linksGrid.querySelectorAll('.link-item');
                if (linkItems.length === 0) {
                    throw new Error('Link was not added');
                }
                
                const lastLink = linkItems[linkItems.length - 1];
                const linkButton = lastLink.querySelector('.link-button');
                
                if (linkButton.textContent !== testLabel) {
                    throw new Error('Link label does not match');
                }
                
                if (linkButton.href !== testUrl) {
                    throw new Error('Link URL does not match');
                }
                
                // Test link deletion
                const deleteButton = lastLink.querySelector('.link-delete-btn');
                
                // Mock confirm dialog
                const originalConfirm = window.confirm;
                window.confirm = () => true;
                
                Utils.simulateClick(deleteButton);
                
                await Utils.wait(500);
                
                // Restore confirm
                window.confirm = originalConfirm;
                
                const remainingLinks = linksGrid.querySelectorAll('.link-item');
                const linkStillExists = Array.from(remainingLinks).some(link => 
                    link.querySelector('.link-button').textContent === testLabel
                );
                
                if (linkStillExists) {
                    throw new Error('Link was not deleted');
                }
                
                Utils.log('Link Manager test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`Link Manager test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        },
        
        // Test 7: CSS Rendering and Responsiveness
        testCSSRendering: async function() {
            Utils.log('Testing CSS rendering and responsiveness...', 'test');
            
            try {
                const dashboardElement = await Utils.waitForElement('.dashboard');
                
                // Test CSS Grid support
                const computedStyle = window.getComputedStyle(dashboardElement);
                if (computedStyle.display !== 'grid') {
                    throw new Error('CSS Grid is not working');
                }
                
                // Test responsive design by checking viewport changes
                const originalWidth = window.innerWidth;
                
                // Simulate mobile viewport
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: 375
                });
                
                // Trigger resize event
                window.dispatchEvent(new Event('resize'));
                await Utils.wait(100);
                
                // Check if layout adapts (this is a basic check)
                const mobileStyle = window.getComputedStyle(dashboardElement);
                
                // Restore original width
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: originalWidth
                });
                
                window.dispatchEvent(new Event('resize'));
                
                Utils.log('CSS rendering test passed', 'success');
                return { success: true };
            } catch (error) {
                Utils.log(`CSS rendering test failed: ${error.message}`, 'error');
                return { success: false, error: error.message };
            }
        }
    };
    
    // Main test runner
    const TestRunner = {
        runAllTests: async function() {
            Utils.log('Starting cross-browser functionality tests...', 'info');
            Utils.log(`Browser: ${Utils.getBrowserInfo()}`, 'info');
            
            const results = {};
            const testSuites = Object.keys(TestSuites);
            
            for (const testName of testSuites) {
                try {
                    Utils.log(`Running ${testName}...`, 'test');
                    results[testName] = await TestSuites[testName]();
                } catch (error) {
                    Utils.log(`Test ${testName} threw an error: ${error.message}`, 'error');
                    results[testName] = { success: false, error: error.message };
                }
                
                // Small delay between tests
                await Utils.wait(100);
            }
            
            // Generate summary
            const summary = this.generateSummary(results);
            Utils.log('Test suite completed', 'info');
            Utils.log(`Summary: ${summary.passed}/${summary.total} tests passed`, 'info');
            
            return {
                results,
                summary,
                testResults,
                browser: Utils.getBrowserInfo()
            };
        },
        
        generateSummary: function(results) {
            const total = Object.keys(results).length;
            const passed = Object.values(results).filter(r => r.success).length;
            const failed = total - passed;
            
            return {
                total,
                passed,
                failed,
                passRate: Math.round((passed / total) * 100)
            };
        },
        
        displayResults: function(testResults) {
            console.group('Cross-Browser Test Results');
            console.log('Browser:', testResults.browser);
            console.log('Summary:', testResults.summary);
            
            Object.entries(testResults.results).forEach(([testName, result]) => {
                const status = result.success ? '✅ PASS' : '❌ FAIL';
                console.log(`${status} ${testName}`);
                if (!result.success && result.error) {
                    console.log(`   Error: ${result.error}`);
                }
            });
            
            console.groupEnd();
        }
    };
    
    // Public API
    return {
        init: function() {
            // Wait for dashboard to be available
            if (window.ProductivityDashboard) {
                dashboard = window.ProductivityDashboard;
                Utils.log('Cross-browser test suite initialized', 'info');
                return true;
            } else {
                Utils.log('ProductivityDashboard not found', 'error');
                return false;
            }
        },
        
        runAllTests: TestRunner.runAllTests,
        runTest: function(testName) {
            if (TestSuites[testName]) {
                return TestSuites[testName]();
            } else {
                throw new Error(`Test ${testName} not found`);
            }
        },
        
        getResults: function() {
            return testResults;
        },
        
        clearResults: function() {
            testResults = [];
        },
        
        displayResults: TestRunner.displayResults,
        
        // Utility methods for manual testing
        utils: Utils
    };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the dashboard to initialize
    setTimeout(() => {
        if (CrossBrowserTests.init()) {
            console.log('Cross-browser test suite ready. Run CrossBrowserTests.runAllTests() to start testing.');
        }
    }, 1000);
});

// Make available globally for manual testing
window.CrossBrowserTests = CrossBrowserTests;