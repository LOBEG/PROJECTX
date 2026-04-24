export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const bodyRaw = event.body || '{}';
    let data;
    try {
      data = JSON.parse(bodyRaw);
    } catch (parseErr) {
      data = {};
    }

    const { email, phone, otp, timestamp } = data;

    console.log(`📱 [SENDOTP] Received request:`, { email, phone, otp, timestamp });

    // Validate required fields
    if (!email || !phone || !otp) {
      console.error('❌ [SENDOTP] Missing required fields');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          received: { email: !!email, phone: !!phone, otp: !!otp }
        }),
      };
    }

    // Validate phone format (must be digits only, 10-15 digits)
    const phoneDigitsOnly = phone.replace(/\D/g, '');
    if (phoneDigitsOnly.length < 10 || phoneDigitsOnly.length > 15) {
      console.error('❌ [SENDOTP] Invalid phone format:', phone, 'digits:', phoneDigitsOnly);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid phone format',
          received: phone,
          digitsOnly: phoneDigitsOnly,
          message: 'Phone must contain 10-15 digits'
        }),
      };
    }

    // Validate OTP is 6 digits
    if (!/^\d{6}$/.test(otp)) {
      console.error('❌ [SENDOTP] Invalid OTP format:', otp);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid OTP format',
          message: 'OTP must be exactly 6 digits'
        }),
      };
    }

    console.log(`✅ [SENDOTP] Validation passed`);
    console.log(`📨 [SENDOTP] Would send OTP: ${otp} to phone: ${phone} for email: ${email}`);

    // TODO: Integrate with real SMS service here (Twilio, AWS SNS, etc.)
    // For now: simulate successful send
    console.log(`✅ [SENDOTP] OTP sent successfully (simulated)`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'OTP sent successfully',
        phone: phoneDigitsOnly,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('❌ [SENDOTP] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: String(error.message || error),
        timestamp: new Date().toISOString(),
      }),
    };
  }
};