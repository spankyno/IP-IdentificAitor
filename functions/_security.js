/**
 * Shared security helpers for Cloudflare Pages Functions.
 * - CORS allowlist
 * - Rate limit por IP (Cache API)
 * - Validación de longitud de parámetros
 * - Respuestas JSON uniformes
 */

const ALLOWED_ORIGINS = [
  'https://ip-identificaitor.pages.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/** Límites de longitud (caracteres) */
export const MAX_LEN = {
  ip: 45,
  email: 254,
  phone: 32,
  domain: 253,
  apiKey: 200,
  country: 8,
};

/**
 * @param {Request} request
 * @returns {Record<string, string>}
 */
export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Api-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/**
 * @param {unknown} data
 * @param {number} status
 * @param {Request} [request]
 */
export function json(data, status = 200, request) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(request ? corsHeaders(request) : { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0] }),
  };
  return new Response(JSON.stringify(data), { status, headers });
}

/** Preflight CORS */
export function handleOptions(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Rate limit por IP usando Cache API de Cloudflare (sin KV obligatorio).
 * @param {Request} request
 * @param {{ limit?: number, windowSec?: number }} [opts]
 * @returns {Promise<Response|null>} Response 429 o null si permitido
 */
export async function enforceRateLimit(request, opts = {}) {
  const limit = opts.limit ?? 40;
  const windowSec = opts.windowSec ?? 60;

  const ip =
    request.headers.get('cf-connecting-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';

  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const cacheKey = new Request(
    `https://ipqa-ratelimit.internal/${encodeURIComponent(ip)}/${bucket}`
  );

  try {
    const cache = caches.default;
    let count = 0;
    const existing = await cache.match(cacheKey);
    if (existing) {
      count = parseInt(await existing.text(), 10) || 0;
    }

    if (count >= limit) {
      return json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.',
          retry_after_sec: windowSec,
        },
        429,
        request
      );
    }

    await cache.put(
      cacheKey,
      new Response(String(count + 1), {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': `public, max-age=${windowSec}`,
        },
      })
    );
  } catch {
    // Si Cache API falla, no bloquear el servicio
  }

  return null;
}

/**
 * @param {string|null} value
 * @param {number} max
 * @param {string} name
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function requireParam(value, max, name) {
  if (value == null || !String(value).trim()) {
    return { ok: false, message: `Parámetro ${name} es requerido` };
  }
  const v = String(value).trim();
  if (v.length > max) {
    return {
      ok: false,
      message: `Parámetro ${name} demasiado largo (máx. ${max} caracteres)`,
    };
  }
  return { ok: true, value: v };
}

/**
 * API key solo desde cabecera o env (nunca se recomienda query).
 * Query se acepta de forma degradada pero se ignora si es demasiado larga.
 * @param {Request} request
 * @param {{ LAYERCALL_API_KEY?: string, IPQS_API_KEY?: string }} env
 */
export function resolveApiKey(request, env) {
  const headerKey = request.headers.get('x-api-key');
  if (headerKey && headerKey.trim().length > 5 && headerKey.trim().length <= MAX_LEN.apiKey) {
    return headerKey.trim();
  }
  // Legacy query (deprecated) — still capped
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('apiKey');
    if (q && q.trim().length > 5 && q.trim().length <= MAX_LEN.apiKey) {
      return q.trim();
    }
  } catch {
    /* ignore */
  }
  if (env.LAYERCALL_API_KEY && env.LAYERCALL_API_KEY.trim()) return env.LAYERCALL_API_KEY.trim();
  if (env.IPQS_API_KEY && env.IPQS_API_KEY.trim()) return env.IPQS_API_KEY.trim();
  return undefined;
}
