/**
 * Next.js 15 / Cloudflare Workers API Route: Check Email (LayerCall)
 * GET https://www.layercall.com/v1/verify/email
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json(
        { success: false, message: 'El parámetro "email" es obligatorio' },
        { status: 400 }
      );
    }

    const apiKey = searchParams.get('apiKey') || process.env.LAYERCALL_API_KEY || process.env.IPQS_API_KEY;

    if (apiKey) {
      const layercallUrl = `https://www.layercall.com/v1/verify/email?email=${encodeURIComponent(email)}`;
      const res = await fetch(layercallUrl, {
        headers: {
          Accept: 'application/json',
          'X-Api-Key': apiKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json({ ...data, email, is_sandbox: false });
      }
    }

    const lower = email.toLowerCase().trim();
    const domain = lower.split('@')[1] || 'example.com';
    const isDisposable = ['mailinator.com', 'guerrillamail.com', 'tempmail.com'].includes(domain);

    return Response.json({
      success: true,
      email: lower,
      risk_score: isDisposable ? 95 : 4,
      verdict: isDisposable ? 'block' : 'allow',
      signals: {
        syntax_valid: true,
        mx_found: true,
        is_disposable: isDisposable,
        is_role_account: false,
        is_free_provider: ['gmail.com', 'outlook.com', 'yahoo.com'].includes(domain),
        is_catch_all: false,
        domain_age_days: 1200,
        recent_abuse: isDisposable,
      },
      provider: {
        mx_host: `mx.${domain}`,
        name: isDisposable ? 'Disposable Provider' : domain,
      },
      processing_time_sec: 0.015,
      is_sandbox: true,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Error al validar email con LayerCall' },
      { status: 500 }
    );
  }
}
