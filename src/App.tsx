import React from 'react';
import { SimulatorProvider, useSimulator } from './context/SimulatorContext';
import { Header } from './components/Header';
import { BuildingMap } from './components/BuildingMap';
import { RoutePanel } from './components/RoutePanel';
import { InspectorPanel } from './components/InspectorPanel';
import { BenchmarkBar } from './components/BenchmarkBar';
import { HazardSummary } from './components/HazardSummary';
import { SimulationStats } from './components/SimulationStats';
import { ActivityLog } from './components/ActivityLog';
import { UploadModal } from './components/UploadModal';
import { ReportModal } from './components/ReportModal';
import { exportMapAsPng, exportMapAsSvg } from './utils/exportMap';
import { Download, ShieldCheck, Compass } from 'lucide-react';

const SimulatorDashboard: React.FC = () => {
  const { t } = useSimulator();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Quick Benchmark Suite (Official Test Cases from §4.1) */}
        <BenchmarkBar />

        {/* Real-Time Simulation Statistics (Safe Exits, Time Elapsed, Hazard Coverage) */}
        <SimulationStats />

        {/* Two-Zone Layout: Interactive Stage + Control Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left/Center Zone: Interactive Building Map (7 cols on lg, 8 on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400">
                  Interactive Building Map
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportMapAsPng('nirapod-path-map.png')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 shadow-xs transition-colors"
                  title="Export PNG map"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => exportMapAsSvg('nirapod-path-map.svg')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 shadow-xs transition-colors"
                  title="Export SVG vector"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>SVG</span>
                </button>
              </div>
            </div>

            <div className="w-full h-[520px] lg:h-[620px]">
              <BuildingMap />
            </div>

            <HazardSummary />
          </div>

          {/* Right Zone: Route Calculation & Element Inspector (5 cols on lg, 4 on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <RoutePanel />
            <InspectorPanel />
          </div>
        </div>

        {/* Real-Time Simulation Activity Log for Audit Transparency */}
        <ActivityLog />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-neutral-900 bg-white dark:bg-black py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-neutral-400 gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-700 dark:text-neutral-300">Nirapod Path</span>
            <span>·</span>
            <span>{t.educationalNote}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-neutral-500">
            <span>Client-side only · Zero backend</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>

      {/* Custom JSON Upload Modal */}
      <UploadModal />

      {/* Evacuation Audit Report Generation Modal */}
      <ReportModal />
    </div>
  );
};

export default function App() {
  return (
    <SimulatorProvider>
      <SimulatorDashboard />
    </SimulatorProvider>
  );
}
