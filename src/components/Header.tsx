import React, { useState } from 'react';
import {
  Shield,
  Moon,
  Sun,
  History,
  Key,
  User,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { UserRole, UsageQuota } from '../types/ipqs';

interface HeaderProps {
  currentTab: 'dashboard' | 'about';
  setCurrentTab: (tab: 'dashboard' | 'about') => void;
  quota: UsageQuota;
  onRoleChange: (role: UserRole) => void;
  onOpenHistory: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  hasApiKey: boolean;
  customApiKey: string;
  setCustomApiKey: (key: string) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  anonymous: 'Anónimo',
  registered: 'Registrado',
  admin: 'Admin',
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  quota,
  onRoleChange,
  onOpenHistory,
  isDark,
  toggleTheme,
  hasApiKey,
  customApiKey,
  setCustomApiKey,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);

  const remaining =
    quota.maxPerDay === Number.POSITIVE_INFINITY
      ? '∞'
      : Math.max(0, quota.maxPerDay - quota.usedToday);

  const isNearLimit =
    quota.maxPerDay !== Number.POSITIVE_INFINITY &&
    quota.usedToday >= quota.maxPerDay * 0.8;

  const handleSaveApiKey = () => {
    setCustomApiKey(tempApiKey.trim());
    setShowApiKeyInput(false);
  };

  const handleClearApiKey = () => {
    setTempApiKey('');
    setCustomApiKey('');
    setShowApiKeyInput(false);
  };

  return (
    <header className="w-full border-b border-slate-200/80 dark:border-white/[0.06] bg-white/85 dark:bg-[#090b10]/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Logo + Brand */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group transition-transform active:scale-[0.99] shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-500/20 group-hover:border-cyan-300 dark:group-hover:border-cyan-500/40 transition-all flex items-center justify-center">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400 transition-colors hidden sm:inline">
            IP IdentificAitor
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:hidden">
            IPQA
          </span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Quota badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isNearLimit
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-300'
            }`}
            title={`Usadas hoy: ${quota.usedToday} / ${
              quota.maxPerDay === Number.POSITIVE_INFINITY ? '∞' : quota.maxPerDay
            }`}
          >
            <span className="tabular-nums font-semibold">{remaining}</span>
            <span className="text-slate-400 dark:text-slate-500">restantes</span>
          </div>

          {/* Role selector (demo) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08] transition-colors"
              title="Cambiar rol simulado (demo)"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{ROLE_LABELS[quota.role]}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#12151e] shadow-xl py-1.5 animate-in fade-in slide-in-from-top-1">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Rol simulado
                  </p>
                  {(['anonymous', 'registered', 'admin'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onRoleChange(role);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors ${
                        quota.role === role
                          ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{ROLE_LABELS[role]}</span>
                      {quota.role === role && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 dark:border-white/[0.06] mt-1 pt-1 px-3 py-1.5">
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Anónimo: 10/día · Registrado: 50/día · Admin: ∞
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* API Key toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setTempApiKey(customApiKey);
                setShowApiKeyInput((v) => !v);
              }}
              className={`p-2 rounded-xl border transition-colors ${
                customApiKey || hasApiKey
                  ? 'border-cyan-300 bg-cyan-50 text-cyan-600 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-400'
                  : 'border-slate-200 bg-slate-100/70 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08]'
              }`}
              title={
                customApiKey || hasApiKey
                  ? 'Clave API configurada'
                  : 'Añadir clave API de LayerCall (opcional)'
              }
            >
              <Key className="w-4 h-4" />
            </button>

            {showApiKeyInput && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowApiKeyInput(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#12151e] shadow-xl p-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Clave API LayerCall
                    </p>
                    <button
                      onClick={() => setShowApiKeyInput(false)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-snug">
                    {hasApiKey
                      ? 'El servidor ya tiene una clave. Puedes sobrescribirla temporalmente.'
                      : 'Sin clave se usa el modo Sandbox con respuestas simuladas.'}
                  </p>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="tl_live_..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveApiKey();
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveApiKey}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    >
                      Guardar
                    </button>
                    {customApiKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
            title="Historial de consultas"
            aria-label="Abrir historial"
          >
            <History className="w-4 h-4" />
          </button>

          {/* About / Analyzer toggle */}
          <button
            onClick={() =>
              setCurrentTab(currentTab === 'about' ? 'dashboard' : 'about')
            }
            className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {currentTab === 'about' ? 'Analizador' : 'Acerca de'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
