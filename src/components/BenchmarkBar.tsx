import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { CheckCircle2, ChevronRight, PlayCircle, ShieldAlert } from 'lucide-react';

export const BenchmarkBar: React.FC = () => {
  const { runBenchmarkScenario, routeResult, t } = useSimulator();

  const scenarios: Array<{
    id: 'baseline' | 'blocked_junction' | 'exits_closed' | 'different_start' | 'blocked_start';
    title: string;
    expected: string;
  }> = [
    {
      id: 'baseline',
      title: t.scenarioBaseline,
      expected: t.scenarioBaselineDesc,
    },
    {
      id: 'blocked_junction',
      title: t.scenarioBlockedJunction,
      expected: t.scenarioBlockedJunctionDesc,
    },
    {
      id: 'exits_closed',
      title: t.scenarioExitsClosed,
      expected: t.scenarioExitsClosedDesc,
    },
    {
      id: 'different_start',
      title: t.scenarioDifferentStart,
      expected: t.scenarioDifferentStartDesc,
    },
    {
      id: 'blocked_start',
      title: t.scenarioBlockedStart,
      expected: t.scenarioBlockedStartDesc,
    },
  ];

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
            {t.sampleChecksTitle}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-neutral-400">
          {t.rulebookReference}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {scenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => runBenchmarkScenario(sc.id)}
            className="flex flex-col text-left p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50/60 dark:bg-neutral-900/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all group"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {sc.title}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              {sc.expected}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
