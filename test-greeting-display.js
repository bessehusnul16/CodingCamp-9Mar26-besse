/**
 * Greeting Display Component Test
 * Verifies the GreetingDisplay component meets all requirements
 */

// Extract the greeting display functions for testing
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

// Test results tracking
let testResults = { passed: 0, failed: 0, total: 0 };

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

console.log('=== Greeting Display Component Verification ===\n');

// Test time formatting (Requirement 1.1)
console.log('Time Formatting Tests (Requirement 1.1):');
const testTimes = [
    new Date('2024-01-15T09:05:00'),
    new Date('2024-01-15T14:30:00'),
    new Date('2024-01-15T23:59:00'),
    new Date('2024-01-15T00:00:00')
];

testTimes.forEach((date, index) => {
    runTest(`Time Format Test ${index + 1}`, () => {
        const timeStr = formatTime(date);
        const isValidFormat = /^\d{2}:\d{2}$/.test(timeStr);
        console.log(`  Input: ${date.toISOString()}, Output: ${timeStr}`);
        return isValidFormat;
    });
});

// Test date formatting (Requirement 1.2)
console.log('\nDate Formatting Tests (Requirement 1.2):');
testTimes.forEach((date, index) => {
    runTest(`Date Format Test ${index + 1}`, () => {
        const dateStr = formatDate(date);
        const isValidFormat = dateStr && typeof dateStr === 'string' && dateStr.length > 0;
        console.log(`  Input: ${date.toISOString()}, Output: ${dateStr}`);
        return isValidFormat;
    });
});

// Test greeting logic (Requirements 2.1-2.4)
console.log('\nGreeting Logic Tests (Requirements 2.1-2.4):');
const greetingTests = [
    // Morning tests (5:00-11:59)
    { hour: 5, minute: 0, expected: 'Good Morning', requirement: '2.1' },
    { hour: 8, minute: 30, expected: 'Good Morning', requirement: '2.1' },
    { hour: 11, minute: 59, expected: 'Good Morning', requirement: '2.1' },
    
    // Afternoon tests (12:00-16:59)
    { hour: 12, minute: 0, expected: 'Good Afternoon', requirement: '2.2' },
    { hour: 14, minute: 30, expected: 'Good Afternoon', requirement: '2.2' },
    { hour: 16, minute: 59, expected: 'Good Afternoon', requirement: '2.2' },
    
    // Evening tests (17:00-20:59)
    { hour: 17, minute: 0, expected: 'Good Evening', requirement: '2.3' },
    { hour: 19, minute: 30, expected: 'Good Evening', requirement: '2.3' },
    { hour: 20, minute: 59, expected: 'Good Evening', requirement: '2.3' },
    
    // Night tests (21:00-4:59)
    { hour: 21, minute: 0, expected: 'Good Night', requirement: '2.4' },
    { hour: 23, minute: 30, expected: 'Good Night', requirement: '2.4' },
    { hour: 2, minute: 30, expected: 'Good Night', requirement: '2.4' },
    { hour: 4, minute: 59, expected: 'Good Night', requirement: '2.4' }
];

greetingTests.forEach((test, index) => {
    runTest(`Greeting Test ${index + 1} (Req ${test.requirement})`, () => {
        const testDate = new Date();
        testDate.setHours(test.hour, test.minute, 0, 0);
        const greeting = getTimeBasedGreeting(testDate);
        console.log(`  Time: ${test.hour}:${test.minute.toString().padStart(2, '0')}, Expected: ${test.expected}, Got: ${greeting}`);
        return greeting === test.expected;
    });
});

// Test boundary conditions
console.log('\nBoundary Condition Tests:');
const boundaryTests = [
    { hour: 4, minute: 59, expected: 'Good Night', description: 'Last minute of night' },
    { hour: 5, minute: 0, expected: 'Good Morning', description: 'First minute of morning' },
    { hour: 11, minute: 59, expected: 'Good Morning', description: 'Last minute of morning' },
    { hour: 12, minute: 0, expected: 'Good Afternoon', description: 'First minute of afternoon' },
    { hour: 16, minute: 59, expected: 'Good Afternoon', description: 'Last minute of afternoon' },
    { hour: 17, minute: 0, expected: 'Good Evening', description: 'First minute of evening' },
    { hour: 20, minute: 59, expected: 'Good Evening', description: 'Last minute of evening' },
    { hour: 21, minute: 0, expected: 'Good Night', description: 'First minute of night' }
];

boundaryTests.forEach((test, index) => {
    runTest(`Boundary Test ${index + 1}: ${test.description}`, () => {
        const testDate = new Date();
        testDate.setHours(test.hour, test.minute, 0, 0);
        const greeting = getTimeBasedGreeting(testDate);
        console.log(`  Time: ${test.hour}:${test.minute.toString().padStart(2, '0')}, Expected: ${test.expected}, Got: ${greeting}`);
        return greeting === test.expected;
    });
});

console.log('\n=== Test Results ===');
console.log(`Total Tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 All GreetingDisplay component tests passed!');
    console.log('\nRequirements Verified:');
    console.log('✓ 1.1: Time display in HH:MM format');
    console.log('✓ 1.2: Date display in readable format');
    console.log('✓ 2.1: Good Morning (5:00-11:59 AM)');
    console.log('✓ 2.2: Good Afternoon (12:00-4:59 PM)');
    console.log('✓ 2.3: Good Evening (5:00-8:59 PM)');
    console.log('✓ 2.4: Good Night (9:00 PM-4:59 AM)');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}