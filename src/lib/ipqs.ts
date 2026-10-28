import {
  LayerCallIPResult,
  LayerCallEmailResult,
  LayerCallPhoneResult,
  LayerCallDomainResult,
} from '../types/ipqs';

export interface CheckOptions {
  strictness?: number;
  userApiKey?: string;
}

export function isValidIP(ip: string): boolean {
  const trimmed = ip.trim();
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed);
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  return /^\+?[0-9]{7,16}$/.test(trimmed);
}

export function isValidDomain(domain: string): boolean {
  const clean = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return domainRegex.test(clean);
}

export async function detectCurrentIP(): Promise<string> {
  try {
    const res = await fetch('/api/detect-ip');
    if (res.ok) {
      const data = await res.json();
      if (data.ip) return data.ip;
    }
  } catch (err) {
    console.warn('Backend detect-ip fallback:', err);
  }

  try {
    const fallbackRes = await fetch('https://api.ipify.org?format=json');
    const fallbackData = await fallbackRes.json();
    return fallbackData.ip || '8.8.8.8';
  } catch {
    return '1.1.1.1';
  }
}

export async function checkConfigStatus(): Promise<{ hasApiKey: boolean; isDev: boolean }> {
  try {
    const res = await fetch('/api/config-status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error checking config status:', err);
  }
  return { hasApiKey: false, isDev: true };
}

export async function analyzeIP(ip: string, options: CheckOptions = {}): Promise<LayerCallIPResult> {
  const query = new URLSearchParams();
  query.set('ip', ip.trim());
  if (options.strictness !== undefined) query.set('strictness', String(options.strictness));
  if (options.userApiKey) query.set('apiKey', options.userApiKey);

  const res = await fetch(`/api/check-ip?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error de conexión' }));
    throw new Error(errorData.message || `Error del servidor HTTP ${res.status}`);
  }

  return await res.json();
}

export async function analyzeEmail(email: string, options: CheckOptions = {}): Promise<LayerCallEmailResult> {
  const query = new URLSearchParams();
  query.set('email', email.trim());
  if (options.userApiKey) query.set('apiKey', options.userApiKey);

  const res = await fetch(`/api/check-email?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error al verificar email' }));
    throw new Error(errorData.message || `Error del servidor HTTP ${res.status}`);
  }

  return await res.json();
}

export async function analyzePhone(phone: string, country?: string, options: CheckOptions = {}): Promise<LayerCallPhoneResult> {
  const query = new URLSearchParams();
  query.set('phone', phone.trim());
  if (country) query.set('country', country);
  if (options.strictness !== undefined) query.set('strictness', String(options.strictness));
  if (options.userApiKey) query.set('apiKey', options.userApiKey);

  const res = await fetch(`/api/check-phone?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error al verificar número de teléfono' }));
    throw new Error(errorData.message || `Error del servidor HTTP ${res.status}`);
  }

  return await res.json();
}

export async function analyzeDomain(domain: string, options: CheckOptions = {}): Promise<LayerCallDomainResult> {
  const query = new URLSearchParams();
  const clean = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  query.set('domain', clean);
  if (options.userApiKey) query.set('apiKey', options.userApiKey);

  const res = await fetch(`/api/check-domain?${query.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Error al verificar dominio' }));
    throw new Error(errorData.message || `Error del servidor HTTP ${res.status}`);
  }

  return await res.json();
}
