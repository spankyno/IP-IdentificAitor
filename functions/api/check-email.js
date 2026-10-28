import { getMockEmailAnalysis } from "../_mocks.js";
import {
  json,
  handleOptions,
  enforceRateLimit,
  requireParam,
  resolveApiKey,
  MAX_LEN,
} from "../_security.js";

export async function onRequestOptions(context) {
  return handleOptions(context.request);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const limited = await enforceRateLimit(request);
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = requireParam(url.searchParams.get("email"), MAX_LEN.email, "Email");
    if (!parsed.ok) return json({ success: false, message: parsed.message }, 400, request);

    const apiKey = resolveApiKey(request, env);

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/verify/email?email=${encodeURIComponent(parsed.value)}`;
        const response = await fetch(layercallUrl, {
          headers: { Accept: "application/json", "X-Api-Key": apiKey },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            return json({ ...data, email: parsed.value, is_sandbox: false }, 200, request);
          }
        }
      } catch (_) {
        /* sandbox */
      }
    }

    return json(getMockEmailAnalysis(parsed.value), 200, request);
  } catch (error) {
    return json({ success: false, message: error.message || "Error interno" }, 500, request);
  }
}
