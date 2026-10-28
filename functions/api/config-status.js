import { json } from "../_mocks.js";

export async function onRequestGet(context) {
  const hasApiKey = Boolean(
    (context.env.LAYERCALL_API_KEY && context.env.LAYERCALL_API_KEY.trim().length > 0) ||
      (context.env.IPQS_API_KEY && context.env.IPQS_API_KEY.trim().length > 0)
  );
  return json({ hasApiKey, isDev: false });
}
