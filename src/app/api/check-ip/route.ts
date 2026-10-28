/**
 * Next.js 15 / Cloudflare Workers API Route: Check IP Intelligence (LayerCall)
 * GET https://www.layercall.com/v1/score/ip
 */

export const runtime = 'edge';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return Response.json(
        { success: false, message: 'El parámetro "ip" es obligatorio' },
        { status: 400 }
      );
    }

    const apiKey = searchParams.get('apiKey') || process.env.LAYERCALL_API_KEY || process.env.IPQS_API_KEY;
    const strictness = parseInt(searchParams.get('strictness') || '1', 10);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/score/ip?ip=${encodeURIComponent(ip)}&strictness=${strictness}`;
        const res = await fetch(layercallUrl, {
          headers: {
            Accept: 'application/json',
            'X-Api-Key': apiKey,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            return Response.json({ ...data, ip, is_sandbox: false });
          }
        }
      } catch {
        // fall through to sandbox
      }
    }

    return Response.json(getMockIPAnalysis(ip.trim(), strictness));
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Error al consultar IP con LayerCall' },
      { status: 500 }
    );
  }
}
