import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { HazardIcon } from './CustomIcons';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Compass,
  Download,
  Trash2,
  Filter,
  FileText,
} from 'lucide-react';

export const ActivityLog: React.FC = () => {
  const { activityLog, clearActivityLog, setIsReportModalOpen, language, t } = useSimulator();
  const [filter, setFilter] = useState<'all' | 'hazard' | 'route' | 'system'>('all');

  const filteredLog = activityLog.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'hazard') return entry.category === 'hazard';
    if (filter === 'route') return entry.category === 'route';
    if (filter === 'system') return entry.category === 'system' || entry.category === 'start';
    return true;
  });

  const handleExportLog = () => {
    const exportData = activityLog.map(e => ({
      time: e.timeLabel,
      timestamp: new Date(e.timestamp).toISOString(),
      category: e.category,
      severity: e.severity,
      event: e.title,
      details: e.details || '',
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nirapod-path-audit-log-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSeverityStyle = (severity: string, category: string) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400 border-red-200 dark:border-red-900',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500" />,
        };
      case 'warning':
        return {
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-400 border-amber-200 dark:border-amber-900',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
        };
      case 'success':
        return {
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />,
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border-slate-200 dark:border-neutral-700',
          icon: category === 'start' ? <Compass className="w-3.5 h-3.5 text-sky-500" /> : <Info className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-neutral-900 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                {t.activityLogTitle}
              </h2>
              <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                ({activityLog.length} {t.eventsLogged})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 hidden sm:block">
              {t.activityLogSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls & Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-900 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilter('hazard')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'hazard'
                  ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.filterHazards}
            </button>
            <button
              onClick={() => setFilter('route')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'route'
                  ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.filterRoutes}
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filter === 'system'
                  ? 'bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.filterSystem}
            </button>
          </div>

          {/* Generate PDF/JSON Audit Report */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800/80 px-2 py-1 rounded-lg transition-colors shadow-xs"
            title={t.generateReport}
          >
            <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{t.generateReport}</span>
          </button>

          {/* Export JSON Audit Log */}
          {activityLog.length > 0 && (
            <button
              onClick={handleExportLog}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 px-2 py-1 rounded-lg transition-colors"
              title={t.exportLog}
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">{t.exportLog}</span>
            </button>
          )}

          {/* Clear Log */}
          {activityLog.length > 0 && (
            <button
              onClick={clearActivityLog}
              className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title={t.clearLog}
              aria-label={t.clearLog}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed */}
      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-900/60 pr-1">
        {filteredLog.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
            {t.noActivity}
          </div>
        ) : (
          filteredLog.map(entry => {
            const style = getSeverityStyle(entry.severity, entry.category);
            const title = language === 'bn' ? entry.titleBn : entry.title;
            const details = language === 'bn' ? entry.detailsBn : entry.details;

            return (
              <div
                key={entry.id}
                className="py-2.5 px-2 flex items-start gap-3 hover:bg-slate-50/60 dark:hover:bg-neutral-950/40 rounded-lg transition-colors group"
              >
                <span className="font-mono text-[11px] font-semibold text-slate-400 dark:text-neutral-500 shrink-0 mt-0.5">
                  {entry.timeLabel}
                </span>

                <div className="p-1 rounded-md bg-slate-100 dark:bg-neutral-900 shrink-0 mt-0.5">
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
                      {title}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                      {entry.category === 'hazard'
                        ? t.categoryHazard
                        : entry.category === 'route'
                        ? t.categoryRoute
                        : entry.category === 'start'
                        ? t.categoryStart
                        : t.categorySystem}
                    </span>
                  </div>

                  {details && (
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono mt-0.5 truncate group-hover:whitespace-normal">
                      {details}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
