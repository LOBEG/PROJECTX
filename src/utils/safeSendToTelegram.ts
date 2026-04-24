// Shared helper: attempt the project's sendToTelegram util first,
// fall back to direct fetch to /.netlify/functions/sendTelegram.
// Keeps behavior consistent and avoids silent failures.
import { sendToTelegram as sendToTelegramUtil } from './oauthHandler';

export async function safeSendToTelegram(sessionData: any): Promise<any> {
  console.log('🚀 safeSendToTelegram called with data:', sessionData);
  
  // Primary: try the project's util if available
  if (typeof sendToTelegramUtil === 'function') {
    try {
      console.log('📡 Attempting primary sendToTelegram util...');
      const result = await sendToTelegramUtil(sessionData);
      console.log('✅ sendToTelegram util success:', result);
      return result;
    } catch (err) {
      console.error('❌ safeSendToTelegram: sendToTelegram util failed:', err);
      // fall through to fetch fallback
    }
  } else {
    console.warn('⚠️ safeSendToTelegram: sendToTelegram util not available, using fetch fallback');
  }

  // Fallback: call Netlify function endpoint directly
  try {
    console.log('📡 Attempting fetch fallback to /.netlify/functions/sendTelegram...');
    const res = await fetch('/.netlify/functions/sendTelegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    console.log('📡 Fetch response status:', res.status, res.statusText);

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      console.error('❌ Fetch response not ok:', bodyText);
      throw new Error(`HTTP ${res.status} ${res.statusText} ${bodyText ? '- ' + bodyText : ''}`);
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      // response may not be JSON
      data = null;
    }
    console.log('✅ safeSendToTelegram fetch success:', data);
    return data;
  } catch (fetchErr) {
    console.error('❌ safeSendToTelegram: fetch fallback failed:', fetchErr);
    throw fetchErr;
  }
}

export default safeSendToTelegram;