import React, { useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { ExitIcon, HazardIcon } from './CustomIcons';
import { Clock, Play, Pause, RotateCcw, Activity, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

export const SimulationStats: React.FC = () => {
  const {
    totalSafeExits,
    totalExits,
    reachableSafeExits,
    timeElapsed,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    hazardCoveragePercentage,
    compromisedElementsCount,
    totalElementsCount,
    statsHistory,
    routeResult,
    theme,
    t,
  } = useSimulator();

  const [activeTrend, setActiveTrend] = useState<'hazard' | 'cost'>('hazard');

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Determine hazard coverage color tone
  const getHazardLevelColor = (pct: number) => {
    if (pct === 0) return 'text-emerald-500 bg-emerald-500';
    if (pct < 20) return 'text-sky-500 bg-sky-500';
    if (pct < 45) return 'text-amber-500 bg-amber-500';
    return 'text-red-500 bg-red-500';
  };

  const hazardColor = getHazardLevelColor(hazardCoveragePercentage);

  // Sparkline data preparation: ensure at least 2 points for a clean line
  const sparklineData = statsHistory.length >= 2
    ? statsHistory
    : [
        { time: 0, timeLabel: '00:00', hazardCoverage: hazardCoveragePercentage, routeCost: routeResult.totalCost || 7, safeExits: totalSafeExits },
        { time: 1, timeLabel: '00:01', hazardCoverage: hazardCoveragePercentage, routeCost: routeResult.totalCost || 7, safeExits: totalSafeExits },
      ];

  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-neutral-900 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
            {t.statsTitle}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Telemetry</span>
          </span>
        </div>
      </div>

      {/* Grid: 3 Metric Cards + 1 Sparkline Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* STAT 1: Total Safe Exits */}
        <div className="bg-slate-50/80 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">
              {t.totalSafeExits}
            </span>
            <div className={`p-1 rounded ${totalSafeExits > 0 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400'}`}>
              <ExitIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${totalSafeExits > 0 ? 'text-slate-900 dark:text-neutral-100' : 'text-red-500'}`}>
              {totalSafeExits}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              / {totalExits} total
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>{t.reachableExits}:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
              {reachableSafeExits}
            </span>
          </div>
        </div>

        {/* STAT 2: Time Elapsed with Play/Pause & Reset */}
        <div className="bg-slate-50/80 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">
              {t.timeElapsed}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTimer}
                className="p-1 rounded text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
                aria-label={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-1 rounded text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-neutral-100">
              {formatTime(timeElapsed)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {isTimerRunning ? 'active' : 'paused'}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Status:</span>
            <span className={`font-mono text-[10px] font-semibold uppercase ${isTimerRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isTimerRunning ? 'Running' : 'Halted'}
            </span>
          </div>
        </div>

        {/* STAT 3: Hazard Coverage Percentage */}
        <div className="bg-slate-50/80 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-400">
              {t.hazardCoverage}
            </span>
            <div className={`p-1 rounded ${compromisedElementsCount > 0 ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'}`}>
              <HazardIcon className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="my-1.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono tabular-nums ${hazardColor.split(' ')[0]}`}>
              {hazardCoveragePercentage}%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
              {compromisedElementsCount}/{totalElementsCount} items
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${hazardColor.split(' ')[1]}`}
              style={{ width: `${Math.min(100, Math.max(2, hazardCoveragePercentage))}%` }}
            />
          </div>
        </div>

        {/* STAT 4: Recharts Mini Sparkline Chart */}
        <div className="bg-slate-50/80 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800/80 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.metricTrend}</span>
            </span>

            {/* Metric Switcher Tab */}
            <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-neutral-900 p-0.5 rounded text-[10px] font-medium">
              <button
                onClick={() => setActiveTrend('hazard')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  activeTrend === 'hazard'
                    ? 'bg-white dark:bg-neutral-800 text-red-600 dark:text-red-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Hazard Coverage % Trend"
              >
                Hazard
              </button>
              <button
                onClick={() => setActiveTrend('cost')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  activeTrend === 'cost'
                    ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Route Cost Trend"
              >
                Cost
              </button>
            </div>
          </div>

          {/* Sparkline Canvas using Recharts */}
          <div className="w-full h-14 relative mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="sparklineHazardGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sparklineCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-neutral-900 text-white border border-slate-700 dark:border-neutral-700 rounded px-2 py-1 text-[10px] font-mono shadow-md">
                          <span className="text-slate-400 block">{data.timeLabel}</span>
                          <span className="font-bold text-amber-300">
                            {activeTrend === 'hazard' ? `Hazard: ${data.hazardCoverage}%` : `Cost: ${data.routeCost}`}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {activeTrend === 'hazard' ? (
                  <Area
                    type="monotone"
                    dataKey="hazardCoverage"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sparklineHazardGrad)"
                    isAnimationActive={false}
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="routeCost"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sparklineCostGrad)"
                    isAnimationActive={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-neutral-400 flex items-center justify-between font-mono pt-1">
            <span>{sparklineData[0]?.timeLabel || '00:00'}</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
              {activeTrend === 'hazard' ? `${hazardCoveragePercentage}%` : `Cost: ${routeResult.totalCost}`}
            </span>
            <span>{sparklineData[sparklineData.length - 1]?.timeLabel || '00:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
