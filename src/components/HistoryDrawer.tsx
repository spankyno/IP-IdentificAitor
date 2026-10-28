import React, { useState } from 'react';
import { X, Trash2, Download, Search, Globe, Mail, Phone, Cpu, ArrowUpRight, Copy, Check } from 'lucide-react';
import { QueryHistoryItem, AnalysisType } from '../types/ipqs';
import { exportToCsv, exportToJson, formatTimestamp, getRiskLevel, copyToClipboard } from '../lib/utils';
import { useToast } from './ui/Toast';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<AnalysisType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const filteredItems = history.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopyTarget = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    showToast('info', 'Copiado al portapapeles', text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (!history.length) return;
    const flattened = history.map((item) => ({
      Fecha: formatTimestamp(item.timestamp),
      Tipo: item.type,
      Objetivo: item.target,
      Puntuacion_Riesgo: item.riskScore,
      Veredicto_Sistema: item.verdict,
      Resumen: item.summary,
      Etiquetas: item.tags.join('; '),
    }));
    exportToCsv(flattened, 'ip_identificaitor_historial');
    showToast('success', 'Historial exportado', 'Archivo CSV descargado correctamente.');
  };

  const handleExportJson = () => {
    if (!history.length) return;
    exportToJson(history, 'ip_identificaitor_historial');
    showToast('success', 'Historial exportado', 'Archivo JSON descargado correctamente.');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200 transition-colors">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Historial de Consultas</span>
              <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">({history.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Almacenado localmente en tu navegador</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por IP, email, host o detalle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'ip', 'email', 'phone', 'domain', 'device'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded font-medium whitespace-nowrap transition-colors ${
                  filterType === t
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {t === 'all'
                  ? 'Todos'
                  : t === 'ip'
                  ? 'IPs'
                  : t === 'email'
                  ? 'Emails'
                  : t === 'phone'
                  ? 'Teléfonos'
                  : t === 'domain'
                  ? 'Dominios'
                  : 'Dispositivo'}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              <p>No se encontraron consultas registradas.</p>
              <p className="mt-1 text-slate-500 dark:text-slate-600">Ejecuta un análisis en el Dashboard para comenzar.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const risk = getRiskLevel(item.riskScore, item.verdict);
              const icon =
                item.type === 'ip' ? (
                  <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                ) : item.type === 'email' ? (
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : item.type === 'phone' ? (
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : item.type === 'domain' ? (
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                );

              return (
                <div key={item.id} className="pt-2.5 first:pt-0 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 mt-0.5">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {item.target}
                          </span>
                          <button
                            onClick={() => handleCopyTarget(item.target, item.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copiar valor"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.summary}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          {item.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-600 dark:text-slate-400 truncate">{item.tags.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${risk.badgeBg}`}>
                          {item.verdict || risk.verdict}
                        </span>
                        <span className={`font-mono text-xs font-bold tabular-nums ${risk.textColor}`}>
                          {item.riskScore}/100
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onSelectQuery(item);
                          onClose();
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        <span>Ver</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Actions */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                title="Exportar a CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                title="Exportar a JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Seguro que deseas vaciar el historial local?')) {
                  onClearHistory();
                  showToast('info', 'Historial vaciado', 'Se han borrado los registros locales.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
