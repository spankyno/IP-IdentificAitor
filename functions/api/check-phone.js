import { getMockPhoneAnalysis, json } from "../_mocks.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const phone = url.searchParams.get("phone");
    if (!phone) {
      return json({ success: false, message: "Parámetro Phone es requerido" }, 400);
    }

    const country = url.searchParams.get("country") || "ES";
    const apiKey =
      url.searchParams.get("apiKey") ||
      context.request.headers.get("x-api-key") ||
      context.env.LAYERCALL_API_KEY ||
      context.env.IPQS_API_KEY;

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/lookup/phone?phone=${encodeURIComponent(phone)}`;
        const response = await fetch(layercallUrl, {
          headers: { Accept: "application/json", "X-Api-Key": apiKey },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && (data.risk_score !== undefined || data.verdict)) {
            return json({ ...data, phone, is_sandbox: false });
          }
        }
      } catch (_) {
        /* sandbox */
      }
    }

    return json(getMockPhoneAnalysis(phone.trim(), country));
  } catch (error) {
    return json({ success: false, message: error.message || "Error interno" }, 500);
  }
}
