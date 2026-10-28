/** Sandbox mocks for Cloudflare Pages Functions */

export function getMockIPAnalysis(ip, strictness = 1) {
  const startTime = Date.now();
  const isTor = ip.startsWith("185.220.") || ip === "185.220.101.5";
  const isVpn = ip.startsWith("198.51.") || ip.startsWith("149.154.") || ip === "104.28.1.1";
  const isGoogle = ip === "8.8.8.8" || ip === "8.8.4.4";
  const isCloudflare = ip === "1.1.1.1" || ip === "1.0.0.1";

  let riskScore = 2;
  let isProxy = false;
  let isVpnFlag = false;
  let isTorFlag = false;
  let isBot = false;
  let isDatacenter = false;
  let recentAbuse = false;
  let country = "ES";
  let region = "Madrid";
  let city = "Madrid";
  let isp = "Telefonica de Espana";
  let asn = "AS3352";
  let abuseReports = 0;

  if (isTor) {
    riskScore = Math.min(100, 92 + strictness * 2);
    isProxy = true;
    isTorFlag = true;
    isDatacenter = true;
    recentAbuse = true;
    abuseReports = 14;
    country = "DE";
    region = "Berlin";
    city = "Berlin";
    isp = "Tor Exit Relay Network";
    asn = "AS60729";
  } else if (isVpn) {
    riskScore = Math.min(90, 68 + strictness * 4);
    isProxy = true;
    isVpnFlag = true;
    isDatacenter = true;
    country = "NL";
    region = "North Holland";
    city = "Amsterdam";
    isp = "M247 Ltd";
    asn = "AS9009";
  } else if (isCloudflare) {
    riskScore = 0;
    isDatacenter = true;
    country = "AU";
    region = "New South Wales";
    city = "Sydney";
    isp = "Cloudflare, Inc.";
    asn = "AS13335";
  } else if (isGoogle) {
    riskScore = 0;
    isDatacenter = true;
    country = "US";
    isp = "Google LLC";
    asn = "AS15169";
  } else {
    const sum = ip.split(".").reduce((acc, oct) => acc + (parseInt(oct, 10) || 0), 0);
    riskScore = (sum * 7) % 35;
    if (sum % 9 === 0) {
      riskScore = 80;
      isProxy = true;
      isBot = true;
      recentAbuse = true;
      abuseReports = 3;
    }
  }

  const verdict = riskScore < 30 ? "allow" : riskScore < 75 ? "review" : "block";

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
      timezone: "Europe/Madrid",
      latitude: 40.4168,
      longitude: -3.7038,
    },
    abuse_reports: abuseReports,
    processing_time_sec: Math.max(0.008, (Date.now() - startTime) / 1000 + 0.012),
    is_sandbox: true,
  };
}

export function getMockEmailAnalysis(email) {
  const startTime = Date.now();
  const lower = email.toLowerCase().trim();
  const domain = lower.split("@")[1] || "example.com";
  const user = lower.split("@")[0] || "user";
  const isDisposable = [
    "mailinator.com",
    "guerrillamail.com",
    "tempmail.com",
    "sharklasers.com",
    "10minutemail.com",
    "trashmail.com",
  ].includes(domain);
  const isRoleAccount = ["info", "contact", "support", "sales", "admin", "hello", "billing"].includes(user);
  const isFreeProvider = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(domain);
  const isHoneypot = lower.includes("spamtrap") || lower.includes("honeypot");

  let riskScore = 4;
  if (isDisposable) riskScore = 95;
  else if (isHoneypot) riskScore = 100;
  else if (lower.includes("test") && !isFreeProvider) riskScore = 48;

  const verdict = riskScore < 30 ? "allow" : riskScore < 75 ? "review" : "block";

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
      mx_host: isFreeProvider ? `mx.${domain}` : domain,
      name: isDisposable ? "Disposable Provider" : domain,
    },
    processing_time_sec: Math.max(0.011, (Date.now() - startTime) / 1000 + 0.015),
    is_sandbox: true,
  };
}

export function getMockPhoneAnalysis(phone, country = "ES") {
  const startTime = Date.now();
  const clean = phone.replace(/[\s\-\(\)\.]/g, "");
  const isVoip = clean.includes("555") || clean.startsWith("+1800") || clean.startsWith("900");
  const isSpam = clean.endsWith("666") || clean.endsWith("999");

  let riskScore = 5;
  if (isSpam) riskScore = 85;
  else if (isVoip) riskScore = 60;

  const verdict = riskScore < 30 ? "allow" : riskScore < 75 ? "review" : "block";

  return {
    success: true,
    phone,
    risk_score: riskScore,
    verdict,
    number: {
      syntax_valid: clean.length >= 8,
      possible: true,
      allocated: true,
      line_type: isVoip ? "voip" : "mobile",
      country: country || "ES",
      carrier: isVoip ? "Twilio VOIP Communications" : "Telefonica Moviles Espana",
      international_format: `+34 ${clean.slice(-9, -6)} ${clean.slice(-6, -3)} ${clean.slice(-3)}`,
      national_format: `${clean.slice(-9, -6)} ${clean.slice(-6, -3)} ${clean.slice(-3)}`,
    },
    signals: {
      is_voip: isVoip,
      is_disposable: isVoip,
      is_premium_rate: clean.startsWith("900") || clean.startsWith("800"),
      recent_abuse: isSpam,
      is_spammer: isSpam,
    },
    processing_time_sec: Math.max(0.012, (Date.now() - startTime) / 1000 + 0.014),
    is_sandbox: true,
  };
}

export function getMockDomainAnalysis(rawDomain) {
  const startTime = Date.now();
  const domain = rawDomain
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0];
  const isDisposable = [
    "mailinator.com",
    "sharklasers.com",
    "guerrillamail.com",
    "10minutemail.com",
    "trashmail.com",
  ].includes(domain);
  const isTopDomain = [
    "google.com",
    "apple.com",
    "microsoft.com",
    "github.com",
    "cloudflare.com",
    "amazon.com",
  ].includes(domain);
  const isSuspicious =
    domain.endsWith(".xyz") ||
    domain.includes("scam") ||
    domain.includes("phish") ||
    domain.includes("free-");

  let riskScore = 8;
  if (isDisposable) riskScore = 95;
  else if (isSuspicious) riskScore = 82;
  else if (isTopDomain) riskScore = 0;

  const verdict = riskScore < 30 ? "allow" : riskScore < 75 ? "review" : "block";

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
      name: isTopDomain ? "MarkMonitor Inc." : isDisposable ? "Namecheap" : "GoDaddy",
      created_at: isSuspicious ? "2025-09-01" : "2015-03-12",
    },
    processing_time_sec: Math.max(0.01, (Date.now() - startTime) / 1000 + 0.013),
    is_sandbox: true,
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
