export type AnalysisType = 'ip' | 'email' | 'phone' | 'domain' | 'device';

export type UserRole = 'anonymous' | 'registered' | 'admin';

export type LayerCallVerdict = 'allow' | 'review' | 'block';

export interface UsageQuota {
  role: UserRole;
  usedToday: number;
  maxPerDay: number;
  lastResetDate: string;
}

export interface LayerCallIPResult {
  success?: boolean;
  message?: string;
  ip: string;
  risk_score: number;
  verdict: LayerCallVerdict;
  signals: {
    is_vpn: boolean;
    is_proxy: boolean;
    is_datacenter: boolean;
    is_tor: boolean;
    recent_abuse: boolean;
    is_hijacked_netblock?: boolean;
    is_crawler?: boolean;
    is_bot?: boolean;
  };
  geo: {
    country: string;
    city?: string;
    region?: string;
    asn: string | number;
    isp: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  abuse_reports?: number;
  processing_time_sec?: number;
  is_sandbox?: boolean;
}

export interface LayerCallEmailResult {
  success?: boolean;
  message?: string;
  email: string;
  risk_score: number;
  verdict: LayerCallVerdict;
  signals: {
    syntax_valid: boolean;
    mx_found: boolean;
    is_disposable: boolean;
    is_role_account: boolean;
    is_free_provider: boolean;
    is_catch_all: boolean;
    domain_age_days?: number;
    recent_abuse?: boolean;
    is_honeypot?: boolean;
  };
  provider?: {
    mx_host: string;
    name: string;
  };
  processing_time_sec?: number;
  is_sandbox?: boolean;
}

export interface LayerCallPhoneResult {
  success?: boolean;
  message?: string;
  phone: string;
  risk_score: number;
  verdict: LayerCallVerdict;
  number: {
    syntax_valid: boolean;
    possible: boolean;
    allocated: boolean;
    line_type: 'mobile' | 'fixed_line' | 'voip' | 'premium_rate' | 'toll_free' | 'unknown' | string;
    country: string;
    carrier: string;
    international_format: string;
    national_format: string;
  };
  signals: {
    is_voip: boolean;
    is_disposable: boolean;
    is_premium_rate: boolean;
    recent_abuse: boolean;
    is_spammer?: boolean;
  };
  processing_time_sec?: number;
  is_sandbox?: boolean;
}

export interface LayerCallDomainResult {
  success?: boolean;
  message?: string;
  domain: string;
  risk_score: number;
  verdict: LayerCallVerdict;
  signals: {
    domain_age_days?: number;
    is_newly_registered: boolean;
    is_disposable: boolean;
    mx_found: boolean;
    has_spf: boolean;
    has_dmarc: boolean;
    recent_abuse?: boolean;
  };
  registrar?: {
    name: string;
    created_at?: string;
  };
  processing_time_sec?: number;
  is_sandbox?: boolean;
}

export interface DeviceFingerprint {
  visitorId: string;
  timestamp: number;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  browser: {
    userAgent: string;
    language: string;
    languages: readonly string[];
    cookiesEnabled: boolean;
    platform: string;
    vendor: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
  };
  graphics: {
    webglVendor: string;
    webglRenderer: string;
    canvasHash: string;
  };
  timing: {
    timezone: string;
    timezoneOffset: number;
  };
  automation: {
    webdriver: boolean;
    hasAutomationHeadless: boolean;
    riskScore: number;
    verdict: LayerCallVerdict;
    riskFlags: string[];
  };
}

export interface QueryHistoryItem {
  id: string;
  type: AnalysisType;
  target: string;
  timestamp: number;
  riskScore: number;
  verdict: LayerCallVerdict;
  summary: string;
  tags: string[];
  fullResult:
    | LayerCallIPResult
    | LayerCallEmailResult
    | LayerCallPhoneResult
    | LayerCallDomainResult
    | DeviceFingerprint;
}
