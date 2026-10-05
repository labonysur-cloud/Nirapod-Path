import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { validateBuildingData } from '../utils/routingEngine';
import { OFFICIAL_SAMPLE } from '../data/presets';
import { X, Upload, CheckCircle2, AlertOctagon, FileCode2, Download } from 'lucide-react';

export const UploadModal: React.FC = () => {
  const { isUploadModalOpen, setIsUploadModalOpen, loadCustomBuilding, t } = useSimulator();
  const [jsonText, setJsonText] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  if (!isUploadModalOpen) return null;

  const handleValidateAndLoad = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateBuildingData(parsed);

      if (!validation.valid) {
        setIsValid(false);
        setErrors(validation.errors);
      } else {
        setIsValid(true);
        setErrors([]);
        loadCustomBuilding(validation.data!);
        setIsUploadModalOpen(false);
      }
    } catch (e: any) {
      setIsValid(false);
      setErrors([`${t.jsonSyntaxError}: ${e.message}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setJsonText(text);
      try {
        const parsed = JSON.parse(text);
        const validation = validateBuildingData(parsed);
        if (!validation.valid) {
          setIsValid(false);
          setErrors(validation.errors);
        } else {
          setIsValid(true);
          setErrors([]);
        }
      } catch (err: any) {
        setIsValid(false);
        setErrors([`${t.jsonSyntaxError}: ${err.message}`]);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sampleStr = JSON.stringify(OFFICIAL_SAMPLE, null, 2);
    setJsonText(sampleStr);
    setIsValid(true);
    setErrors([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.customUpload}
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {t.uploadHint} (2–60 {t.nodesLabel.toLowerCase()}, 1–150 {t.corridorsLabel.toLowerCase()})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                <FileCode2 className="w-4 h-4" />
                <span>{t.uploadFile}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <a
                href="/building.json"
                download="building.json"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                title={t.downloadSample}
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.downloadSample}</span>
              </a>
            </div>

            <button
              onClick={handleLoadSample}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t.loadSample}
            </button>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="json-textarea" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.jsonContent}
            </label>
            <textarea
              id="json-textarea"
              value={jsonText}
              onChange={e => {
                setJsonText(e.target.value);
                setIsValid(null);
                setErrors([]);
              }}
              placeholder={t.jsonPlaceholder}
              className="w-full h-64 p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Validation Status & Error List */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 mb-2">
                <AlertOctagon className="w-4 h-4" />
                <span>{t.validationErrors} ({errors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-red-600 dark:text-red-300">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {isValid === true && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.datasetVerified}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-neutral-950/50">
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleValidateAndLoad}
            disabled={!jsonText.trim()}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-sm"
          >
            {t.validateAndApply}
          </button>
        </div>
      </div>
    </div>
  );
};
