import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

const STORAGE_KEY = 'ip_identificaitor_privacy_notice_dismissed';

/**
 * Aviso estándar de privacidad del tracker de analíticas.
 * No bloquea el uso del sitio; es informativo y se puede cerrar.
 */
export const PrivacyNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de privacidad"
      className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white/95 dark:bg-[#12151e]/95 backdrop-blur-xl shadow-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex gap-3 items-start">
        <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Privacidad y analíticas
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Este sitio usa analíticas para medir el tráfico de forma anónima, y registra datos de
            acceso con fines de seguridad. No se usan cookies de publicidad.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Cerrar aviso de privacidad"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
