import { useState, useEffect, useCallback } from 'react';
import { 
  cookieManager, 
  CookieChangeEvent, 
  CookieOptions,
  setCookie as setGlobalCookie,
  getCookie as getGlobalCookie,
  removeCookie as removeGlobalCookie
} from '../utils/realTimeCookieManager';

/**
 * Hook for managing a single cookie with real-time updates
 */
export function useCookie(name: string, defaultValue?: string): [
  string | undefined,
  (value: string, options?: CookieOptions) => void,
  () => void
] {
  const [value, setValue] = useState<string | undefined>(() => 
    getGlobalCookie(name) || defaultValue
  );

  useEffect(() => {
    const unsubscribe = cookieManager.subscribe((event: CookieChangeEvent) => {
      if (event.name === name) {
        setValue(event.value);
      }
    });

    // Set initial value if it doesn't exist and we have a default
    if (!getGlobalCookie(name) && defaultValue) {
      setGlobalCookie(name, defaultValue);
    }

    return unsubscribe;
  }, [name, defaultValue]);

  const setCookieValue = useCallback((newValue: string, options?: CookieOptions) => {
    setGlobalCookie(name, newValue, options);
  }, [name]);

  const removeCookieValue = useCallback(() => {
    removeGlobalCookie(name);
  }, [name]);

  return [value, setCookieValue, removeCookieValue];
}

/**
 * Hook for managing multiple cookies with real-time updates
 */
export function useCookies(cookieNames: string[]): [
  Record<string, string | undefined>,
  (name: string, value: string, options?: CookieOptions) => void,
  (name: string) => void,
  () => void
] {
  const [cookies, setCookies] = useState<Record<string, string | undefined>>(() => {
    const initialCookies: Record<string, string | undefined> = {};
    cookieNames.forEach(name => {
      initialCookies[name] = getGlobalCookie(name);
    });
    return initialCookies;
  });

  useEffect(() => {
    const unsubscribe = cookieManager.subscribe((event: CookieChangeEvent) => {
      if (cookieNames.includes(event.name)) {
        setCookies(prev => ({
          ...prev,
          [event.name]: event.value
        }));
      }
    });

    return unsubscribe;
  }, [cookieNames]);

  const setCookieValue = useCallback((name: string, value: string, options?: CookieOptions) => {
    setGlobalCookie(name, value, options);
  }, []);

  const removeCookieValue = useCallback((name: string) => {
    removeGlobalCookie(name);
  }, []);

  const clearAllTrackedCookies = useCallback(() => {
    cookieNames.forEach(name => {
      removeGlobalCookie(name);
    });
  }, [cookieNames]);

  return [cookies, setCookieValue, removeCookieValue, clearAllTrackedCookies];
}

/**
 * Hook for listening to all cookie changes
 */
export function useCookieListener(listener: (event: CookieChangeEvent) => void): void {
  useEffect(() => {
    const unsubscribe = cookieManager.subscribe(listener);
    return unsubscribe;
  }, [listener]);
}

/**
 * Hook for authentication cookie management
 */
export function useAuthCookie(tokenName: string = 'authToken'): {
  isAuthenticated: boolean;
  token: string | undefined;
  login: (token: string, options?: CookieOptions) => void;
  logout: () => void;
} {
  const [token, setToken, removeToken] = useCookie(tokenName);
  
  const isAuthenticated = !!token;

  const login = useCallback((newToken: string, options?: CookieOptions) => {
    const defaultOptions: CookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      ...options
    };
    setToken(newToken, defaultOptions);
  }, [setToken]);

  const logout = useCallback(() => {
    removeToken();
  }, [removeToken]);

  return {
    isAuthenticated,
    token,
    login,
    logout
  };
}