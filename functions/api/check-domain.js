import { getMockDomainAnalysis, json } from "../_mocks.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const domain = url.searchParams.get("domain");
    if (!domain) {
      return json({ success: false, message: "Parámetro Domain es requerido" }, 400);
    }

    const apiKey =
      url.searchParams.get("apiKey") ||
      context.request.headers.get("x-api-key") ||
      context.env.LAYERCALL_API_KEY ||
      context.env.IPQS_API_KEY;

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/score/domain?domain=${encodeURIComponent(domain)}`;
        const response = await fetch(layercallUrl, {
          headers: { Accept: "application/json", "X-Api-Key": apiKey },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            return json({ ...data, domain, is_sandbox: false });
          }
        }
      } catch (_) {
        /* sandbox */
      }
    }

    return json(getMockDomainAnalysis(domain.trim()));
  } catch (error) {
    return json({ success: false, message: error.message || "Error interno" }, 500);
  }
}
