/**
 * Next.js 15 / Cloudflare Workers API Route: Check Phone (LayerCall)
 * GET https://www.layercall.com/v1/lookup/phone
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return Response.json(
        { success: false, message: 'El parámetro "phone" es obligatorio' },
        { status: 400 }
      );
    }

    const apiKey = searchParams.get('apiKey') || process.env.LAYERCALL_API_KEY || process.env.IPQS_API_KEY;

    if (apiKey) {
      const layercallUrl = `https://www.layercall.com/v1/lookup/phone?phone=${encodeURIComponent(phone)}`;
      const res = await fetch(layercallUrl, {
        headers: {
          Accept: 'application/json',
          'X-Api-Key': apiKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json({ ...data, phone, is_sandbox: false });
      }
    }

    const clean = phone.replace(/[\s\-\(\)\.]/g, '');
    const isVoip = clean.includes('555') || clean.startsWith('+1800') || clean.startsWith('900');

    return Response.json({
      success: true,
      phone,
      risk_score: isVoip ? 60 : 4,
      verdict: isVoip ? 'review' : 'allow',
      number: {
        syntax_valid: clean.length >= 8,
        possible: true,
        allocated: true,
        line_type: isVoip ? 'voip' : 'mobile',
        country: 'ES',
        carrier: isVoip ? 'Twilio VOIP' : 'Telefónica Móviles España',
        international_format: phone,
        national_format: clean,
      },
      signals: {
        is_voip: isVoip,
        is_disposable: isVoip,
        is_premium_rate: false,
        recent_abuse: false,
      },
      processing_time_sec: 0.012,
      is_sandbox: true,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Error al validar teléfono con LayerCall' },
      { status: 500 }
    );
  }
}
