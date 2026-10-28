import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AboutView } from './components/AboutView';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/ui/Toast';
import { QueryHistoryItem, UsageQuota, UserRole } from './types/ipqs';
import {
  getSavedUsageQuota,
  incrementUsageCount,
  setAuthRole,
} from './lib/usageLimits';
import { checkConfigStatus } from './lib/ipqs';
import { isClerkEnabled, roleFromClerkUser } from './lib/clerk';

const STORAGE_KEY_HISTORY = 'ip_identificaitor_history';

/**
 * Syncs Clerk session → usage role when Clerk is enabled.
 * When Clerk is off, this component is a no-op wrapper.
 */
function ClerkRoleSync({
  onRoleResolved,
}: {
  onRoleResolved: (role: UserRole) => void;
}) {
  if (!isClerkEnabled) return null;
  return <ClerkRoleSyncInner onRoleResolved={onRoleResolved} />;
}

function ClerkRoleSyncInner({
  onRoleResolved,
}: {
  onRoleResolved: (role: UserRole) => void;
}) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    const role = roleFromClerkUser(isSignedIn ? user : null);
    onRoleResolved(role);
  }, [isLoaded, isSignedIn, user, onRoleResolved]);

  return null;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'about'>('dashboard');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ip_identificaitor_theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {
      // ignore
    }
    return true;
  });

  const [quota, setQuota] = useState<UsageQuota>(() => getSavedUsageQuota());
  const [history, setHistory] = useState<QueryHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [hasApiKey, setHasApiKey] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<QueryHistoryItem | null>(null);

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('ip_identificaitor_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('ip_identificaitor_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    checkConfigStatus().then((status) => {
      setHasApiKey(status.hasApiKey);
    });
  }, []);

  const handleRoleResolved = React.useCallback((role: UserRole) => {
    const updated = setAuthRole(role);
    setQuota(updated);
  }, []);

  const handleSaveHistoryItem = (item: QueryHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((i) => i.target !== item.target)].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving history to localStorage:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {
      console.error('Error clearing history:', e);
    }
  };

  /** Demo-only role switcher when Clerk is not configured */
  const handleRoleChange = (role: UserRole) => {
    const updated = setAuthRole(role);
    setQuota(updated);
  };

  const handleIncrementQuota = (): boolean => {
    const { allowed, updatedQuota } = incrementUsageCount();
    setQuota(updatedQuota);
    return allowed;
  };

  const handleSelectHistoryQuery = (item: QueryHistoryItem) => {
    setSelectedHistoryItem(item);
    setCurrentTab('dashboard');
  };

  return (
    <ToastProvider>
      <ClerkRoleSync onRoleResolved={handleRoleResolved} />
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 dark:bg-[#090b10] dark:text-slate-100 transition-colors duration-200 selection:bg-cyan-500/20 selection:text-cyan-900 dark:selection:text-cyan-200">
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          quota={quota}
          onRoleChange={handleRoleChange}
          onOpenHistory={() => setIsHistoryOpen(true)}
          isDark={isDark}
          toggleTheme={() => setIsDark((prev) => !prev)}
          hasApiKey={hasApiKey}
          customApiKey={customApiKey}
          setCustomApiKey={setCustomApiKey}
        />

        <main className="flex-1">
          {currentTab === 'dashboard' && (
            <Dashboard
              quota={quota}
              onIncrementQuota={handleIncrementQuota}
              onSaveHistory={handleSaveHistoryItem}
              customApiKey={customApiKey}
              hasApiKey={hasApiKey}
              selectedFromHistory={selectedHistoryItem}
              onResetSelectedHistory={() => setSelectedHistoryItem(null)}
            />
          )}

          {currentTab === 'about' && (
            <AboutView onGoToAnalyzer={() => setCurrentTab('dashboard')} />
          )}
        </main>

        <Footer onNavigate={setCurrentTab} />

        <HistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={history}
          onSelectQuery={handleSelectHistoryQuery}
          onClearHistory={handleClearHistory}
        />
      </div>
    </ToastProvider>
  );
}
