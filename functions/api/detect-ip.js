import { json, handleOptions, enforceRateLimit } from "../_security.js";

export async function onRequestOptions(context) {
  return handleOptions(context.request);
}

export async function onRequestGet(context) {
  const limited = await enforceRateLimit(context.request, { limit: 60, windowSec: 60 });
  if (limited) return limited;

  const req = context.request;
  const forwarded =
    req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for");
  let ip = "";
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  }
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    ip = "83.54.120.45";
  }
  // No devolver cabeceras internas extra
  return json({ ip }, 200, req);
}
