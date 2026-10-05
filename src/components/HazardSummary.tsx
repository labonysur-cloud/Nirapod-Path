import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { Flame, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const HazardSummary: React.FC = () => {
  const {
    blockedNodes,
    blockedEdges,
    closedExits,
    buildingData,
    toggleNodeBlocked,
    toggleEdgeBlocked,
    toggleExitClosed,
    setSelectedElement,
    t,
  } = useSimulator();

  const totalHazards = blockedNodes.size + blockedEdges.size + closedExits.size;
  const nodeMap = new Map(buildingData.nodes.map(n => [n.id, n]));
  const edgeMap = new Map(buildingData.edges.map(e => [e.id, e]));

  if (totalHazards === 0) {
    return (
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-neutral-400 shadow-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>{t.noActiveHazards}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {t.activeHazards}
          </span>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
          {totalHazards} {t.totalHazards.toLowerCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Blocked Nodes */}
        {Array.from(blockedNodes).map(nodeId => {
          const node = nodeMap.get(nodeId);
          return (
            <div
              key={nodeId}
              onClick={() => setSelectedElement({ type: 'node', id: nodeId })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs cursor-pointer hover:border-red-400 transition-colors"
            >
              <span className="font-mono font-bold text-red-700 dark:text-red-300">{nodeId}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                ({node?.type === 'room' ? t.room : t.junction})
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleNodeBlocked(nodeId);
                }}
                className="text-red-400 hover:text-red-700 dark:hover:text-red-200 p-0.5"
                title={t.unblockTooltip}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Blocked Corridors */}
        {Array.from(blockedEdges).map(edgeId => {
          const edge = edgeMap.get(edgeId);
          return (
            <div
              key={edgeId}
              onClick={() => setSelectedElement({ type: 'edge', id: edgeId })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-xs cursor-pointer hover:border-amber-400 transition-colors"
            >
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{edgeId}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                ({edge ? `${edge.from}↔${edge.to}` : t.corridor})
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleEdgeBlocked(edgeId);
                }}
                className="text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 p-0.5"
                title={t.unblockTooltip}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Closed Exits */}
        {Array.from(closedExits).map(exitId => {
          const exitNode = nodeMap.get(exitId);
          return (
            <div
              key={exitId}
              onClick={() => setSelectedElement({ type: 'node', id: exitId })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-xs cursor-pointer hover:border-red-400 transition-colors"
            >
              <span className="font-mono font-bold text-red-700 dark:text-red-300">{exitId}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                ({t.closedState})
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleExitClosed(exitId);
                }}
                className="text-red-400 hover:text-red-700 dark:hover:text-red-200 p-0.5"
                title={t.reopenTooltip}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
