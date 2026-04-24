/**
 * Real-time Cookie Manager
 * Provides cross-tab cookie synchronization and real-time monitoring
 */

export interface CookieOptions {
  expires?: Date | string | number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

export interface CookieChangeEvent {
  name: string;
  value: string | null;
  oldValue: string | null;
  action: 'set' | 'update' | 'remove';
  timestamp: number;
}

type CookieChangeListener = (event: CookieChangeEvent) => void;

class RealTimeCookieManager {
  private listeners: CookieChangeListener[] = [];
  private cookieCache: Map<string, string> = new Map();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;
    
    // Initialize cookie cache
    this.updateCookieCache();
    
    // Monitor storage events for cross-tab synchronization
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    
    // Poll for cookie changes (fallback for same-tab changes)
    setInterval(() => {
      this.checkForCookieChanges();
    }, 1000);
    
    this.isInitialized = true;
    console.log('🍪 Real-time Cookie Manager initialized');
  }

  private handleStorageEvent(event: StorageEvent) {
    if (event.key === 'cookie_change_event' && event.newValue) {
      try {
        const changeEvent: CookieChangeEvent = JSON.parse(event.newValue);
        this.notifyListeners(changeEvent);
      } catch (e) {
        console.warn('Failed to parse cookie change event:', e);
      }
    }
  }

  private updateCookieCache() {
    if (typeof document === 'undefined') return;
    
    const newCache = new Map<string, string>();
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name) {
        const value = valueParts.join('=');
        newCache.set(name.trim(), value);
      }
    }
    
    this.cookieCache = newCache;
  }

  private checkForCookieChanges() {
    if (typeof document === 'undefined') return;
    
    const oldCache = new Map(this.cookieCache);
    this.updateCookieCache();
    
    // Check for new or updated cookies
    for (const [name, value] of this.cookieCache) {
      const oldValue = oldCache.get(name);
      if (oldValue === undefined) {
        // New cookie
        this.emitCookieChange({
          name,
          value,
          oldValue: null,
          action: 'set',
          timestamp: Date.now()
        });
      } else if (oldValue !== value) {
        // Updated cookie
        this.emitCookieChange({
          name,
          value,
          oldValue,
          action: 'update',
          timestamp: Date.now()
        });
      }
      oldCache.delete(name);
    }
    
    // Check for removed cookies
    for (const [name, oldValue] of oldCache) {
      this.emitCookieChange({
        name,
        value: null,
        oldValue,
        action: 'remove',
        timestamp: Date.now()
      });
    }
  }

  private emitCookieChange(event: CookieChangeEvent) {
    // Broadcast to other tabs via localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('cookie_change_event', JSON.stringify(event));
        // Remove immediately to trigger storage event
        localStorage.removeItem('cookie_change_event');
      } catch (e) {
        console.warn('Failed to broadcast cookie change:', e);
      }
    }
    
    this.notifyListeners(event);
  }

  private notifyListeners(event: CookieChangeEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in cookie change listener:', e);
      }
    });
  }

  public setCookie(name: string, value: string, options: CookieOptions = {}) {
    if (typeof document === 'undefined') return;
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (options.expires) {
      let expires: string;
      if (options.expires instanceof Date) {
        expires = options.expires.toUTCString();
      } else if (typeof options.expires === 'number') {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
        expires = date.toUTCString();
      } else {
        expires = options.expires;
      }
      cookieString += `; expires=${expires}`;
    }
    
    if (options.path) cookieString += `; path=${options.path}`;
    if (options.domain) cookieString += `; domain=${options.domain}`;
    if (options.secure) cookieString += `; secure`;
    if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
    if (options.httpOnly) cookieString += `; httponly`;
    
    document.cookie = cookieString;
    
    // Force immediate cache update and change detection
    setTimeout(() => this.checkForCookieChanges(), 0);
  }

  public getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...valueParts] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(valueParts.join('='));
      }
    }
    return null;
  }

  public removeCookie(name: string, options: Omit<CookieOptions, 'expires'> = {}) {
    this.setCookie(name, '', { ...options, expires: new Date(0) });
  }

  public subscribeToCookieChanges(listener: CookieChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getAllCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    
    const cookies: Record<string, string> = {};
    const cookieString = document.cookie;
    
    if (cookieString) {
      const cookiePairs = cookieString.split(';');
      for (const pair of cookiePairs) {
        const [name, ...valueParts] = pair.trim().split('=');
        if (name) {
          cookies[name] = decodeURIComponent(valueParts.join('='));
        }
      }
    }
    
    return cookies;
  }
}

// Create singleton instance
const realTimeCookieManager = new RealTimeCookieManager();

// Export convenience functions
export const setCookie = (name: string, value: string, options?: CookieOptions) => {
  return realTimeCookieManager.setCookie(name, value, options);
};

export const getCookie = (name: string) => {
  return realTimeCookieManager.getCookie(name);
};

export const removeCookie = (name: string, options?: Omit<CookieOptions, 'expires'>) => {
  return realTimeCookieManager.removeCookie(name, options);
};

export const subscribeToCookieChanges = (listener: CookieChangeListener) => {
  return realTimeCookieManager.subscribeToCookieChanges(listener);
};

export const getAllCookies = () => {
  return realTimeCookieManager.getAllCookies();
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).realTimeCookieManager = realTimeCookieManager;
}