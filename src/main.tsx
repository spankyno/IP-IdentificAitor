import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { CLERK_PUBLISHABLE_KEY, isClerkEnabled } from './lib/clerk';

const root = document.getElementById('root')!;

if (isClerkEnabled) {
  createRoot(root).render(
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0f121a',
          colorInputBackground: '#12151e',
          colorInputText: '#f1f5f9',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'bg-[#12151e] border border-white/10 shadow-xl',
          formButtonPrimary:
            'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold',
          footerActionLink: 'text-cyan-400 hover:text-cyan-300',
        },
      }}
    >
      <App />
    </ClerkProvider>
  );
} else {
  createRoot(root).render(<App />);
}
