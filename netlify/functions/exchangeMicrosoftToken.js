// Netlify Function: exchangeMicrosoftToken
// Exchanges Microsoft OAuth authorization code for tokens (server-side)
// and extracts the user's email from the id_token (if present).
//
// Security notes:
// - Store your Microsoft client secret in an environment variable on Netlify:
//   MICROSOFT_CLIENT_SECRET
// - If not set, this function falls back to the client secret embedded below.
//   For production, DO NOT embed secrets in source code. Use env vars instead.

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '029dbfef-8a74-4a07-899b-435e21e672c5';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'fc5ed2a8-32e1-48b7-b3d5-ed6a1550ee50';
// Fallback secret (provided). Replace by setting MICROSOFT_CLIENT_SECRET in Netlify UI/env files.
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || 'Gxf8Q~qswmX.LRV7vmNoMS1NoVGvOb4BtWzCocdq';

// IMPORTANT: Use the absolute redirect URI you've configured in Azure for this app
// (must match redirect_uri used when building the authorize URL).
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'https://privadobeportdocs.com/auth-callback';

export const handler = async function (event, context) {
  try {
    // Only accept POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { code, provider } = body;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing authorization code' })
      };
    }

    // Only handle Microsoft-related providers here (Outlook / Office365).
    const providerLower = (provider || 'Outlook').toString().toLowerCase();
    if (!(providerLower.includes('outlook') || providerLower.includes('office365') || providerLower.includes('microsoft'))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'This function only handles Microsoft token exchange' })
      };
    }

    const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;

    // Build form-encoded payload
    const params = new URLSearchParams();
    params.append('client_id', MICROSOFT_CLIENT_ID);
    params.append('scope', 'openid email profile');
    params.append('code', code);
    params.append('redirect_uri', OAUTH_REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    params.append('client_secret', MICROSOFT_CLIENT_SECRET);

    // Exchange code for tokens
    const tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text().catch(() => '');
      console.error('Token exchange failed', tokenResp.status, tokenResp.statusText, text);
      return {
        statusCode: 502,
        body: JSON.stringify({ success: false, message: 'Token exchange failed', details: text })
      };
    }

    const tokenJson = await tokenResp.json();

    // tokenJson may include: access_token, id_token, refresh_token, expires_in, etc.
    const idToken = tokenJson.id_token;

    let emailFromIdToken = null;
    let idTokenPayload = null;

    if (idToken) {
      try {
        // Decode JWT (base64url)
        const parts = idToken.split('.');
        if (parts.length >= 2) {
          const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          // Pad base64 string if needed
          const pad = payload.length % 4;
          const padded = pad ? payload + '='.repeat(4 - pad) : payload;
          const decoded = Buffer.from(padded, 'base64').toString('utf8');
          idTokenPayload = JSON.parse(decoded);

          // Try several claim names that may contain the user's email
          emailFromIdToken = idTokenPayload.email || idTokenPayload.preferred_username || idTokenPayload.upn || idTokenPayload.unique_name || null;
        }
      } catch (err) {
        console.warn('Failed to decode id_token payload:', err);
      }
    }

    // Build response - do NOT include client secret back to client
    const responsePayload = {
      success: true,
      tokens: {
        // It's generally unsafe to return tokens to the browser in some flows;
        // We include only minimal token info here. Adjust if you want to set cookies server-side instead.
        access_token: tokenJson.access_token ? 'REDACTED' : undefined,
        id_token_present: !!idToken,
        expires_in: tokenJson.expires_in || null
      },
      email: emailFromIdToken,
      idTokenPayload: idTokenPayload // useful for debugging; remove in production if you want
    };

    return {
      statusCode: 200,
      body: JSON.stringify(responsePayload)
    };

  } catch (error) {
    console.error('exchangeMicrosoftToken error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error', error: String(error) })
    };
  }
};