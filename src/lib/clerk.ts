/**
 * Clerk helpers.
 * Publishable key is embedded at build time via Vite (see vite.config.ts).
 * Without it, auth UI stays in demo mode (role simulator).
 */

export const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || '';

/** True when Clerk is configured and the app should show sign-in / sign-up. */
export const isClerkEnabled = CLERK_PUBLISHABLE_KEY.length > 0 && CLERK_PUBLISHABLE_KEY.startsWith('pk_');

// One-time console hint (production debugging)
if (typeof window !== 'undefined') {
  if (isClerkEnabled) {
    console.info('[Clerk] Auth enabled');
  } else {
    console.warn(
      '[Clerk] Desactivado: falta VITE_CLERK_PUBLISHABLE_KEY en el build. ' +
        'En Cloudflare Pages → Settings → Environment variables, añade ' +
        'VITE_CLERK_PUBLISHABLE_KEY=pk_test_… y vuelve a desplegar (Retry deployment).'
    );
  }
}

/**
 * Resolve app role from a Clerk user object (or null if signed out).
 */
export function roleFromClerkUser(user: {
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined): 'anonymous' | 'registered' | 'admin' {
  if (!user) return 'anonymous';
  const meta = user.publicMetadata?.role;
  if (meta === 'admin') return 'admin';
  return 'registered';
}
