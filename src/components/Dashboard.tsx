import React, { useState, useEffect } from 'react';
import {
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  Cpu,
  Loader2,
  Copy,
  Check,
  Code,
  MapPin,
  Network,
  Server,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  AnalysisType,
  LayerCallIPResult,
  LayerCallEmailResult,
  LayerCallPhoneResult,
  LayerCallDomainResult,
  DeviceFingerprint,
  QueryHistoryItem,
  UsageQuota,
} from '../types/ipqs';
import {
  analyzeIP,
  analyzeEmail,
  analyzePhone,
  analyzeDomain,
  detectCurrentIP,
  isValidIP,
  isValidEmail,
  isValidPhone,
  isValidDomain,
} from '../lib/ipqs';
import { generateDeviceFingerprint } from '../lib/deviceFingerprint';
import { copyToClipboard } from '../lib/utils';
import { ScoreGauge } from './ui/ScoreGauge';
import { useToast } from './ui/Toast';

interface DashboardProps {
  quota: UsageQuota;
  onIncrementQuota: () => boolean;
  onSaveHistory: (item: QueryHistoryItem) => void;
  customApiKey: string;
  hasApiKey: boolean;
  selectedFromHistory?: QueryHistoryItem | null;
  onResetSelectedHistory?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  quota,
  onIncrementQuota,
  onSaveHistory,
  customApiKey,
  selectedFromHistory,
  onResetSelectedHistory,
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisType>('ip');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingIp, setIsDetectingIp] = useState(false);

  // Results
  const [ipResult, setIpResult] = useState<LayerCallIPResult | null>(null);
  const [emailResult, setEmailResult] = useState<LayerCallEmailResult | null>(null);
  const [phoneResult, setPhoneResult] = useState<LayerCallPhoneResult | null>(null);
  const [domainResult, setDomainResult] = useState<LayerCallDomainResult | null>(null);
  const [deviceResult, setDeviceResult] = useState<DeviceFingerprint | null>(null);

  // Raw JSON inspection
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const { showToast } = useToast();

  // Populate from history if selected
  useEffect(() => {
    if (selectedFromHistory) {
      setActiveTab(selectedFromHistory.type);
      setInputValue(selectedFromHistory.target);
      if (selectedFromHistory.type === 'ip') {
        setIpResult(selectedFromHistory.fullResult as LayerCallIPResult);
      } else if (selectedFromHistory.type === 'email') {
        setEmailResult(selectedFromHistory.fullResult as LayerCallEmailResult);
      } else if (selectedFromHistory.type === 'phone') {
        setPhoneResult(selectedFromHistory.fullResult as LayerCallPhoneResult);
      } else if (selectedFromHistory.type === 'domain') {
        setDomainResult(selectedFromHistory.fullResult as LayerCallDomainResult);
      } else if (selectedFromHistory.type === 'device') {
        setDeviceResult(selectedFromHistory.fullResult as DeviceFingerprint);
      }
      onResetSelectedHistory?.();
    }
  }, [selectedFromHistory, onResetSelectedHistory]);

  const handleDetectMyIp = async () => {
    try {
      setIsDetectingIp(true);
      const myIp = await detectCurrentIP();
      setInputValue(myIp);
      setActiveTab('ip');
      showToast('info', 'IP Detectada', `Tu IP pública es ${myIp}`);
    } catch {
      showToast('error', 'Error al detectar IP', 'No se pudo obtener la IP pública.');
    } finally {
      setIsDetectingIp(false);
    }
  };

  const applyPreset = (type: AnalysisType, val: string) => {
    setActiveTab(type);
    setInputValue(val);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (activeTab === 'device') {
      runDeviceScan();
      return;
    }

    const val = inputValue.trim();
    if (!val) {
      showToast('warning', 'Campo vacío', 'Introduce un valor a analizar.');
      return;
    }

    if (activeTab === 'ip' && !isValidIP(val)) {
      showToast('error', 'IP no válida', 'Introduce una dirección IPv4 o IPv6 válida.');
      return;
    }
    if (activeTab === 'email' && !isValidEmail(val)) {
      showToast('error', 'Email no válido', 'Introduce un formato de correo electrónico válido.');
      return;
    }
    if (activeTab === 'phone' && !isValidPhone(val)) {
      showToast('error', 'Teléfono no válido', 'Introduce un número de teléfono con prefijo internacional.');
      return;
    }
    if (activeTab === 'domain' && !isValidDomain(val)) {
      showToast('error', 'Dominio no válido', 'Introduce un nombre de dominio válido (ej. dominio.com).');
      return;
    }

    const allowed = onIncrementQuota();
    if (!allowed) {
      showToast('error', 'Límite diario alcanzado', `Has alcanzado el límite de ${quota.maxPerDay} consultas.`);
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'ip') {
        const res = await analyzeIP(val, { userApiKey: customApiKey });
        setIpResult(res);

        const tags: string[] = [];
        if (res.signals?.is_vpn) tags.push('VPN');
        if (res.signals?.is_proxy) tags.push('Proxy');
        if (res.signals?.is_tor) tags.push('Tor');
        if (res.signals?.is_crawler || res.signals?.is_bot) tags.push('Crawler');

        onSaveHistory({
          id: `hist_${Date.now()}`,
          type: 'ip',
          target: res.ip,
          timestamp: Date.now(),
          riskScore: res.risk_score,
          verdict: res.verdict,
          summary: `${res.geo?.country || 'Desconocido'} · ${res.geo?.isp || 'ISP'}`,
          tags,
          fullResult: res,
        });

        showToast('success', 'Análisis completado', `IP ${res.ip} evaluada.`);
      } else if (activeTab === 'email') {
        const res = await analyzeEmail(val, { userApiKey: customApiKey });
        setEmailResult(res);

        const tags: string[] = [];
        if (res.signals?.is_disposable) tags.push('Desechable');
        if (res.signals?.is_role_account) tags.push('Cuenta Rol');
        if (res.signals?.is_honeypot) tags.push('Honeypot');

        onSaveHistory({
          id: `hist_${Date.now()}`,
          type: 'email',
          target: res.email,
          timestamp: Date.now(),
          riskScore: res.risk_score,
          verdict: res.verdict,
          summary: `${res.provider?.name || 'Proveedor'} · Sintaxis ${res.signals?.syntax_valid ? 'OK' : 'Error'}`,
          tags,
          fullResult: res,
        });

        showToast('success', 'Análisis completado', `Email ${res.email} evaluado.`);
      } else if (activeTab === 'phone') {
        const res = await analyzePhone(val, undefined, { userApiKey: customApiKey });
        setPhoneResult(res);

        const tags: string[] = [];
        if (res.signals?.is_voip) tags.push('VoIP');
        if (res.signals?.is_disposable) tags.push('Desechable');
        if (res.signals?.is_spammer) tags.push('Spam');

        onSaveHistory({
          id: `hist_${Date.now()}`,
          type: 'phone',
          target: res.phone,
          timestamp: Date.now(),
          riskScore: res.risk_score,
          verdict: res.verdict,
          summary: `${res.number?.carrier || 'Carrier'} · ${res.number?.line_type || 'Línea'}`,
          tags,
          fullResult: res,
        });

        showToast('success', 'Análisis completado', `Teléfono ${res.phone} evaluado.`);
      } else if (activeTab === 'domain') {
        const res = await analyzeDomain(val, { userApiKey: customApiKey });
        setDomainResult(res);

        const tags: string[] = [];
        if (res.signals?.is_newly_registered) tags.push('Reciente');
        if (res.signals?.is_disposable) tags.push('Desechable');
        if (res.signals?.has_spf && res.signals?.has_dmarc) tags.push('SPF+DMARC');

        onSaveHistory({
          id: `hist_${Date.now()}`,
          type: 'domain',
          target: res.domain,
          timestamp: Date.now(),
          riskScore: res.risk_score,
          verdict: res.verdict,
          summary: `${res.registrar?.name || 'Registrador'} · ${res.signals?.domain_age_days ? `${res.signals.domain_age_days} días` : 'Antigüedad N/A'}`,
          tags,
          fullResult: res,
        });

        showToast('success', 'Análisis completado', `Dominio ${res.domain} evaluado.`);
      }
    } catch {
      showToast('error', 'Error en el análisis', 'Ocurrió un problema al consultar el servicio.');
    } finally {
      setIsLoading(false);
    }
  };

  const runDeviceScan = async () => {
    const allowed = onIncrementQuota();
    if (!allowed) {
      showToast('error', 'Límite diario alcanzado', `Has alcanzado el límite de ${quota.maxPerDay} consultas.`);
      return;
    }

    setIsLoading(true);
    try {
      const fp = await generateDeviceFingerprint();
      setDeviceResult(fp);

      onSaveHistory({
        id: `hist_${Date.now()}`,
        type: 'device',
        target: fp.visitorId,
        timestamp: Date.now(),
        riskScore: fp.automation.riskScore,
        verdict: fp.automation.verdict,
        summary: `${fp.browser.platform} · ${fp.graphics.webglVendor}`,
        tags: fp.automation.webdriver ? ['Webdriver Detectado'] : ['Navegador Limpio'],
        fullResult: fp,
      });

      showToast('success', 'Huella Generada', `Identificador: ${fp.visitorId}`);
    } catch {
      showToast('error', 'Error al escanear', 'No se pudo generar la huella del navegador.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResultObject =
    activeTab === 'ip'
      ? ipResult
      : activeTab === 'email'
      ? emailResult
      : activeTab === 'phone'
      ? phoneResult
      : activeTab === 'domain'
      ? domainResult
      : deviceResult;

  const handleCopyRaw = async () => {
    if (!currentResultObject) return;
    await copyToClipboard(JSON.stringify(currentResultObject, null, 2));
    setCopiedRaw(true);
    showToast('info', 'JSON Copiado', 'Datos copiados al portapapeles');
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-20 space-y-16">
      {/* 1. HERO SECTION */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] transition-colors"
          style={{ textWrap: 'balance' }}
        >
          Analiza el riesgo de cualquier identidad digital
        </h1>
        <p
          className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed transition-colors"
          style={{ textWrap: 'balance' }}
        >
          Evaluación instantánea de reputación para direcciones IP, correos electrónicos, teléfonos, dominios y huellas de dispositivo.
        </p>
      </div>

      {/* 2. SELECTOR DE 5 ANÁLISIS */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-slate-200/80 dark:bg-[#0e121a] border border-slate-300/80 dark:border-white/[0.08] rounded-2xl shadow-sm dark:shadow-xl flex-wrap justify-center gap-1 transition-colors">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ip');
                setInputValue('');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ip'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Dirección IP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setInputValue('');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Correo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('phone');
                setInputValue('');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'phone'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Teléfono</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('domain');
                setInputValue('');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'domain'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dominio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('device');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'device'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Fingerprint</span>
            </button>
          </div>
        </div>

        {/* INPUT O BOTÓN SEGÚN MODO */}
        {activeTab !== 'device' ? (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type={activeTab === 'email' ? 'email' : 'text'}
                  placeholder={
                    activeTab === 'ip'
                      ? 'Introduce una dirección IP (ej. 185.220.101.1)...'
                      : activeTab === 'email'
                      ? 'Introduce un email (ej. usuario@ejemplo.com)...'
                      : activeTab === 'phone'
                      ? 'Introduce un teléfono (ej. +34 612 345 678)...'
                      : 'Introduce un dominio (ej. github.com o mailinator.com)...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-16 bg-white dark:bg-[#0f121a] border border-slate-300 dark:border-white/[0.1] rounded-2xl px-6 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 font-mono transition-all shadow-sm dark:shadow-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-16 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base transition-all flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 shadow-lg shadow-cyan-500/25 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <span>Analizar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Acciones y Ejemplos Rápidos */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 px-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 dark:text-slate-500">Pruebas rápidas:</span>
                {activeTab === 'ip' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset('ip', '185.220.101.1')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Tor Exit Relay
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('ip', '198.51.100.24')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      VPN Server
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('ip', '1.1.1.1')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Cloudflare DNS
                    </button>
                  </>
                ) : activeTab === 'email' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset('email', 'test@mailinator.com')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Mail Desechable
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('email', 'security@gmail.com')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Gmail Legítimo
                    </button>
                  </>
                ) : activeTab === 'phone' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset('phone', '+14155552671')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      VOIP Twilio (+1)
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('phone', '+34612345678')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Móvil España (+34)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset('domain', 'github.com')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Dominio Legítimo (github.com)
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('domain', 'mailinator.com')}
                      className="hover:text-cyan-600 dark:hover:text-cyan-400 font-mono transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4 cursor-pointer"
                    >
                      Desechable (mailinator.com)
                    </button>
                  </>
                )}
              </div>

              {activeTab === 'ip' && (
                <button
                  type="button"
                  onClick={handleDetectMyIp}
                  disabled={isDetectingIp || isLoading}
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Usar mi IP actual</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Fingerprint Action Card */
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] text-center space-y-6 shadow-sm dark:shadow-xl transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:border dark:border-cyan-500/20 dark:text-cyan-400 mx-auto flex items-center justify-center">
              <Cpu className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Análisis de Huella de este Dispositivo
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Genera la firma técnica de tu navegador mediante Canvas 2D, renderizado GPU WebGL y analiza indicadores de automatización.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={runDeviceScan}
                disabled={isLoading}
                className="h-14 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all inline-flex items-center gap-2.5 shadow-lg shadow-cyan-500/25 active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
                <span>Escanear Huella Ahora</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. SKELETON */}
      {isLoading && (
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] space-y-8 animate-pulse shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/[0.04]" />
              <div className="space-y-3">
                <div className="w-48 h-6 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
                <div className="w-32 h-4 bg-slate-100 dark:bg-white/[0.04] rounded-lg" />
              </div>
            </div>
            <div className="w-32 h-10 bg-slate-100 dark:bg-white/[0.04] rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 bg-slate-100 dark:bg-white/[0.03] rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* 4. RESULTADOS */}

      {/* IP Results */}
      {!isLoading && activeTab === 'ip' && ipResult && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 dark:border-white/[0.06] pb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <ScoreGauge score={ipResult.risk_score} verdict={ipResult.verdict} size="xl" />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {ipResult.ip}
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(ipResult.ip);
                        showToast('info', 'IP Copiada', ipResult.ip);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Copiar IP"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                    <span>{ipResult.geo?.isp || 'ISP'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ipResult.geo?.asn}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3" />
                      <span>{ipResult.processing_time_sec ? `${(ipResult.processing_time_sec * 1000).toFixed(0)} ms` : '12 ms'}</span>
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{showRawJson ? 'Cerrar JSON' : 'Ver JSON'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Señales de Amenaza Detectadas
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <CleanSignalCard label="VPN Activa" active={Boolean(ipResult.signals?.is_vpn)} />
                <CleanSignalCard label="Proxy / Túnel" active={Boolean(ipResult.signals?.is_proxy)} />
                <CleanSignalCard label="Nodo TOR" active={Boolean(ipResult.signals?.is_tor)} />
                <CleanSignalCard label="Datacenter" active={Boolean(ipResult.signals?.is_datacenter)} />
                <CleanSignalCard label="Abuso Previo" active={Boolean(ipResult.signals?.recent_abuse)} />
                <CleanSignalCard label="Bot / Crawler" active={Boolean(ipResult.signals?.is_crawler || ipResult.signals?.is_bot)} isCrawler />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Ubicación Geográfica</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>País:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{ipResult.geo?.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ciudad:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ipResult.geo?.city ? `${ipResult.geo.city}, ${ipResult.geo.region || ''}` : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zona Horaria:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{ipResult.geo?.timezone || 'UTC'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Infraestructura de Red</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Proveedor (ISP):</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] text-right">{ipResult.geo?.isp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sistema Autónomo:</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{ipResult.geo?.asn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reportes de Abuso:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{ipResult.abuse_reports ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Results */}
      {!isLoading && activeTab === 'email' && emailResult && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 dark:border-white/[0.06] pb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <ScoreGauge score={emailResult.risk_score} verdict={emailResult.verdict} size="xl" />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {emailResult.email}
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(emailResult.email);
                        showToast('info', 'Email Copiado', emailResult.email);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Copiar email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                    <span>Sintaxis: {emailResult.signals?.syntax_valid ? 'Válida' : 'Inválida'}</span>
                    <span aria-hidden="true">·</span>
                    <span>Registros MX: {emailResult.signals?.mx_found ? 'Correctos' : 'Ausentes'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3" />
                      <span>{emailResult.processing_time_sec ? `${(emailResult.processing_time_sec * 1000).toFixed(0)} ms` : '15 ms'}</span>
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{showRawJson ? 'Cerrar JSON' : 'Ver JSON'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Señales de Verificación de Correo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <CleanSignalCard label="Desechable" active={Boolean(emailResult.signals?.is_disposable)} />
                <CleanSignalCard label="Cuenta de Rol" active={Boolean(emailResult.signals?.is_role_account)} neutral />
                <CleanSignalCard label="Proveedor Libre" active={Boolean(emailResult.signals?.is_free_provider)} neutral />
                <CleanSignalCard label="Catch-All" active={Boolean(emailResult.signals?.is_catch_all)} neutral />
                <CleanSignalCard label="Abuso Previo" active={Boolean(emailResult.signals?.recent_abuse)} />
                <CleanSignalCard label="Honeypot" active={Boolean(emailResult.signals?.is_honeypot)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Infraestructura de Servidor</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Host MX:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{emailResult.provider?.mx_host || 'mx.dominio.com'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Proveedor:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{emailResult.provider?.name || 'Estándar'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Antigüedad & Veredicto</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Antigüedad Estimada:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {emailResult.signals?.domain_age_days ? `${emailResult.signals.domain_age_days} días` : 'Más de 3 años'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Veredicto del Sistema:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase">{emailResult.verdict}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Results */}
      {!isLoading && activeTab === 'phone' && phoneResult && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 dark:border-white/[0.06] pb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <ScoreGauge score={phoneResult.risk_score} verdict={phoneResult.verdict} size="xl" />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {phoneResult.number?.international_format || phoneResult.phone}
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(phoneResult.phone);
                        showToast('info', 'Teléfono Copiado', phoneResult.phone);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Copiar teléfono"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                    <span>{phoneResult.number?.carrier || 'Carrier'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{phoneResult.number?.line_type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3" />
                      <span>{phoneResult.processing_time_sec ? `${(phoneResult.processing_time_sec * 1000).toFixed(0)} ms` : '12 ms'}</span>
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{showRawJson ? 'Cerrar JSON' : 'Ver JSON'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Señales de Validación Telefónica
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <CleanSignalCard label="Línea VOIP" active={Boolean(phoneResult.signals?.is_voip)} />
                <CleanSignalCard label="Descartable" active={Boolean(phoneResult.signals?.is_disposable)} />
                <CleanSignalCard label="Tarif. Especial" active={Boolean(phoneResult.signals?.is_premium_rate)} />
                <CleanSignalCard label="Spam Reportado" active={Boolean(phoneResult.signals?.is_spammer)} />
                <CleanSignalCard label="Abuso Previo" active={Boolean(phoneResult.signals?.recent_abuse)} />
                <CleanSignalCard label="Prefijo Válido" active={Boolean(phoneResult.number?.syntax_valid)} neutral />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Operador & Tipo de Línea</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Carrier (Operador):</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{phoneResult.number?.carrier || 'No identificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo de Línea:</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400 capitalize">{phoneResult.number?.line_type}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Geografía & Veredicto</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>País:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{phoneResult.number?.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Veredicto del Sistema:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase">{phoneResult.verdict}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Domain Results */}
      {!isLoading && activeTab === 'domain' && domainResult && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 dark:border-white/[0.06] pb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <ScoreGauge score={domainResult.risk_score} verdict={domainResult.verdict} size="xl" />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {domainResult.domain}
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(domainResult.domain);
                        showToast('info', 'Dominio Copiado', domainResult.domain);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Copiar dominio"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                    <span>Registrador: {domainResult.registrar?.name || 'No disponible'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3" />
                      <span>{domainResult.processing_time_sec ? `${(domainResult.processing_time_sec * 1000).toFixed(0)} ms` : '18 ms'}</span>
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{showRawJson ? 'Cerrar JSON' : 'Ver JSON'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Señales de Reputación y Seguridad del Dominio
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <CleanSignalCard label="Recién Creado" active={Boolean(domainResult.signals?.is_newly_registered)} />
                <CleanSignalCard label="Dominio Desechable" active={Boolean(domainResult.signals?.is_disposable)} />
                <CleanSignalCard label="Servidor MX" active={Boolean(domainResult.signals?.mx_found)} neutral />
                <CleanSignalCard label="Registro SPF" active={Boolean(domainResult.signals?.has_spf)} neutral />
                <CleanSignalCard label="Política DMARC" active={Boolean(domainResult.signals?.has_dmarc)} neutral />
                <CleanSignalCard label="Abuso Reportado" active={Boolean(domainResult.signals?.recent_abuse)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Registro y Antigüedad</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Registrador:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{domainResult.registrar?.name || 'Desconocido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Días de Antigüedad:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {domainResult.signals?.domain_age_days ? `${domainResult.signals.domain_age_days} días` : 'No especificado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha Creación:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {domainResult.registrar?.created_at ? domainResult.registrar.created_at.split('T')[0] : 'Histórico'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Seguridad de Envío y DNS</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Autenticación SPF:</span>
                    <span className={domainResult.signals?.has_spf ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                      {domainResult.signals?.has_spf ? 'Configurado' : 'No detectado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protección DMARC:</span>
                    <span className={domainResult.signals?.has_dmarc ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}>
                      {domainResult.signals?.has_dmarc ? 'Activo' : 'No detectado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Veredicto del Sistema:</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase">{domainResult.verdict}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Device Fingerprint Results */}
      {!isLoading && activeTab === 'device' && deviceResult && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0f121a] border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-10 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 dark:border-white/[0.06] pb-10">
              <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <ScoreGauge score={deviceResult.automation.riskScore} verdict={deviceResult.automation.verdict} size="xl" />
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {deviceResult.visitorId}
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(deviceResult.visitorId);
                        showToast('info', 'ID Copiado', deviceResult.visitorId);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Copiar ID de visitante"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2">
                    <span>{deviceResult.browser.platform}</span>
                    <span aria-hidden="true">·</span>
                    <span>{deviceResult.screen.width}x{deviceResult.screen.height}</span>
                    <span aria-hidden="true">·</span>
                    <span>GPU: {deviceResult.graphics.webglVendor}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{showRawJson ? 'Cerrar JSON' : 'Ver JSON'}</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Señales de Integridad y Detección de Bots
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <CleanSignalCard label="Webdriver Activo" active={deviceResult.automation.webdriver} />
                <CleanSignalCard label="Headless Browser" active={deviceResult.automation.hasAutomationHeadless} />
                <CleanSignalCard label="Anomalías Detectadas" active={deviceResult.automation.riskFlags.length > 0} />
                <CleanSignalCard label="Navegador Limpio" active={!deviceResult.automation.webdriver && !deviceResult.automation.hasAutomationHeadless} neutral />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-sm">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Hardware & Gráficos</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Hash Huella Canvas:</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{deviceResult.graphics.canvasHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renderizador GPU:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px] text-right">{deviceResult.graphics.webglRenderer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Núcleos de CPU Lógicos:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold">{deviceResult.browser.hardwareConcurrency} Cores</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Entorno del Sistema</span>
                </h4>
                <div className="space-y-2.5 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Zona Horaria:</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{deviceResult.timing.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Idioma Principal:</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{deviceResult.browser.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cookies Habilitadas:</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{deviceResult.browser.cookiesEnabled ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Modal / Section */}
      {showRawJson && currentResultObject && (
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-slate-50 dark:bg-[#0a0c12] border border-slate-200 dark:border-white/[0.08] space-y-4 animate-in fade-in transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
              <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Respuesta Cruda JSON (Motor de Inteligencia)</span>
            </span>
            <button
              onClick={handleCopyRaw}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRaw ? 'Copiado' : 'Copiar JSON'}</span>
            </button>
          </div>
          <pre className="p-6 rounded-2xl bg-slate-900 text-cyan-300 dark:bg-[#08090d] dark:text-cyan-300/90 border border-slate-800 dark:border-white/[0.05] font-mono text-xs overflow-x-auto max-h-96">
            {JSON.stringify(currentResultObject, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

interface CleanSignalCardProps {
  label: string;
  active: boolean;
  neutral?: boolean;
  isCrawler?: boolean;
}

const CleanSignalCard: React.FC<CleanSignalCardProps> = ({ label, active, neutral, isCrawler }) => {
  let style = 'bg-slate-50/80 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-400';
  let badgeText = 'No';
  let badgeColor = 'text-slate-500 bg-slate-200/60 dark:bg-white/[0.04] border-slate-300/80 dark:border-white/[0.06]';

  if (active) {
    if (neutral) {
      style = 'bg-cyan-50 dark:bg-cyan-500/[0.04] border-cyan-200 dark:border-cyan-500/20 text-cyan-950 dark:text-slate-200';
      badgeText = 'Sí';
      badgeColor = 'text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20';
    } else if (isCrawler) {
      style = 'bg-blue-50 dark:bg-blue-500/[0.04] border-blue-200 dark:border-blue-500/20 text-blue-950 dark:text-blue-200';
      badgeText = 'Crawler';
      badgeColor = 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    } else {
      style = 'bg-rose-50 dark:bg-rose-500/[0.06] border-rose-200 dark:border-rose-500/30 text-rose-950 dark:text-rose-200 shadow-xs dark:shadow-sm dark:shadow-rose-500/10';
      badgeText = 'Detectado';
      badgeColor = 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
    }
  }

  return (
    <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${style}`}>
      <span className="text-xs font-semibold tracking-tight">{label}</span>
      <div>
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${badgeColor}`}>
          {badgeText}
        </span>
      </div>
    </div>
  );
};
