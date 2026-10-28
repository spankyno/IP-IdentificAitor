import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Helper to determine active API key
function getApiKey(req: Request): string | undefined {
  const queryKey = req.query.apiKey as string | undefined;
  if (queryKey && queryKey.trim().length > 5) {
    return queryKey.trim();
  }
  const headerKey = req.headers['x-api-key'] as string | undefined;
  if (headerKey && headerKey.trim().length > 5) {
    return headerKey.trim();
  }
  return process.env.LAYERCALL_API_KEY || process.env.IPQS_API_KEY;
}

// Sandbox IP Generator
function getMockIPAnalysis(ip: string, strictness = 1) {
  const startTime = Date.now();
  const isTor = ip.startsWith('185.220.') || ip === '185.220.101.5';
  const isVpn = ip.startsWith('198.51.') || ip.startsWith('149.154.') || ip === '104.28.1.1';
  const isGoogle = ip === '8.8.8.8' || ip === '8.8.4.4';
  const isCloudflare = ip === '1.1.1.1' || ip === '1.0.0.1';

  let riskScore = 2;
  let isProxy = false;
  let isVpnFlag = false;
  let isTorFlag = false;
  let isBot = false;
  let isDatacenter = false;
  let recentAbuse = false;
  let country = 'ES';
  let region = 'Madrid';
  let city = 'Madrid';
  let isp = 'Telefonica de Espana';
  let asn = 'AS3352';
  let abuseReports = 0;

  if (isTor) {
    riskScore = Math.min(100, 92 + strictness * 2);
    isProxy = true;
    isTorFlag = true;
    isDatacenter = true;
    recentAbuse = true;
    abuseReports = 14;
    country = 'DE';
    region = 'Berlin';
    city = 'Berlin';
    isp = 'Tor Exit Relay Network';
    asn = 'AS60729';
  } else if (isVpn) {
    riskScore = Math.min(90, 68 + strictness * 4);
    isProxy = true;
    isVpnFlag = true;
    isDatacenter = true;
    recentAbuse = false;
    country = 'NL';
    region = 'North Holland';
    city = 'Amsterdam';
    isp = 'M247 Ltd';
    asn = 'AS9009';
  } else if (isCloudflare) {
    riskScore = 0;
    isDatacenter = true;
    country = 'AU';
    region = 'New South Wales';
    city = 'Sydney';
    isp = 'Cloudflare, Inc.';
    asn = 'AS13335';
  } else if (isGoogle) {
    riskScore = 0;
    isDatacenter = true;
    country = 'US';
    isp = 'Google LLC';
    asn = 'AS15169';
  } else {
    const sum = ip.split('.').reduce((acc, oct) => acc + (parseInt(oct, 10) || 0), 0);
    riskScore = (sum * 7) % 35;
    if (sum % 9 === 0) {
      riskScore = 80;
      isProxy = true;
      isBot = true;
      recentAbuse = true;
      abuseReports = 3;
    }
  }

  const verdict = riskScore < 30 ? 'allow' : riskScore < 75 ? 'review' : 'block';

  return {
    success: true,
    ip,
    risk_score: riskScore,
    verdict,
    signals: {
      is_vpn: isVpnFlag,
      is_proxy: isProxy,
      is_datacenter: isDatacenter,
      is_tor: isTorFlag,
      recent_abuse: recentAbuse,
      is_hijacked_netblock: false,
      is_crawler: isGoogle || isCloudflare,
      is_bot: isBot,
    },
    geo: {
      country,
      region,
      city,
      asn,
      isp,
      timezone: 'Europe/Madrid',
      latitude: 40.4168,
      longitude: -3.7038,
    },
    abuse_reports: abuseReports,
    processing_time_sec: Math.max(0.008, (Date.now() - startTime) / 1000 + 0.012),
    is_sandbox: true,
  };
}

// Sandbox Email Generator
function getMockEmailAnalysis(email: string) {
  const startTime = Date.now();
  const lower = email.toLowerCase().trim();
  const domain = lower.split('@')[1] || 'example.com';
  const user = lower.split('@')[0] || 'user';

  const isDisposable = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'sharklasers.com', '10minutemail.com', 'trashmail.com'].includes(domain);
  const isRoleAccount = ['info', 'contact', 'support', 'sales', 'admin', 'hello', 'billing'].includes(user);
  const isFreeProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain);
  const isHoneypot = lower.includes('spamtrap') || lower.includes('honeypot');

  let riskScore = 4;
  if (isDisposable) riskScore = 95;
  else if (isHoneypot) riskScore = 100;
  else if (lower.includes('test') && !isFreeProvider) riskScore = 48;

  const verdict = riskScore < 30 ? 'allow' : riskScore < 75 ? 'review' : 'block';

  return {
    success: true,
    email: lower,
    risk_score: riskScore,
    verdict,
    signals: {
      syntax_valid: true,
      mx_found: true,
      is_disposable: isDisposable,
      is_role_account: isRoleAccount,
      is_free_provider: isFreeProvider,
      is_catch_all: false,
      domain_age_days: isFreeProvider ? 9800 : isDisposable ? 450 : 1200,
      recent_abuse: isDisposable,
      is_honeypot: isHoneypot,
    },
    provider: {
      mx_host: isFreeProvider ? `mx.${domain}` : `${domain}`,
      name: isDisposable ? 'Disposable Provider' : domain,
    },
    processing_time_sec: Math.max(0.011, (Date.now() - startTime) / 1000 + 0.015),
    is_sandbox: true,
  };
}

// Sandbox Phone Generator
function getMockPhoneAnalysis(phone: string, country = 'ES') {
  const startTime = Date.now();
  const clean = phone.replace(/[\s\-\(\)\.]/g, '');
  const isVoip = clean.includes('555') || clean.startsWith('+1800') || clean.startsWith('900');
  const isSpam = clean.endsWith('666') || clean.endsWith('999');

  let riskScore = 5;
  if (isSpam) riskScore = 85;
  else if (isVoip) riskScore = 60;

  const verdict = riskScore < 30 ? 'allow' : riskScore < 75 ? 'review' : 'block';

  return {
    success: true,
    phone,
    risk_score: riskScore,
    verdict,
    number: {
      syntax_valid: clean.length >= 8,
      possible: true,
      allocated: true,
      line_type: isVoip ? 'voip' : 'mobile',
      country: country || 'ES',
      carrier: isVoip ? 'Twilio VOIP Communications' : 'Telefonica Moviles Espana',
      international_format: `+34 ${clean.slice(-9, -6)} ${clean.slice(-6, -3)} ${clean.slice(-3)}`,
      national_format: `${clean.slice(-9, -6)} ${clean.slice(-6, -3)} ${clean.slice(-3)}`,
    },
    signals: {
      is_voip: isVoip,
      is_disposable: isVoip,
      is_premium_rate: clean.startsWith('900') || clean.startsWith('800'),
      recent_abuse: isSpam,
      is_spammer: isSpam,
    },
    processing_time_sec: Math.max(0.012, (Date.now() - startTime) / 1000 + 0.014),
    is_sandbox: true,
  };
}

// Sandbox Domain Generator
function getMockDomainAnalysis(rawDomain: string) {
  const startTime = Date.now();
  const domain = rawDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const isDisposable = ['mailinator.com', 'sharklasers.com', 'guerrillamail.com', '10minutemail.com', 'trashmail.com'].includes(domain);
  const isTopDomain = ['google.com', 'apple.com', 'microsoft.com', 'github.com', 'cloudflare.com', 'amazon.com'].includes(domain);
  const isSuspicious = domain.endsWith('.xyz') || domain.includes('scam') || domain.includes('phish') || domain.includes('free-');

  let riskScore = 8;
  if (isDisposable) riskScore = 95;
  else if (isSuspicious) riskScore = 82;
  else if (isTopDomain) riskScore = 0;

  const verdict = riskScore < 30 ? 'allow' : riskScore < 75 ? 'review' : 'block';

  return {
    success: true,
    domain,
    risk_score: riskScore,
    verdict,
    signals: {
      domain_age_days: isTopDomain ? 10500 : isDisposable ? 450 : isSuspicious ? 12 : 3200,
      is_newly_registered: isSuspicious,
      is_disposable: isDisposable,
      mx_found: !isSuspicious,
      has_spf: isTopDomain || !isSuspicious,
      has_dmarc: isTopDomain,
      recent_abuse: isSuspicious || isDisposable,
    },
    registrar: {
      name: isTopDomain ? 'MarkMonitor Inc.' : isDisposable ? 'NameCheap, Inc.' : 'GoDaddy.com, LLC',
      created_at: isTopDomain ? '1997-09-15T00:00:00Z' : isSuspicious ? '2026-10-01T00:00:00Z' : '2016-04-12T00:00:00Z',
    },
    processing_time_sec: Math.max(0.014, (Date.now() - startTime) / 1000 + 0.018),
    is_sandbox: true,
  };
}

// ==========================================
// API Endpoints
// ==========================================

app.get('/api/config-status', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(
    (process.env.LAYERCALL_API_KEY && process.env.LAYERCALL_API_KEY.trim().length > 0) ||
    (process.env.IPQS_API_KEY && process.env.IPQS_API_KEY.trim().length > 0)
  );
  res.json({
    hasApiKey,
    isDev: process.env.NODE_ENV !== 'production',
  });
});

app.get('/api/detect-ip', (req: Request, res: Response) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else {
    ip = req.socket.remoteAddress || '127.0.0.1';
  }

  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    ip = '83.54.120.45';
  }

  res.json({ ip });
});

app.get('/api/check-ip', async (req: Request, res: Response) => {
  try {
    const rawIp = req.query.ip as string;
    if (!rawIp) {
      res.status(400).json({ success: false, message: 'Parámetro IP es requerido' });
      return;
    }
    const ip = rawIp.trim();
    const strictness = parseInt((req.query.strictness as string) || '1', 10);
    const apiKey = getApiKey(req);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/score/ip?ip=${encodeURIComponent(ip)}&strictness=${strictness}`;
        const response = await fetch(layercallUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            res.json({ ...data, ip, is_sandbox: false });
            return;
          }
        }
      } catch (apiErr) {
        console.error('Error contacting IP API:', apiErr);
      }
    }

    const mock = getMockIPAnalysis(ip, strictness);
    res.json(mock);
  } catch (error: any) {
    console.error('Check IP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
  }
});

app.get('/api/check-email', async (req: Request, res: Response) => {
  try {
    const rawEmail = req.query.email as string;
    if (!rawEmail) {
      res.status(400).json({ success: false, message: 'Parámetro Email es requerido' });
      return;
    }
    const email = rawEmail.trim();
    const apiKey = getApiKey(req);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/verify/email?email=${encodeURIComponent(email)}`;
        const response = await fetch(layercallUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            res.json({ ...data, email, is_sandbox: false });
            return;
          }
        }
      } catch (apiErr) {
        console.error('Error contacting Email API:', apiErr);
      }
    }

    const mock = getMockEmailAnalysis(email);
    res.json(mock);
  } catch (error: any) {
    console.error('Check Email error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
  }
});

app.get('/api/check-phone', async (req: Request, res: Response) => {
  try {
    const rawPhone = req.query.phone as string;
    if (!rawPhone) {
      res.status(400).json({ success: false, message: 'Parámetro Phone es requerido' });
      return;
    }
    const phone = rawPhone.trim();
    const country = (req.query.country as string) || 'ES';
    const apiKey = getApiKey(req);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/lookup/phone?phone=${encodeURIComponent(phone)}`;
        const response = await fetch(layercallUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            res.json({ ...data, phone, is_sandbox: false });
            return;
          }
        }
      } catch (apiErr) {
        console.error('Error contacting Phone API:', apiErr);
      }
    }

    const mock = getMockPhoneAnalysis(phone, country);
    res.json(mock);
  } catch (error: any) {
    console.error('Check Phone error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
  }
});

app.get('/api/check-domain', async (req: Request, res: Response) => {
  try {
    const rawDomain = req.query.domain as string;
    if (!rawDomain) {
      res.status(400).json({ success: false, message: 'Parámetro Domain es requerido' });
      return;
    }
    const domain = rawDomain.trim();
    const apiKey = getApiKey(req);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/score/domain?domain=${encodeURIComponent(domain)}`;
        const response = await fetch(layercallUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Api-Key': apiKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            res.json({ ...data, domain, is_sandbox: false });
            return;
          }
        }
      } catch (apiErr) {
        console.error('Error contacting Domain API:', apiErr);
      }
    }

    const mock = getMockDomainAnalysis(domain);
    res.json(mock);
  } catch (error: any) {
    console.error('Check Domain error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
  }
});

// Start server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IP IdentificAitor server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
