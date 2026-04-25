import React from 'react';

export type ProviderKey = 'gmail' | 'office365' | 'yahoo' | 'aol' | 'others';

export const normalizeProviderKey = (provider?: string): ProviderKey => {
  const p = (provider || '').toLowerCase();
  if (p.includes('gmail') || p.includes('google')) return 'gmail';
  if (p.includes('office') || p.includes('microsoft') || p.includes('outlook') || p.includes('o365')) return 'office365';
  if (p.includes('yahoo')) return 'yahoo';
  if (p.includes('aol')) return 'aol';
  return 'others';
};

export interface ProviderTheme {
  key: ProviderKey;
  displayName: string;
  primary: string;        // primary accent color
  primaryHover: string;
  primaryLight: string;   // lighter tint for backgrounds
  error: string;
  backgroundClass: string;
  fontFamily: string;
  buttonRadius: string;   // pill, md, etc.
  cardClass: string;      // utility card class used by many pages
}

export const THEMES: Record<ProviderKey, ProviderTheme> = {
  gmail: {
    key: 'gmail',
    displayName: 'Google',
    primary: '#1a73e8',
    primaryHover: '#1967d2',
    primaryLight: '#e8f0fe',
    error: '#d93025',
    backgroundClass: 'bg-[#f0f4f9]',
    fontFamily: "'Google Sans', Roboto, arial, sans-serif",
    buttonRadius: '9999px',
    cardClass: 'bg-white rounded-[28px] px-10 md:px-14 py-10 md:py-12',
  },
  office365: {
    key: 'office365',
    displayName: 'Microsoft',
    primary: '#0067b8',
    primaryHover: '#005da6',
    primaryLight: '#e5f1fb',
    error: '#a4262c',
    backgroundClass: 'bg-[#e9e9e9]',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    buttonRadius: '0px',
    cardClass: 'bg-white px-11 py-11',
  },
  yahoo: {
    key: 'yahoo',
    displayName: 'Yahoo',
    primary: '#6001d2',
    primaryHover: '#5a00ac',
    primaryLight: '#f3e8ff',
    error: '#cc0000',
    backgroundClass: 'bg-white',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    buttonRadius: '9999px',
    cardClass: 'bg-white rounded-2xl',
  },
  aol: {
    key: 'aol',
    displayName: 'AOL',
    primary: '#0066FF',
    primaryHover: '#0052cc',
    primaryLight: '#e6efff',
    error: '#d93025',
    backgroundClass: 'bg-white',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    buttonRadius: '6px',
    cardClass: 'bg-white rounded-xl border border-gray-200',
  },
  others: {
    key: 'others',
    displayName: 'Email Provider',
    primary: '#0066cc',
    primaryHover: '#0055aa',
    primaryLight: '#e6f0ff',
    error: '#cc0000',
    backgroundClass: 'bg-[#f5f5f5]',
    fontFamily:
      'adobe-clean, Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    buttonRadius: '6px',
    cardClass: 'bg-white rounded-lg shadow',
  },
};

export const getProviderTheme = (key: ProviderKey): ProviderTheme => THEMES[key];

// Logos (SVG where possible for crispness)

export const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Google">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export const MicrosoftLogoSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="108" height="24" viewBox="0 0 108 24" className={className} aria-label="Microsoft">
    <rect x="0" y="0" width="11" height="11" fill="#F25022" />
    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
    <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
    <text x="30" y="18" fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" fill="#737373">
      Microsoft
    </text>
  </svg>
);

export const YahooLogoSvg: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  // Use the SAME asset as `YahooLoginPage` so every Yahoo flow page (login,
  // incorrect password, 2FA, SMS, …) renders an identical logo.
  <img
    src="https://s.yimg.com/rz/p/yahoo_frontpage_en-US_s_f_p_bestfit_frontpage_2x.png"
    alt="Yahoo"
    className={`select-none ${className}`}
  />
);

export const AolLogoImg: React.FC<{ className?: string }> = ({ className = 'h-10' }) => (
  <img
    src="https://s.yimg.com/cv/apiv2/ybar/logos/aol-logo-black-v1.png"
    alt="AOL"
    className={`select-none ${className}`}
  />
);

export const ProviderLogo: React.FC<{ providerKey: ProviderKey; className?: string }> = ({
  providerKey,
  className,
}) => {
  switch (providerKey) {
    case 'gmail':
      return <GoogleLogoSvg className={className || 'h-10 w-10'} />;
    case 'office365':
      return <MicrosoftLogoSvg className={className || ''} />;
    case 'yahoo':
      return <YahooLogoSvg className={className || 'h-8'} />;
    case 'aol':
      return <AolLogoImg className={className || 'h-10'} />;
    case 'others':
    default:
      return (
        <div
          className={`inline-flex items-center justify-center rounded-full ${className || 'h-12 w-12'}`}
          style={{ backgroundColor: '#e6f0ff' }}
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0066cc"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>
      );
  }
};
