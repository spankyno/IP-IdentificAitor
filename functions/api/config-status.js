import { json, handleOptions, enforceRateLimit } from "../_security.js";

export async function onRequestOptions(context) {
  return handleOptions(context.request);
}

export async function onRequestGet(context) {
  const limited = await enforceRateLimit(context.request, { limit: 60, windowSec: 60 });
  if (limited) return limited;

  const hasApiKey = Boolean(
    (context.env.LAYERCALL_API_KEY && context.env.LAYERCALL_API_KEY.trim().length > 0) ||
      (context.env.IPQS_API_KEY && context.env.IPQS_API_KEY.trim().length > 0)
  );
  return json({ hasApiKey, isDev: false }, 200, context.request);
}
