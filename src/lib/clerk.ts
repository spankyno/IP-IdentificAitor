/**
 * Clerk helpers — safe to import from any component.
 * If VITE_CLERK_PUBLISHABLE_KEY is missing, auth UI is disabled (demo mode).
 */

export const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || '';

/** True when Clerk is configured and the app should show sign-in / sign-up. */
export const isClerkEnabled = CLERK_PUBLISHABLE_KEY.length > 0;

/**
 * Resolve app role from a Clerk user object (or null if signed out).
 * - signed out → anonymous
 * - signed in → registered
 * - publicMetadata.role === 'admin' → admin
 */
export function roleFromClerkUser(user: {
  publicMetadata?: Record<string, unknown> | null;
} | null | undefined): 'anonymous' | 'registered' | 'admin' {
  if (!user) return 'anonymous';
  const meta = user.publicMetadata?.role;
  if (meta === 'admin') return 'admin';
  return 'registered';
}
