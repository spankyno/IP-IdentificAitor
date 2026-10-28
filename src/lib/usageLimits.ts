import { UserRole, UsageQuota } from '../types/ipqs';

const STORAGE_KEY_USAGE = 'ip_identificaitor_usage';
const STORAGE_KEY_ROLE = 'ip_identificaitor_simulated_role';

export const ROLE_LIMITS: Record<UserRole, number> = {
  anonymous: 10,
  registered: 50,
  admin: Number.POSITIVE_INFINITY,
};

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Manages daily rate limits for anonymous/registered/admin accounts.
 * Architecture Note for Clerk:
 * When integrating Clerk:
 *   const { userId, sessionClaims } = auth();
 *   const role: UserRole = sessionClaims?.metadata?.role || (userId ? 'registered' : 'anonymous');
 * The backend API route will check tokens against a Redis / KV or DB counter.
 */
export function getSavedUsageQuota(): UsageQuota {
  const today = getTodayString();
  const currentRole = (localStorage.getItem(STORAGE_KEY_ROLE) as UserRole) || 'anonymous';
  const maxPerDay = ROLE_LIMITS[currentRole];

  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lastResetDate === today) {
        return {
          role: currentRole,
          usedToday: parsed.usedToday || 0,
          maxPerDay,
          lastResetDate: today,
        };
      }
    }
  } catch (e) {
    console.error('Error reading usage quota from localStorage:', e);
  }

  // New day or uninitialized
  const fresh: UsageQuota = {
    role: currentRole,
    usedToday: 0,
    maxPerDay,
    lastResetDate: today,
  };
  saveUsageQuota(fresh);
  return fresh;
}

export function saveUsageQuota(quota: UsageQuota): void {
  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(quota));
  } catch (e) {
    console.error('Error saving usage quota to localStorage:', e);
  }
}

export function setSimulatedRole(newRole: UserRole): UsageQuota {
  localStorage.setItem(STORAGE_KEY_ROLE, newRole);
  const current = getSavedUsageQuota();
  current.role = newRole;
  current.maxPerDay = ROLE_LIMITS[newRole];
  saveUsageQuota(current);
  return current;
}

export function incrementUsageCount(): { allowed: boolean; updatedQuota: UsageQuota } {
  const current = getSavedUsageQuota();
  if (current.usedToday >= current.maxPerDay) {
    return { allowed: false, updatedQuota: current };
  }
  current.usedToday += 1;
  saveUsageQuota(current);
  return { allowed: true, updatedQuota: current };
}

export function resetUsageCount(): UsageQuota {
  const current = getSavedUsageQuota();
  current.usedToday = 0;
  saveUsageQuota(current);
  return current;
}
