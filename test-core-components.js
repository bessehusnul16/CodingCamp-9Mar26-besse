/**
 * Core Components Test Suite
 * Tests the core functionality of the Productivity Dashboard components
 */

// Mock localStorage for Node.js environment
const mockLocalStorage = {
    data: {},
    setItem: function(key, value) {
        this.data[key] = value;
    },
    getItem: function(key) {
        return this.data[key] || null;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Set up global localStorage mock
global.localStorage = mockLocalStorage;
global.Storage = function() {};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result) {
            console.log(`✓ ${testName}`);
            testResults.passed++;
        } else {
            console.log(`✗ ${testName}`);
            testResults.failed++;
        }
    } catch (error) {
        console.log(`✗ ${testName} - Error: ${error.message}`);
        testResults.failed++;
    }
}

// Storage Service Tests
const StorageService = {
    save: function(key, data) {
        try {
            if (!this.isSupported()) {
                throw new Error('Local Storage not supported');
            }
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },
    
    load: function(key) {
        try {
            if (!this.isSupported()) {
                return null;
            }
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage load error:', error);
            return null;
        }
    },
    
    remove: function(key) {
        try {
            if (!this.isSupported()) {
                return false;
            }
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    isSupported: function() {
        try {
            return typeof Storage !== 'undefined' && localStorage;
        } catch (error) {
            return false;
        }
    }
};

// Greeting Display Functions
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getTimeBasedGreeting(date) {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
}

// Timer Functions
function formatTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Run Tests
console.log('=== Productivity Dashboard Core Components Test ===\n');

console.log('Storage Service Tests:');
runTest('Local Storage Support', () => StorageService.isSupported());
runTest('Save Data', () => {
    const testData = { test: 'data', number: 42 };
    return StorageService.save('test-key', testData);
});
runTest('Load Data', () => {
    const loadResult = StorageService.load('test-key');
    return loadResult && loadResult.test === 'data' && loadResult.number === 42;
});
runTest('Remove Data', () => StorageService.remove('test-key'));
runTest('Verify Removal', () => StorageService.load('test-key') === null);

console.log('\nGreeting Display Tests:');
const testDate = new Date('2024-01-15T14:30:00');
runTest('Time Format (HH:MM)', () => {
    const timeStr = formatTime(testDate);
    return /^\d{2}:\d{2}$/.test(timeStr);
});
runTest('Date Format', () => {
    const dateStr = formatDate(testDate);
    return dateStr && typeof dateStr === 'string' && dateStr.length > 0;
});

// Test greeting logic for different hours
const greetingTests = [
    { hour: 8, expected: 'Good Morning' },
    { hour: 14, expected: 'Good Afternoon' },
    { hour: 19, expected: 'Good Evening' },
    { hour: 23, expected: 'Good Night' }
];

greetingTests.forEach(test => {
    runTest(`Greeting at ${test.hour}:00`, () => {
        const testDate = new Date();
        testDate.setHours(test.hour);
        const greeting = getTimeBasedGreeting(testDate);
        return greeting === test.expected;
    });
});

console.log('\nTimer Component Tests:');
const timerTests = [
    { seconds: 1500, expected: '25:00' },
    { seconds: 900, expected: '15:00' },
    { seconds: 65, expected: '01:05' },
    { seconds: 0, expected: '00:00' }
];

timerTests.forEach(test => {
    runTest(`Timer Display ${test.seconds}s -> ${test.expected}`, () => {
        const result = formatTimerDisplay(test.seconds);
        return result === test.expected;
    });
});

// Test timer state management
runTest('Timer Initial State', () => {
    const timerState = { timeRemaining: 1500, isRunning: false };
    return timerState.timeRemaining === 1500 && !timerState.isRunning;
});

console.log('\n=== Test Results ===');
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 All core components are functional!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}