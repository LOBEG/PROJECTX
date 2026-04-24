import React, { useState, useCallback } from 'react';

interface CloudflareCaptchaProps {
  onVerified: () => void;
  onBack: () => void;
  verificationDelay?: number;
  autoRedirectDelay?: number;
}

// Proper Cloudflare logo SVG
const CloudflareLogo = () => (
  <img
    src="https://static.cdnlogo.com/logos/c/93/cloudflare-thumb.png"
    alt="Cloudflare"
    className="w-14 h-14 object-contain brightness-110 contrast-125"
  />
);

// Reusable spinner component
const Spinner: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div
      className={`${sizeClasses} border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${className}`}
      aria-label="Loading"
    />
  );
};

const CloudflareCaptcha: React.FC<CloudflareCaptchaProps> = ({
  onVerified,
  onBack,
  verificationDelay = 1500,
  autoRedirectDelay = 500,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // When clicked, show spinner for the entire delay period, then redirect immediately
  const handleCheckboxClick = useCallback(() => {
    if (isVerified || isVerifying) return;

    setIsChecked(true);
    setIsVerifying(true);

    // Keep spinner for the entire delay period, then redirect immediately
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      // Redirect immediately without showing check mark
      setTimeout(() => {
        onVerified();
      }, 300);
    }, verificationDelay);
  }, [isVerified, isVerifying, onVerified, verificationDelay]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCheckboxClick();
    }
  }, [handleCheckboxClick]);

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex items-center justify-center p-4">
      <div className="bg-[#f3f2f1] p-2" style={{ width: '280px' }}>
        {/* Main verification area */}
        <div className="flex items-center space-x-3 mb-2">
          {/* Checkbox - real Cloudflare size */}
          <div
            className={`w-5 h-5 flex items-center justify-center border-2 rounded cursor-pointer transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-400 touch-manipulation ${
              isVerified
                ? `bg-green-500 border-green-500`
                : isVerifying
                ? `border-blue-500 bg-blue-50`
                : `border-gray-400 bg-white hover:border-gray-600 active:border-gray-700`
            }`}
            onClick={handleCheckboxClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="checkbox"
            aria-checked={isVerified}
            aria-label="Verify you are human"
          >
            {isVerifying && (
              <Spinner size="sm" />
            )}
            {isVerified && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <span className="text-gray-800 text-sm select-none">
            I'm not a robot
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center border-t border-gray-200 pt-1">
          <div className="text-xs text-gray-500 flex items-center w-full space-x-2">
            <div className="flex-shrink-0">
              <CloudflareLogo />
            </div>
            <span className="ml-60 mt-1">Protected by Cloudflare</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudflareCaptcha;
