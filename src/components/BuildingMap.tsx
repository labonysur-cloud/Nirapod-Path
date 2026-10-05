import React, { useRef, useState, useMemo } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { RoomIcon, JunctionIcon, ExitIcon, HazardIcon, EvacueeIcon } from './CustomIcons';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, ShieldAlert, Flame } from 'lucide-react';

export const BuildingMap: React.FC = () => {
  const {
    buildingData,
    startNodeId,
    blockedNodes,
    blockedEdges,
    closedExits,
    routeResult,
    selectedElement,
    setSelectedElement,
    setStartNode,
    toggleNodeBlocked,
    toggleEdgeBlocked,
    toggleExitClosed,
    walkthroughStep,
    isWalking,
    t,
    highContrast,
  } = useSimulator();

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Heatmap layer visibility state
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Zoom and Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute bounding box for viewbox
  const bounds = useMemo(() => {
    if (!buildingData.nodes.length) {
      return { minX: 0, minY: 0, width: 800, height: 500 };
    }
    const xs = buildingData.nodes.map(n => n.x);
    const ys = buildingData.nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const pad = 90;
    const width = Math.max(maxX - minX + pad * 2, 600);
    const height = Math.max(maxY - minY + pad * 2, 400);

    return {
      minX: minX - pad,
      minY: minY - pad,
      width,
      height,
    };
  }, [buildingData]);

  // Lookup map for fast node coordinates
  const nodeLookup = useMemo(() => {
    return new Map(buildingData.nodes.map(n => [n.id, n]));
  }, [buildingData.nodes]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Only pan if clicked on background svg
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.getAttribute('data-bg') === 'true') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node position helper
  const getNodePos = (id: string) => {
    const n = nodeLookup.get(id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  // Check if edge is on the active route
  const isEdgeInRoute = (edgeId: string) => {
    return routeResult.status === 'success' && routeResult.pathEdges.includes(edgeId);
  };

  // Check if node is on the active route
  const isNodeInRoute = (nodeId: string) => {
    return routeResult.status === 'success' && routeResult.pathNodes.includes(nodeId);
  };

  // Current walker position
  const walkerNodeId = routeResult.status === 'success' && routeResult.pathNodes.length > 0
    ? routeResult.pathNodes[Math.min(walkthroughStep, routeResult.pathNodes.length - 1)]
    : null;
  const walkerPos = walkerNodeId ? getNodePos(walkerNodeId) : null;

  // Compute hazard intensity for each node: 0 (safe green) to 1.0 (critical deep red)
  const nodeHazardIntensity = useMemo(() => {
    const intensityMap = new Map<string, number>();

    const incidentEdges = new Map<string, string[]>();
    const neighbors = new Map<string, string[]>();
    for (const node of buildingData.nodes) {
      incidentEdges.set(node.id, []);
      neighbors.set(node.id, []);
    }
    for (const edge of buildingData.edges) {
      incidentEdges.get(edge.from)?.push(edge.id);
      incidentEdges.get(edge.to)?.push(edge.id);
      neighbors.get(edge.from)?.push(edge.to);
      neighbors.get(edge.to)?.push(edge.from);
    }

    for (const node of buildingData.nodes) {
      if (blockedNodes.has(node.id) || closedExits.has(node.id)) {
        intensityMap.set(node.id, 1.0);
        continue;
      }

      let score = 0;
      // Proximity to blocked edges
      const edges = incidentEdges.get(node.id) || [];
      for (const eid of edges) {
        if (blockedEdges.has(eid)) {
          score += 0.35;
        }
      }

      // Proximity to blocked neighbor nodes
      const nbrs = neighbors.get(node.id) || [];
      for (const nbrId of nbrs) {
        if (blockedNodes.has(nbrId) || closedExits.has(nbrId)) {
          score += 0.30;
        }
      }

      intensityMap.set(node.id, Math.min(1.0, score));
    }

    return intensityMap;
  }, [buildingData, blockedNodes, blockedEdges, closedExits]);

  const getHeatmapColor = (intensity: number) => {
    if (intensity >= 0.75) return '#DC2626'; // critical deep red
    if (intensity >= 0.45) return '#EA580C'; // high orange-red
    if (intensity >= 0.2) return '#F59E0B'; // moderate amber
    return '#10B981'; // safe green
  };

  return (
    <div className="relative w-full h-full min-h-[480px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col select-none shadow-sm">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {buildingData.building}
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-xs text-slate-400 tabular-nums">
          {buildingData.nodes.length} Nodes · {buildingData.edges.length} Corridors
        </span>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-md">
        {/* Heatmap Toggle Button */}
        <button
          onClick={() => setShowHeatmap(prev => !prev)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
            showHeatmap
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
          }`}
          title={t.heatmapToggle}
          aria-label={t.heatmapToggle}
        >
          <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-red-400 fill-red-400/20' : 'text-slate-400'}`} />
          <span className="text-[11px] hidden sm:inline">{t.heatmapToggle}</span>
        </button>

        <div className="w-px h-4 bg-slate-700/80 mx-0.5" />

        <button
          onClick={() => handleZoom(0.2)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded transition-colors"
          title={t.zoomIn}
          aria-label={t.zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded transition-colors"
          title={t.zoomOut}
          aria-label={t.zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded transition-colors"
          title={t.resetView}
          aria-label={t.resetView}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={`w-full h-full flex-1 cursor-${isPanning ? 'grabbing' : 'grab'}`}
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          </pattern>

          {/* Glow filter for active route */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Heatmap blur filter */}
          <filter id="heatmapBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="28" />
          </filter>

          {/* Arrow marker for evacuation flow */}
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect
          data-bg="true"
          x={bounds.minX - 500}
          y={bounds.minY - 500}
          width={bounds.width + 1000}
          height={bounds.height + 1000}
          fill="url(#grid)"
        />

        {/* Transformed Content Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center' }}>
          
          {/* HEATMAP HAZARD INTENSITY OVERLAY LAYER */}
          {showHeatmap && (
            <g className="heatmap-layer pointer-events-none transition-opacity duration-300" opacity="0.85" filter="url(#heatmapBlur)">
              {/* Corridor hazard thermal lines */}
              {buildingData.edges.map(edge => {
                if (!blockedEdges.has(edge.id)) return null;
                const fromPos = getNodePos(edge.from);
                const toPos = getNodePos(edge.to);
                return (
                  <line
                    key={`heat-edge-${edge.id}`}
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="#EF4444"
                    strokeWidth="54"
                    strokeLinecap="round"
                    opacity="0.80"
                  />
                );
              })}

              {/* Node hazard thermal glow circles */}
              {buildingData.nodes.map(node => {
                const pos = getNodePos(node.id);
                const intensity = nodeHazardIntensity.get(node.id) || 0;
                const color = getHeatmapColor(intensity);
                const radius = intensity >= 0.75 ? 90 : intensity >= 0.3 ? 72 : 54;
                const opacity = intensity >= 0.75 ? 0.85 : intensity >= 0.3 ? 0.65 : 0.28;

                return (
                  <circle
                    key={`heat-node-${node.id}`}
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={color}
                    opacity={opacity}
                  />
                );
              })}
            </g>
          )}

          {/* EDGES (Corridors) LAYER */}
          {buildingData.edges.map(edge => {
            const fromPos = getNodePos(edge.from);
            const toPos = getNodePos(edge.to);
            const isBlocked = blockedEdges.has(edge.id);
            const inRoute = isEdgeInRoute(edge.id);
            const isSelected = selectedElement?.type === 'edge' && selectedElement.id === edge.id;

            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;

            // Stroke style calculation
            let strokeColor = '#334155'; // default slate-700
            let strokeWidth = 3;
            let strokeDasharray = undefined;

            if (isBlocked) {
              strokeColor = '#EF4444'; // red-500
              strokeWidth = 3.5;
              strokeDasharray = '6 4';
            } else if (inRoute) {
              strokeColor = highContrast ? '#22C55E' : '#10B981'; // emerald-500
              strokeWidth = 5;
            }

            if (isSelected) {
              strokeColor = inRoute ? '#34D399' : '#38BDF8'; // light blue / bright emerald
            }

            return (
              <g key={edge.id} className="cursor-pointer group">
                {/* Invisible fat hit area for easy clicking */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="transparent"
                  strokeWidth="20"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'edge', id: edge.id });
                  }}
                />

                {/* Route Glow if in active path */}
                {inRoute && !isBlocked && (
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    filter="url(#routeGlow)"
                  />
                )}

                {/* Visible corridor line */}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className="transition-colors duration-150"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'edge', id: edge.id });
                  }}
                />

                {/* Edge Cost Badge at midpoint */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedElement({ type: 'edge', id: edge.id });
                  }}
                >
                  <rect
                    x="-14"
                    y="-11"
                    width="28"
                    height="22"
                    rx="4"
                    fill={isBlocked ? '#450A0A' : inRoute ? '#064E3B' : '#1E293B'}
                    stroke={isBlocked ? '#DC2626' : inRoute ? '#10B981' : isSelected ? '#38BDF8' : '#475569'}
                    strokeWidth="1.5"
                    className="transition-colors group-hover:scale-110"
                  />
                  {isBlocked ? (
                    <g transform="translate(-6, -6)">
                      <line x1="1" y1="1" x2="11" y2="11" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                      <line x1="11" y1="1" x2="1" y2="11" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={inRoute ? '#A7F3D0' : '#E2E8F0'}
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                    >
                      {edge.cost}
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          {/* NODES LAYER */}
          {buildingData.nodes.map(node => {
            const isStart = startNodeId === node.id;
            const isBlocked = blockedNodes.has(node.id);
            const isClosed = closedExits.has(node.id);
            const inRoute = isNodeInRoute(node.id);
            const isSelected = selectedElement?.type === 'node' && selectedElement.id === node.id;
            const isWalkerHere = walkerNodeId === node.id;

            const handleNodeClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedElement({ type: 'node', id: node.id });
            };

            const handleDoubleClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (node.type === 'exit') {
                toggleExitClosed(node.id);
              } else {
                toggleNodeBlocked(node.id);
              }
            };

            // Order in route
            const routeIndex = routeResult.status === 'success' ? routeResult.pathNodes.indexOf(node.id) : -1;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={handleNodeClick}
                onDoubleClick={handleDoubleClick}
                className="cursor-pointer group"
              >
                {/* Beacon Pulse for Start Node */}
                {isStart && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeOpacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Outer Selection Ring */}
                {isSelected && (
                  <circle
                    r="32"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}

                {/* NODE GEOMETRY BY TYPE */}
                {node.type === 'room' && (
                  <g>
                    {/* Room: Rounded Square */}
                    <rect
                      x="-24"
                      y="-24"
                      width="48"
                      height="48"
                      rx="8"
                      fill={
                        isBlocked
                          ? '#450A0A'
                          : isStart
                          ? '#0369A1'
                          : inRoute
                          ? '#064E3B'
                          : '#1E293B'
                      }
                      stroke={
                        isBlocked
                          ? '#EF4444'
                          : isStart
                          ? '#38BDF8'
                          : inRoute
                          ? '#10B981'
                          : '#475569'
                      }
                      strokeWidth={isStart || inRoute || isBlocked ? '2.5' : '1.5'}
                      className="transition-all duration-150 group-hover:scale-105"
                    />
                    {isBlocked ? (
                      <g transform="translate(-9, -9) scale(0.75)">
                        <path d="m12 2 10 18H2L12 2z" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="2" />
                        <line x1="12" y1="9" x2="12" y2="13" stroke="#EF4444" strokeWidth="2" />
                        <circle cx="12" cy="17" r="1" fill="#EF4444" />
                      </g>
                    ) : (
                      <g transform="translate(-8, -14) scale(0.65)" stroke={isStart ? '#E0F2FE' : '#94A3B8'}>
                        <rect x="3" y="3" width="18" height="18" rx="2" fill="none" strokeWidth="2" />
                        <path d="M3 9h18" strokeWidth="2" />
                        <path d="M9 21V9" strokeWidth="2" />
                      </g>
                    )}
                  </g>
                )}

                {node.type === 'junction' && (
                  <g>
                    {/* Junction: Circle */}
                    <circle
                      r="22"
                      fill={
                        isBlocked
                          ? '#450A0A'
                          : isStart
                          ? '#0369A1'
                          : inRoute
                          ? '#064E3B'
                          : '#1E293B'
                      }
                      stroke={
                        isBlocked
                          ? '#EF4444'
                          : isStart
                          ? '#38BDF8'
                          : inRoute
                          ? '#10B981'
                          : '#475569'
                      }
                      strokeWidth={isStart || inRoute || isBlocked ? '2.5' : '1.5'}
                      className="transition-all duration-150 group-hover:scale-105"
                    />
                    {isBlocked ? (
                      <g transform="translate(-8, -8) scale(0.65)">
                        <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                        <line x1="22" y1="2" x2="2" y2="22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                      </g>
                    ) : (
                      <g transform="translate(-8, -8) scale(0.65)" stroke={isStart ? '#E0F2FE' : '#94A3B8'}>
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                        <path d="M12 2v5 M12 17v5 M2 12h5 M17 12h5" strokeWidth="2.5" />
                      </g>
                    )}
                  </g>
                )}

                {node.type === 'exit' && (
                  <g>
                    {/* Exit: Portal / Hexagon style door */}
                    <rect
                      x="-25"
                      y="-25"
                      width="50"
                      height="50"
                      rx="10"
                      fill={
                        isClosed
                          ? '#450A0A'
                          : inRoute
                          ? '#064E3B'
                          : '#022C22'
                      }
                      stroke={
                        isClosed
                          ? '#EF4444'
                          : inRoute
                          ? '#10B981'
                          : '#059669'
                      }
                      strokeWidth={inRoute || isClosed ? '3' : '2'}
                      className="transition-all duration-150 group-hover:scale-105"
                    />
                    {isClosed ? (
                      <g transform="translate(-10, -10) scale(0.8)">
                        <line x1="2" y1="2" x2="22" y2="22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                        <line x1="22" y1="2" x2="2" y2="22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                      </g>
                    ) : (
                      <g transform="translate(-10, -10) scale(0.8)" stroke="#34D399" fill="none">
                        <path d="M14 3v18 M10 21V3 M4 3h10v18H4z" strokeWidth="2" />
                        <path d="M18 12h-4 M15 9l3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    )}
                  </g>
                )}

                {/* Node ID Label inside/below */}
                <text
                  y={node.type === 'room' ? 12 : node.type === 'junction' ? 8 : 14}
                  textAnchor="middle"
                  fill={
                    isBlocked || isClosed
                      ? '#FCA5A5'
                      : isStart
                      ? '#E0F2FE'
                      : inRoute
                      ? '#D1FAE5'
                      : '#E2E8F0'
                  }
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {node.id}
                </text>

                {/* Secondary Node Name Label underneath */}
                <text
                  y="36"
                  textAnchor="middle"
                  fill={isSelected ? '#38BDF8' : '#94A3B8'}
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {node.label}
                </text>

                {/* Route Step Indicator Pill */}
                {routeIndex >= 0 && (
                  <g transform="translate(18, -18)">
                    <circle r="9" fill="#10B981" stroke="#064E3B" strokeWidth="1.5" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="700"
                    >
                      {routeIndex + 1}
                    </text>
                  </g>
                )}

                {/* Status Badges */}
                {isStart && (
                  <g transform="translate(-24, -34)">
                    <rect x="0" y="0" width="48" height="14" rx="3" fill="#0284C7" />
                    <text
                      x="24"
                      y="10"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="700"
                      letterSpacing="0.05em"
                    >
                      START
                    </text>
                  </g>
                )}

                {(isBlocked || isClosed) && (
                  <g transform="translate(-26, -34)">
                    <rect x="0" y="0" width="52" height="14" rx="3" fill="#DC2626" />
                    <text
                      x="26"
                      y="10"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="700"
                      letterSpacing="0.05em"
                    >
                      {node.type === 'exit' ? 'CLOSED' : 'BLOCKED'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ACTIVE SIMULATION WALKER (Evacuee Moving Dot) */}
          {walkerPos && (
            <g
              transform={`translate(${walkerPos.x}, ${walkerPos.y})`}
              className="transition-all duration-300 pointer-events-none"
            >
              <circle r="16" fill="#F59E0B" fillOpacity="0.3" className="animate-ping" />
              <circle r="12" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
              <g transform="translate(-7, -7) scale(0.6)" fill="#FFFFFF" stroke="#FFFFFF">
                <circle cx="12" cy="5" r="2.5" />
                <path d="m9 20 2-7-3-2V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3l-3 2 2 7" strokeWidth="2" />
              </g>
            </g>
          )}
        </g>
      </svg>

      {/* Map Footer Bar: Legend & Shortcuts */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-500 inline-block" />
            <span>{t.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500 inline-block" />
            <span>{t.junction}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-900 border border-emerald-500 inline-block" />
            <span className="text-emerald-400 font-medium">{t.exit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-950 border border-red-500 inline-block" />
            <span className="text-red-400 font-medium">{t.blockedState}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-emerald-500 rounded inline-block" />
            <span className="text-emerald-300 font-medium">{t.pathState}</span>
          </div>

          {/* Heatmap Gradient Legend */}
          {showHeatmap && (
            <div className="flex items-center gap-2 border-l border-slate-700/80 pl-3">
              <span className="text-[11px] font-semibold text-slate-400">{t.heatmapToggle}:</span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-emerald-400">{t.heatmapSafe}</span>
                <div
                  className="w-14 h-2 rounded-full shadow-inner"
                  style={{ background: 'linear-gradient(to right, #10B981, #F59E0B, #DC2626)' }}
                />
                <span className="text-red-400">{t.heatmapCritical}</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Click node to select · Double-click to toggle hazard · Drag to pan
        </div>
      </div>
    </div>
  );
};
