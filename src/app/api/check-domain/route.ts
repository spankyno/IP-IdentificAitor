/**
 * Next.js 15 / Cloudflare Workers API Route: Check Domain
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return Response.json(
        { success: false, message: 'El parámetro "domain" es obligatorio' },
        { status: 400 }
      );
    }

    const apiKey = searchParams.get('apiKey') || process.env.LAYERCALL_API_KEY || process.env.IPQS_API_KEY;

    if (apiKey) {
      const layercallUrl = `https://www.layercall.com/v1/score/domain?domain=${encodeURIComponent(domain)}`;
      const res = await fetch(layercallUrl, {
        headers: {
          Accept: 'application/json',
          'X-Api-Key': apiKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json({ ...data, domain, is_sandbox: false });
      }
    }

    const clean = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const isDisposable = ['mailinator.com', 'sharklasers.com', 'tempmail.com'].includes(clean);

    return Response.json({
      success: true,
      domain: clean,
      risk_score: isDisposable ? 95 : 10,
      verdict: isDisposable ? 'block' : 'allow',
      signals: {
        domain_age_days: isDisposable ? 450 : 3400,
        is_newly_registered: false,
        is_disposable: isDisposable,
        mx_found: true,
        has_spf: true,
        has_dmarc: true,
        recent_abuse: isDisposable,
      },
      registrar: {
        name: isDisposable ? 'NameCheap, Inc.' : 'MarkMonitor Inc.',
        created_at: '2016-04-12T00:00:00Z',
      },
      processing_time_sec: 0.02,
      is_sandbox: true,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Error al analizar el dominio' },
      { status: 500 }
    );
  }
}
