// Simple test script to check notification API
const { spawn } = require('child_process');

console.log('Testing notification API...');

// Test unread count endpoint
const testUnreadCount = () => {
    console.log('\n=== Testing unread count endpoint ===');
    
    const curl = spawn('curl', [
        '-X', 'GET',
        'http://localhost:8004/api/v1/notifications/unread-count',
        '-H', 'Content-Type: application/json'
    ]);

    curl.stdout.on('data', (data) => {
        console.log('Response:', data.toString());
    });

    curl.stderr.on('data', (data) => {
        console.error('Error:', data.toString());
    });

    curl.on('close', (code) => {
        console.log(`curl process exited with code ${code}`);
    });
};

// Test get notifications endpoint
const testGetNotifications = () => {
    console.log('\n=== Testing get notifications endpoint ===');
    
    const curl = spawn('curl', [
        '-X', 'GET',
        'http://localhost:8004/api/v1/notifications',
        '-H', 'Content-Type: application/json'
    ]);

    curl.stdout.on('data', (data) => {
        console.log('Response:', data.toString());
    });

    curl.stderr.on('data', (data) => {
        console.error('Error:', data.toString());
    });

    curl.on('close', (code) => {
        console.log(`curl process exited with code ${code}`);
    });
};

testUnreadCount();
setTimeout(testGetNotifications, 2000);