import { LayerCallVerdict } from '../types/ipqs';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Maps a LayerCall risk score (0 - 100) and verdict ('allow' | 'review' | 'block')
 * to clear visual representations and semantic classifications:
 * allow: 0 - 29 (Seguro / Permitir)
 * review: 30 - 74 (Riesgo Moderado / Revisar)
 * block: 75 - 100 (Alto Riesgo / Bloquear)
 */
export function getRiskLevel(
  score: number,
  explicitVerdict?: LayerCallVerdict
): {
  level: 'safe' | 'suspicious' | 'danger';
  verdict: LayerCallVerdict;
  verdictLabel: string;
  label: string;
  badgeBg: string;
  textColor: string;
  barColor: string;
  borderColor: string;
  glowColor: string;
} {
  const verdict: LayerCallVerdict =
    explicitVerdict || (score < 30 ? 'allow' : score < 75 ? 'review' : 'block');

  if (verdict === 'allow') {
    return {
      level: 'safe',
      verdict: 'allow',
      verdictLabel: 'ALLOW (Permitir)',
      label: 'Riesgo Bajo / Tráfico Limpio',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
      borderColor: 'border-emerald-200 dark:border-emerald-500/30',
      glowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    };
  }

  if (verdict === 'review') {
    return {
      level: 'suspicious',
      verdict: 'review',
      verdictLabel: 'REVIEW (Revisar)',
      label: 'Riesgo Moderado / Anomalías',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500',
      borderColor: 'border-amber-200 dark:border-amber-500/30',
      glowColor: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    };
  }

  return {
    level: 'danger',
    verdict: 'block',
    verdictLabel: 'BLOCK (Bloquear)',
    label: 'Alto Riesgo / Amenaza Detectada',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20',
    textColor: 'text-rose-600 dark:text-rose-400',
    barColor: 'bg-rose-500',
    borderColor: 'border-rose-200 dark:border-rose-500/30',
    glowColor: 'shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  };
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(timestamp));
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

export function exportToJson(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToCsv(items: Array<Record<string, unknown>>, filename: string) {
  if (!items.length) return;
  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((header) => {
        const val = item[header];
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
