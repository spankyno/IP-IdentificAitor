import React from 'react';
import { ArrowRight, Globe, Mail, Phone, ShieldCheck, Cpu, ExternalLink } from 'lucide-react';

const OG_IMAGE = '/og-image.png';
const SITE_URL = 'https://ip-identificaitor.pages.dev/';
const BLOG_URL = 'https://aitorsanchez.pages.dev/';
const HUB_URL = 'https://aitorhub.vercel.app/';
const CONTACT_URL = 'https://aitorsanchez.pages.dev/contacto';

export const AboutView: React.FC<{ onGoToAnalyzer: () => void }> = ({ onGoToAnalyzer }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 space-y-20">
      {/* Hero */}
      <div className="space-y-6 text-center max-w-2xl mx-auto">
        <h1
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
          style={{ textWrap: 'balance' }}
        >
          Acerca de IP IdentificAitor
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          Una plataforma unificada diseñada para evaluar en tiempo real el nivel de riesgo de identidades
          digitales y prevenir el fraude, abuso y actividades automatizadas.
        </p>
      </div>

      {/* Open Graph preview image */}
      <figure className="max-w-3xl mx-auto space-y-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-lg dark:shadow-xl bg-slate-900">
          <img
            src={OG_IMAGE}
            alt="IP IdentificAitor — Inteligencia de amenazas y reputación digital (imagen Open Graph 1200×630)"
            width={1200}
            height={630}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption className="text-center text-xs text-slate-500 dark:text-slate-400">
          Imagen social (Open Graph / Twitter) · 1200 × 630 ·{' '}
          <a
            href={SITE_URL}
            className="text-cyan-600 dark:text-cyan-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ip-identificaitor.pages.dev
          </a>
        </figcaption>
      </figure>

      {/* 5 Vectors of Threat Intelligence */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-xl space-y-8 transition-colors">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Capacidades de Análisis Multidimensional
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2.5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:border dark:border-cyan-500/20 dark:text-cyan-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Dirección IP</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detecta servidores proxy, túneles VPN comerciales, repetidores Tor, centros de datos y antecedentes de abuso o bots.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2.5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:border dark:border-blue-500/20 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Correo Electrónico</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Verifica la sintaxis, registros de servidor MX, cuentas de rol genéricas, buzones desechables y trampas de spam (honeypots).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2.5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Teléfono</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Valida la operadora móvil real, el formato de numeración internacional y filtra números virtuales VoIP descartables.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2.5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:border dark:border-purple-500/20 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">4. Dominio Web</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Evalúa la antigüedad de registro de dominio, configuraciones de seguridad de correo (SPF, DMARC) y proveedores temporales.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] space-y-2.5 sm:col-span-2 lg:col-span-2 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:border dark:border-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">5. Huella del Dispositivo (Fingerprint)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inspecciona firmas de Canvas 2D, renderizado GPU WebGL, pantalla y detecta entornos automatizados como Puppeteer, Selenium y navegadores headless.
            </p>
          </div>
        </div>
      </div>

      {/* Veredictos del Sistema */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Escala de Evaluación y Veredictos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Cada análisis produce un puntaje de riesgo de 0 a 100 y una recomendación inmediata:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0f121a] border border-emerald-200 dark:border-emerald-500/30 space-y-3 shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">ALLOW</span>
              <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">0 - 29</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Permitir Tráfico</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Actividad legítima sin señales de anonimización maliciosa, dominios desechables ni automatizaciones de scraping.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0f121a] border border-amber-200 dark:border-amber-500/30 space-y-3 shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">REVIEW</span>
              <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">30 - 74</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Revisar o Solicitar MFA</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Conexión desde VPN comercial, servidores de alojamiento o dominios jóvenes. Se recomienda verificar mediante segundo factor.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0f121a] border border-rose-200 dark:border-rose-500/30 space-y-3 shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">BLOCK</span>
              <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">75 - 100</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Bloqueo Preventivo</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Presencia confirmada de nodos Tor, proxies anónimos, cuentas trampa honeypot o números de teléfono denunciados por abuso.
            </p>
          </div>
        </div>
      </div>

      {/* Autor y enlaces */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] space-y-5 transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Autor y recursos</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Aitor Sánchez Gutiérrez</strong> — desarrollador de IP
          IdentificAitor. Explora más proyectos y contacto en los siguientes enlaces.
        </p>
        <ul className="flex flex-col sm:flex-row flex-wrap gap-3 text-sm">
          <li>
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              Esta aplicación <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </li>
          <li>
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              Blog <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </li>
          <li>
            <a
              href={HUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              Aitor Hub <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </li>
          <li>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
            >
              Contacto <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          onClick={onGoToAnalyzer}
          className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Ir al Analizador</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
