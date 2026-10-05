import React from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { RoomIcon, JunctionIcon, ExitIcon, CorridorIcon, HazardIcon } from './CustomIcons';
import { ShieldCheck, Compass, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

export const InspectorPanel: React.FC = () => {
  const {
    selectedElement,
    startNodeId,
    blockedNodes,
    blockedEdges,
    closedExits,
    setStartNode,
    toggleNodeBlocked,
    toggleEdgeBlocked,
    toggleExitClosed,
    t,
  } = useSimulator();

  if (!selectedElement) {
    return (
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-2 shadow-sm text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          {t.inspectorTitle}
        </div>
        <p className="text-xs text-slate-500 dark:text-neutral-400 py-4">
          {t.inspectorEmpty}
        </p>
      </div>
    );
  }

  const isNode = selectedElement.type === 'node';
  const node = selectedElement.node;
  const edge = selectedElement.edge;

  const isStart = isNode && node?.id === startNodeId;
  const isBlocked = isNode ? blockedNodes.has(node!.id) : blockedEdges.has(edge!.id);
  const isClosed = isNode && node?.type === 'exit' ? closedExits.has(node!.id) : false;

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300">
            {isNode ? (
              node?.type === 'room' ? (
                <RoomIcon className="w-4 h-4" />
              ) : node?.type === 'junction' ? (
                <JunctionIcon className="w-4 h-4" />
              ) : (
                <ExitIcon className="w-4 h-4 text-emerald-500" />
              )
            ) : (
              <CorridorIcon className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              {selectedElement.id}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {isNode
                ? node?.type === 'room'
                  ? t.room
                  : node?.type === 'junction'
                  ? t.junction
                  : t.exit
                : t.corridor}
            </span>
          </div>
        </div>

        {/* State Badge */}
        <div>
          {isStart ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              {t.startState}
            </span>
          ) : isBlocked || isClosed ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
              <HazardIcon className="w-3 h-3" />
              {isClosed ? t.closedState : t.blockedState}
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {t.normalState}
            </span>
          )}
        </div>
      </div>

      {/* Metadata Attributes */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {isNode && node && (
          <>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">{t.elementLabel}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{node.label}</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">Coordinates (x, y)</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {node.x}, {node.y}
              </span>
            </div>
          </>
        )}

        {!isNode && edge && (
          <>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">{t.connection}</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {edge.from} ↔ {edge.to}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 text-[10px] block">{t.elementCost}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {edge.cost}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {isNode && node && node.type !== 'exit' && (
          <button
            onClick={() => setStartNode(node.id)}
            disabled={isStart}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg transition-colors ${
              isStart
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 cursor-default'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isStart ? 'Currently Starting Location' : t.actionSetStart}</span>
          </button>
        )}

        {/* Hazard Toggle Button */}
        {isNode && node && (
          <button
            onClick={() => {
              if (node.type === 'exit') toggleExitClosed(node.id);
              else toggleNodeBlocked(node.id);
            }}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border transition-colors ${
              isBlocked || isClosed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
            }`}
          >
            <HazardIcon className="w-3.5 h-3.5" />
            <span>
              {node.type === 'exit'
                ? isClosed
                  ? t.actionReopenExit
                  : t.actionCloseExit
                : isBlocked
                ? node.type === 'room'
                  ? t.actionUnblockRoom
                  : t.actionUnblockJunction
                : node.type === 'room'
                ? t.actionBlockRoom
                : t.actionBlockJunction}
            </span>
          </button>
        )}

        {!isNode && edge && (
          <button
            onClick={() => toggleEdgeBlocked(edge.id)}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg border transition-colors ${
              isBlocked
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100'
            }`}
          >
            <HazardIcon className="w-3.5 h-3.5" />
            <span>{isBlocked ? t.actionUnblockEdge : t.actionBlockEdge}</span>
          </button>
        )}
      </div>
    </div>
  );
};
