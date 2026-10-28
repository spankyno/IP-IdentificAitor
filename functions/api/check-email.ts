import { getMockEmailAnalysis, json } from '../_mocks';

interface Env {
  LAYERCALL_API_KEY?: string;
  IPQS_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const email = url.searchParams.get('email');
    if (!email) {
      return json({ success: false, message: 'Parámetro Email es requerido' }, 400);
    }

    const apiKey =
      url.searchParams.get('apiKey') ||
      context.request.headers.get('x-api-key') ||
      context.env.LAYERCALL_API_KEY ||
      context.env.IPQS_API_KEY;

    if (apiKey) {
      try {
        const layercallUrl = `https://www.layercall.com/v1/verify/email?email=${encodeURIComponent(email)}`;
        const response = await fetch(layercallUrl, {
          headers: { Accept: 'application/json', 'X-Api-Key': apiKey },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && ((data as any).risk_score !== undefined || (data as any).verdict)) {
            return json({ ...data, email, is_sandbox: false });
          }
        }
      } catch {
        // fall through
      }
    }

    return json(getMockEmailAnalysis(email.trim()));
  } catch (error: any) {
    return json({ success: false, message: error.message || 'Error interno' }, 500);
  }
};
