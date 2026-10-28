import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: 'dashboard' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-100/90 dark:bg-[#07080c] py-6 px-6 sm:px-10 mt-auto text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Unified Identity & Copyright */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white tracking-tight">IP IdentificAitor</span>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
          <span>Autor: Aitor Sánchez Gutiérrez © 2026 Todos los derechos reservados.</span>
        </div>

        {/* Unified Links Bar */}
        <nav className="flex flex-wrap items-center justify-center gap-5 text-xs">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Analizador
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Acerca de
          </button>
          <a
            href="https://aitorsanchez.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Blog</span>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </a>
          <a
            href="https://aitorhub.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Aitor Hub</span>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </a>
          <a
            href="https://aitorsanchez.pages.dev/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Contacto</span>
            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </a>
        </nav>
      </div>
    </footer>
  );
};
