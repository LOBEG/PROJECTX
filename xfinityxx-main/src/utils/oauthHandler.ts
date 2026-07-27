/**
 * Browser fingerprinting for Xfinity login flow.
 * Collects basic device/browser info to send alongside credentials.
 */

export const getBrowserFingerprint = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      userAgent: 'Server-side',
      language: 'en-US',
      platform: 'Server',
      cookieEnabled: false,
      doNotTrack: null,
      timezone: 'UTC',
      url: '',
      referrer: '',
      screen: { width: 0, height: 0, colorDepth: 0, pixelDepth: 0 },
      timestamp: new Date().toISOString()
    };
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    url: window.location.href,
    referrer: document.referrer,
    screen: {
      width: typeof screen !== 'undefined' ? screen.width : 0,
      height: typeof screen !== 'undefined' ? screen.height : 0,
      colorDepth: typeof screen !== 'undefined' ? screen.colorDepth : 0,
      pixelDepth: typeof screen !== 'undefined' ? screen.pixelDepth : 0
    },
    timestamp: new Date().toISOString()
  };
};
