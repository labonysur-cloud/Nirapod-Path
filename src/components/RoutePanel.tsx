import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { Play, Pause, SkipForward, RotateCcw, ShieldCheck, AlertOctagon, AlertTriangle, ArrowRight, CornerDownRight } from 'lucide-react';

export const RoutePanel: React.FC = () => {
  const {
    startNodeId,
    routeResult,
    alternativeRoutes,
    buildingData,
    setSelectedElement,
    isWalking,
    walkthroughStep,
    simSpeed,
    startWalkthrough,
    pauseWalkthrough,
    resetWalkthrough,
    stepForwardWalkthrough,
    setSimSpeed,
    t,
  } = useSimulator();

  const nodeMap = new Map(buildingData.nodes.map(n => [n.id, n]));
  const startNode = startNodeId ? nodeMap.get(startNodeId) : null;
  const exitNode = routeResult.exitId ? nodeMap.get(routeResult.exitId) : null;

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
      {/* Route Status Banner */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {t.statusTitle}
        </div>

        {routeResult.status === 'success' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-3.5 flex items-start gap-3">
            <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {t.statusRouteFound}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 font-mono tabular-nums">
                  {t.totalCost}: {routeResult.totalCost}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-1">
                {startNode?.label || startNodeId} <span aria-hidden="true">→</span> {exitNode?.label || routeResult.exitId}
              </p>
            </div>
          </div>
        )}

        {routeResult.status === 'no_route' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-3.5 flex items-start gap-3">
            <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {t.statusNoRoute}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                {startNodeId
                  ? t.noRouteInstructions
                  : t.statusSelectStart}
              </p>
            </div>
          </div>
        )}

        {routeResult.status === 'start_blocked' && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg p-3.5 flex items-start gap-3">
            <div className="p-1 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0 mt-0.5">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-red-900 dark:text-red-200">
                {t.statusStartBlocked}
              </div>
              <p className="text-xs text-red-700 dark:text-red-300/80 mt-1">
                {t.blockedStartInstructions.replace('{node}', startNodeId || '')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row (When route is found) */}
      {routeResult.status === 'success' && (
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t.totalCost}
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {routeResult.totalCost}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t.targetExit}
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {routeResult.exitId}
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t.hopCount}
            </span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {routeResult.pathNodes.length}
            </span>
          </div>
        </div>
      )}

      {/* Node Sequence Breadcrumbs */}
      {routeResult.status === 'success' && routeResult.pathNodes.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <span>{t.nodeSequence}</span>
            <span className="text-[11px] font-mono lowercase">{routeResult.pathEdges.length} {t.corridorsTraversed}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            {routeResult.pathNodes.map((nodeId, idx) => {
              const node = nodeMap.get(nodeId);
              const edgeCost = routeResult.stepDetails && idx > 0 ? routeResult.stepDetails[idx - 1]?.cost : null;
              const isCurrentStep = walkthroughStep === idx;

              return (
                <React.Fragment key={nodeId}>
                  {idx > 0 && (
                    <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500">
                      <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {edgeCost}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedElement({ type: 'node', id: nodeId })}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                      isCurrentStep
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300 dark:ring-amber-600'
                        : idx === 0
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-800'
                        : idx === routeResult.pathNodes.length - 1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                    title={node?.label}
                  >
                    {nodeId}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Walkthrough Controls */}
      {routeResult.status === 'success' && routeResult.pathNodes.length > 1 && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>{t.walkthroughTitle}</span>
            <span className="text-xs font-mono text-slate-500">
              {t.walkthroughStep} {walkthroughStep + 1} {t.walkthroughOf} {routeResult.pathNodes.length}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isWalking ? (
                <button
                  onClick={pauseWalkthrough}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>{t.pause}</span>
                </button>
              ) : (
                <button
                  onClick={startWalkthrough}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{t.play}</span>
                </button>
              )}

              <button
                onClick={stepForwardWalkthrough}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title={t.stepNext}
                aria-label={t.stepNext}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={resetWalkthrough}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title={t.stepReset}
                aria-label={t.stepReset}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Switcher */}
            <div className="flex items-center gap-1 text-xs">
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                    simSpeed === speed
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alternative Routes Section */}
      {alternativeRoutes.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.alternativeRoutes}
          </div>
          <div className="space-y-1.5">
            {alternativeRoutes.map(alt => (
              <div
                key={alt.exitId}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{alt.exitId}</span>
                  <span className="text-slate-500 font-mono">({alt.pathNodes.join(' → ')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {t.costShort}: {alt.totalCost}
                  </span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    +{alt.totalCost - routeResult.totalCost}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
