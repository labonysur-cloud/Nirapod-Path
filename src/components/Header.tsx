import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { PRESET_OPTIONS } from '../data/presets';
import { RotateCcw, Sun, Moon, Upload, Flame, Eye, Compass, ShieldAlert, FileText } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    theme,
    highContrast,
    activePresetId,
    blockedNodes,
    blockedEdges,
    closedExits,
    loadPreset,
    resetToInitialState,
    clearAllHazards,
    setLanguage,
    toggleTheme,
    toggleHighContrast,
    setIsUploadModalOpen,
    setIsReportModalOpen,
    t,
  } = useSimulator();

  const totalHazardsCount = blockedNodes.size + blockedEdges.size + closedExits.size;

  return (
    <header className="w-full bg-white dark:bg-black border-b border-slate-200 dark:border-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Single Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {t.appTitle}
              </h1>
              <span className="text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                ·
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                {t.ruleBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Zone 2: Scenario Selector & Import */}
        <div className="hidden md:flex items-center gap-2">
          <label htmlFor="preset-select" className="sr-only">
            {t.selectPreset}
          </label>
          <select
            id="preset-select"
            value={activePresetId}
            onChange={e => loadPreset(e.target.value)}
            className="text-xs font-medium bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PRESET_OPTIONS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {t[preset.labelKey as keyof typeof t] || preset.id}
              </option>
            ))}
            {activePresetId === 'custom' && (
              <option value="custom">{t.customUpload}</option>
            )}
          </select>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
            title={t.uploadHint}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.uploadBtn}</span>
          </button>
        </div>

        {/* Zone 3: Primary Actions & Utilities */}
        <div className="flex items-center gap-2">
          {/* Generate Audit Report Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800/80 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap shadow-xs"
            title={t.generateReport}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">{t.generateReport}</span>
          </button>

          {/* Reset Hazards Button */}
          <button
            onClick={resetToInitialState}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
            title={t.resetToInitial}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.resetToInitial}</span>
          </button>

          {/* Clear All Hazards */}
          {totalHazardsCount > 0 && (
            <button
              onClick={clearAllHazards}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
              title={t.clearAllHazards}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.clearAllHazards}</span>
              <span className="text-[11px] font-mono tabular-nums">({totalHazardsCount})</span>
            </button>
          )}

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`p-1.5 rounded-lg border transition-colors ${
              highContrast
                ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 text-amber-900 dark:text-amber-200'
                : 'text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-900'
            }`}
            title={t.highContrastMode}
            aria-label={t.highContrastMode}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors"
            title="Switch Language / ভাষা পরিবর্তন করুন"
          >
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle (Sun/Moon, strictly no emoji) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg transition-colors"
            title={theme === 'light' ? t.darkMode : t.lightMode}
            aria-label={theme === 'light' ? t.darkMode : t.lightMode}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
