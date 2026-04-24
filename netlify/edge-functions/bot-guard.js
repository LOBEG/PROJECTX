// Netlify Edge Function — bot/crawler/scanner detection at CDN edge level
// Runs BEFORE any content is served, blocking bots from seeing the actual site

const BLOCKED_BOTS = [
  // Search engine crawlers
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
  'google-inspectiontool', 'googleother', 'google-read-aloud',
  'storebot-google', 'googleproducer',
  // SEO / marketing bots
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'bytespider', 'rogerbot', 'screaming frog', 'seokicks',
  'sistrix', 'blexbot', 'linkdexbot', 'megaindex',
  'serpstatbot', 'serendeputybot', 'dataforseo', 'keys-so-bot',
  // AI bots
  'gptbot', 'chatgpt-user', 'ccbot', 'claudebot',
  'anthropic-ai', 'cohere-ai', 'google-extended',
  'perplexitybot', 'youbot', 'meta-externalagent',
  'amazonbot', 'applebot', 'diffbot', 'omgili',
  'facebook', 'facebookexternalhit',
  'meta-externalfetcher', 'bytedance', 'iaskspider',
  'ai2bot', 'friendlycrawler', 'timpibot', 'velenpublicweb',
  'webzio-extended', 'img2dataset', 'omgilibot',
  // Generic bot patterns
  'crawler', 'spider', 'scraper', 'bot/', 'bot;',
  'fetch/', 'scan', 'check', 'monitor', 'probe',
  // Headless browsers
  'headlesschrome', 'phantomjs', 'slimerjs', 'casperjs',
  'puppeteer', 'playwright', 'selenium', 'webdriver',
  'chromedriver', 'geckodriver', 'electronjs',
  // Security scanners / safe browsing
  'urlscan', 'virustotal', 'phishtank', 'safebrowsing',
  'google-safety', 'google-safebrowsing',
  'netcraft', 'sucuri', 'siteguard', 'securitytrails',
  'censys', 'shodan', 'zoomeye', 'nuclei', 'nikto',
  'nessus', 'openvas', 'qualys', 'acunetix', 'netsparker',
  'burpsuite', 'zap/', 'wapiti', 'skipfish', 'w3af',
  'detectify', 'probely', 'intruder', 'pentest-tools',
  'sitecheck', 'ssllabs', 'securityheaders',
  'smartscreen', 'phishing', 'antivirus', 'antiphishing',
  'malware', 'sandbox', 'clamav', 'sophos',
  'kaspersky', 'norton', 'mcafee', 'avast', 'avg',
  'bitdefender', 'eset', 'fortinet', 'paloalto',
  'forcepoint', 'barracuda', 'proofpoint', 'mimecast',
  'checkphish', 'isitphishing', 'phishcheck', 'cyren',
  'trustwave', 'rapid7', 'tenable', 'immuniweb', 'quttera',
  'haveibeenpwned', 'cybersource', 'riskiq',
  // Scanning / fuzzing tools
  'dirbuster', 'gobuster', 'ffuf', 'feroxbuster',
  'masscan', 'nmap', 'zgrab', 'httpx', 'subfinder',
  'amass', 'knockpy', 'theHarvester',
  'wpscan', 'joomscan', 'droopescan',
  // HTTP libraries / automation
  'wget', 'httrack', 'curl/', 'python-requests', 'python-urllib',
  'go-http-client', 'java/', 'libwww-perl', 'httpie',
  'axios/', 'node-fetch', 'undici', 'http.rb',
  'ruby', 'okhttp', 'apache-httpclient',
  'aiohttp', 'reqwest', 'scrapy', 'mechanize',
  'lwp-trivial', 'pycurl', 'http_request', 'urlgrabber',
  // Link checkers / validators
  'linkchecker', 'w3c_validator', 'w3c-checklink',
  'dead link', 'broken link', 'link checker',
  // Archive / research bots
  'archive.org_bot', 'wayback', 'commoncrawl',
  'nutch', 'heritrix',
  // Preview / embed bots
  'twitterbot', 'linkedinbot', 'slackbot', 'discordbot',
  'whatsapp', 'telegrambot', 'skypeuripreview',
  'embedly', 'quora link preview', 'outbrain',
  'redditbot', 'pinterest', 'tumblr',
  // Domain / URL analysis
  'domaintools', 'builtwith', 'wappalyzer', 'whatcms',
  'webtech', 'iplookup', 'whois',
];

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="referrer" content="no-referrer">
<title>404 - Page Not Found</title>
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,sans-serif;background:#f5f5f5;color:#333;display:flex;align-items:center;justify-content:center;min-height:100vh}
.c{text-align:center;padding:40px}
h1{font-size:72px;margin:0;color:#ccc;font-weight:300}
p{font-size:18px;color:#999;margin:16px 0 0}
</style>
</head>
<body>
<div class="c">
<h1>404</h1>
<p>The page you are looking for does not exist.</p>
</div>
</body>
</html>`;

export default async (request, context) => {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();

  // Block requests with no user agent (automated tools)
  if (!ua) {
    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
      },
    });
  }

  // Block known bot/crawler/scanner user agents
  if (BLOCKED_BOTS.some((bot) => ua.includes(bot))) {
    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
      },
    });
  }

  // Block requests targeting well-known scanner paths
  const pathname = new URL(request.url).pathname.toLowerCase();
  const scannerPaths = [
    '/.env', '/.git', '/wp-login', '/wp-admin', '/xmlrpc.php',
    '/admin', '/administrator',
    '/phpmyadmin', '/config', '/.htaccess', '/debug',
    '/server-status', '/server-info', '/.svn', '/.hg',
  ];
  if (scannerPaths.some((p) => pathname.startsWith(p))) {
    return new Response(NOT_FOUND_HTML, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Referrer-Policy': 'no-referrer',
      },
    });
  }

  // For normal users — pass through and add security headers to the response
  const response = await context.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Permissions-Policy', 'interest-cohort=(), browsing-topics=(), geolocation=(), camera=(), microphone=()');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.delete('Server');
  response.headers.delete('X-Powered-By');
  return response;
};

export const config = {
  path: '/*',
  excludedPath: ['/api/*', '/.netlify/*'],
};
