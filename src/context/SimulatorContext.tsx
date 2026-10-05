import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { BuildingData, RouteResult, RouteCandidate, BuildingNode, BuildingEdge, StatHistoryPoint, ActivityLogEntry } from '../types/simulator';
import { OFFICIAL_SAMPLE, PRESET_OPTIONS } from '../data/presets';
import { calculateEvacuationRoute, calculateAlternativeRoutes } from '../utils/routingEngine';
import { Language, translations } from '../i18n/translations';

interface SelectedElementInfo {
  type: 'node' | 'edge';
  id: string;
  node?: BuildingNode;
  edge?: BuildingEdge;
}

interface SimulatorContextType {
  buildingData: BuildingData;
  startNodeId: string | null;
  blockedNodes: Set<string>;
  blockedEdges: Set<string>;
  closedExits: Set<string>;
  routeResult: RouteResult;
  alternativeRoutes: RouteCandidate[];
  selectedElement: SelectedElementInfo | null;
  
  // Theme & i18n
  language: Language;
  theme: 'light' | 'dark';
  highContrast: boolean;
  t: typeof translations['en'];
  
  // Modals & Panels
  isUploadModalOpen: boolean;
  isReportModalOpen: boolean;
  activePresetId: string;
  
  // Walkthrough animation
  isWalking: boolean;
  walkthroughStep: number;
  simSpeed: number;
  
  // Actions
  setLanguage: (lang: Language) => void;
  toggleTheme: () => void;
  toggleHighContrast: () => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsReportModalOpen: (open: boolean) => void;
  loadPreset: (presetId: string) => void;
  loadCustomBuilding: (data: BuildingData) => void;
  setStartNode: (nodeId: string) => void;
  toggleNodeBlocked: (nodeId: string) => void;
  toggleEdgeBlocked: (edgeId: string) => void;
  toggleExitClosed: (exitId: string) => void;
  resetToInitialState: () => void;
  clearAllHazards: () => void;
  setSelectedElement: (element: { type: 'node' | 'edge'; id: string } | null) => void;
  
  // Walkthrough controls
  startWalkthrough: () => void;
  pauseWalkthrough: () => void;
  resetWalkthrough: () => void;
  stepForwardWalkthrough: () => void;
  setSimSpeed: (speed: number) => void;
  
  // Real-time Simulation Statistics
  timeElapsed: number;
  isTimerRunning: boolean;
  totalSafeExits: number;
  totalExits: number;
  reachableSafeExits: number;
  hazardCoveragePercentage: number;
  totalElementsCount: number;
  compromisedElementsCount: number;
  statsHistory: StatHistoryPoint[];
  activityLog: ActivityLogEntry[];
  clearActivityLog: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  
  // Quick benchmark tester
  runBenchmarkScenario: (scenario: 'baseline' | 'blocked_junction' | 'exits_closed' | 'different_start' | 'blocked_start') => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePresetId, setActivePresetId] = useState<string>('official');
  const [buildingData, setBuildingData] = useState<BuildingData>(OFFICIAL_SAMPLE);
  const [startNodeId, setStartNodeId] = useState<string | null>('R1');
  
  // Hazard sets
  const [blockedNodes, setBlockedNodes] = useState<Set<string>>(() => new Set(OFFICIAL_SAMPLE.initial_state.blocked_nodes));
  const [blockedEdges, setBlockedEdges] = useState<Set<string>>(() => new Set(OFFICIAL_SAMPLE.initial_state.blocked_edges));
  const [closedExits, setClosedExits] = useState<Set<string>>(() => new Set(OFFICIAL_SAMPLE.initial_state.closed_exits));

  const [selectedElementMeta, setSelectedElementMeta] = useState<{ type: 'node' | 'edge'; id: string } | null>({ type: 'node', id: 'R1' });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // i18n & Theme state with localStorage persistence
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('smart_escape_lang');
      return (saved === 'bn' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('smart_escape_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smart_escape_hc') === 'true';
    } catch {
      return false;
    }
  });

  // Apply theme to document
  useEffect(() => {
    try {
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'dark') {
        root.classList.add('dark');
        body?.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        body?.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      localStorage.setItem('smart_escape_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_escape_lang', language);
    } catch {
      // ignore
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('smart_escape_hc', String(highContrast));
    } catch {
      // ignore
    }
  }, [highContrast]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleTheme = () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleHighContrast = () => setHighContrast(prev => !prev);

  // Walkthrough animation state
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [walkthroughStep, setWalkthroughStep] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Calculate route reactively
  const routeResult = useMemo(() => {
    return calculateEvacuationRoute(
      buildingData,
      startNodeId,
      blockedNodes,
      blockedEdges,
      closedExits
    );
  }, [buildingData, startNodeId, blockedNodes, blockedEdges, closedExits]);

  // Calculate alternative routes
  const alternativeRoutes = useMemo(() => {
    if (routeResult.status !== 'success' || !routeResult.exitId) return [];
    return calculateAlternativeRoutes(
      buildingData,
      startNodeId,
      blockedNodes,
      blockedEdges,
      closedExits,
      routeResult.exitId
    );
  }, [buildingData, startNodeId, blockedNodes, blockedEdges, closedExits, routeResult]);

  // Handle walkthrough step ticking
  useEffect(() => {
    if (!isWalking || routeResult.status !== 'success' || routeResult.pathNodes.length <= 1) {
      return;
    }

    const intervalMs = Math.max(250, Math.floor(1000 / simSpeed));
    const timer = setInterval(() => {
      setWalkthroughStep(prev => {
        if (prev >= routeResult.pathNodes.length - 1) {
          setIsWalking(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isWalking, routeResult, simSpeed]);

  // Reset walkthrough if route changes
  useEffect(() => {
    setWalkthroughStep(0);
    setIsWalking(false);
  }, [routeResult.pathNodes]);

  // Real-time Simulation Statistics & Timer
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeElapsed(0);
  }, []);

  // Total exits in building
  const totalExits = useMemo(() => {
    return buildingData.nodes.filter(n => n.type === 'exit').length;
  }, [buildingData]);

  // Total safe exits (unblocked & open)
  const totalSafeExits = useMemo(() => {
    return buildingData.nodes.filter(
      n => n.type === 'exit' && !closedExits.has(n.id) && !blockedNodes.has(n.id)
    ).length;
  }, [buildingData, closedExits, blockedNodes]);

  // Reachable safe exits from current start node
  const reachableSafeExits = useMemo(() => {
    if (routeResult.status !== 'success' || !routeResult.exitId) return 0;
    return 1 + alternativeRoutes.length;
  }, [routeResult, alternativeRoutes]);

  // Total elements count
  const totalElementsCount = useMemo(() => {
    return buildingData.nodes.length + buildingData.edges.length;
  }, [buildingData]);

  // Compromised elements count
  const compromisedElementsCount = useMemo(() => {
    return blockedNodes.size + blockedEdges.size + closedExits.size;
  }, [blockedNodes, blockedEdges, closedExits]);

  // Hazard coverage percentage
  const hazardCoveragePercentage = useMemo(() => {
    if (totalElementsCount === 0) return 0;
    return Number(((compromisedElementsCount / totalElementsCount) * 100).toFixed(1));
  }, [compromisedElementsCount, totalElementsCount]);

  // Real-time telemetry history for sparkline
  const [statsHistory, setStatsHistory] = useState<StatHistoryPoint[]>(() => [
    {
      time: 0,
      timeLabel: '00:00',
      hazardCoverage: 0,
      routeCost: 7,
      safeExits: 2,
    },
  ]);

  useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeLabel = `${pad(Math.floor((timeElapsed % 3600) / 60))}:${pad(timeElapsed % 60)}`;
    const cost = routeResult.status === 'success' ? routeResult.totalCost : 0;

    setStatsHistory(prev => {
      const last = prev[prev.length - 1];
      if (
        last &&
        last.time === timeElapsed &&
        last.hazardCoverage === hazardCoveragePercentage &&
        last.routeCost === cost &&
        last.safeExits === totalSafeExits
      ) {
        return prev;
      }
      const newPoint: StatHistoryPoint = {
        time: timeElapsed,
        timeLabel,
        hazardCoverage: hazardCoveragePercentage,
        routeCost: cost,
        safeExits: totalSafeExits,
      };
      const updated = [...prev, newPoint];
      return updated.length > 25 ? updated.slice(updated.length - 25) : updated;
    });
  }, [timeElapsed, hazardCoveragePercentage, routeResult.totalCost, routeResult.status, totalSafeExits]);

  // Activity Log State for Audit Transparency
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => [
    {
      id: 'init-1',
      timestamp: Date.now() - 1000,
      timeLabel: '00:00',
      category: 'system',
      severity: 'info',
      title: 'Simulation system initialized',
      titleBn: 'সিমুলেশন সিস্টেম চালু হয়েছে',
      details: 'East Annex - Practice Building dataset loaded (8 nodes, 9 corridors, 2 exits).',
      detailsBn: '৮টি নোড, ৯টি করিডোর এবং ২টি জরুরি নির্গমন লোড করা হয়েছে।',
    },
    {
      id: 'init-2',
      timestamp: Date.now(),
      timeLabel: '00:00',
      category: 'route',
      severity: 'success',
      title: 'Initial escape route computed: R1 → E1',
      titleBn: 'প্রাথমিক নির্গমন পথ নির্ধারিত: R1 → E1',
      details: 'Optimal sequence: R1 - C1 - C2 - E1 | Total Cost: 7',
      detailsBn: 'সর্বনিম্ন ব্যয়ের পথ: R1 - C1 - C2 - E1 | কস্ট: ৭',
    },
  ]);

  const logEvent = useCallback((event: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'timeLabel'>) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeLabel = `${pad(Math.floor((timeElapsed % 3600) / 60))}:${pad(timeElapsed % 60)}`;
    const newEntry: ActivityLogEntry = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      timeLabel,
    };
    setActivityLog(prev => [newEntry, ...prev.slice(0, 49)]);
  }, [timeElapsed]);

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  // Track route recalculations
  useEffect(() => {
    if (!startNodeId) return;

    if (routeResult.status === 'success' && routeResult.pathNodes.length > 0) {
      logEvent({
        category: 'route',
        severity: 'success',
        title: `Optimal evacuation route: ${routeResult.pathNodes[0]} → ${routeResult.exitId}`,
        titleBn: `সর্বনিম্ন ব্যয়ের রুট নির্ধারিত: ${routeResult.pathNodes[0]} → ${routeResult.exitId}`,
        details: `Path: ${routeResult.pathNodes.join(' - ')} | Total Cost: ${routeResult.totalCost}`,
        detailsBn: `পথ: ${routeResult.pathNodes.join(' - ')} | মোট কস্ট: ${routeResult.totalCost}`,
      });
    } else if (routeResult.status === 'no_route') {
      logEvent({
        category: 'route',
        severity: 'critical',
        title: 'Evacuation Alert: No route available',
        titleBn: 'জরুরি সতর্কতা: কোনো পথ উপলব্ধ নেই',
        details: 'All paths to emergency exits are obstructed by active hazards or exits are closed.',
        detailsBn: 'সকল জরুরি নির্গমন পথ বিপত্তির কারণে অবরুদ্ধ অথবা নির্গমনসমূহ বন্ধ রয়েছে।',
      });
    } else if (routeResult.status === 'start_blocked') {
      logEvent({
        category: 'route',
        severity: 'critical',
        title: `Evacuation Alert: Starting location ${startNodeId} is blocked`,
        titleBn: `জরুরি সতর্কতা: শুরুর অবস্থান ${startNodeId} অবরুদ্ধ`,
        details: 'Current start location is inside an active hazard zone.',
        detailsBn: 'বর্তমান শুরুর অবস্থানটি একটি সক্রিয় বিপত্তি অঞ্চলের অন্তর্ভুক্ত।',
      });
    }
  }, [routeResult.status, routeResult.totalCost, routeResult.exitId, routeResult.pathNodes.join(','), startNodeId, logEvent]);

  // Load a preset
  const loadPreset = useCallback((presetId: string) => {
    const found = PRESET_OPTIONS.find(p => p.id === presetId);
    if (!found) return;

    setActivePresetId(presetId);
    setBuildingData(found.data);
    setBlockedNodes(new Set(found.data.initial_state.blocked_nodes));
    setBlockedEdges(new Set(found.data.initial_state.blocked_edges));
    setClosedExits(new Set(found.data.initial_state.closed_exits));

    // Choose first room or junction as start
    const defaultStart = found.data.nodes.find(n => (n.type === 'room' || n.type === 'junction') && !found.data.initial_state.blocked_nodes.includes(n.id));
    if (defaultStart) {
      setStartNodeId(defaultStart.id);
      setSelectedElementMeta({ type: 'node', id: defaultStart.id });
    } else {
      setStartNodeId(null);
    }

    logEvent({
      category: 'system',
      severity: 'info',
      title: `Building dataset loaded: ${found.data.building}`,
      titleBn: `বিল্ডিং ডেটাসেট লোড করা হয়েছে: ${found.data.building}`,
      details: `${found.data.nodes.length} nodes, ${found.data.edges.length} corridors.`,
      detailsBn: `${found.data.nodes.length}টি নোড, ${found.data.edges.length}টি করিডোর।`,
    });
  }, [logEvent]);

  // Load custom verified building data
  const loadCustomBuilding = useCallback((data: BuildingData) => {
    setActivePresetId('custom');
    setBuildingData(data);
    setBlockedNodes(new Set(data.initial_state.blocked_nodes));
    setBlockedEdges(new Set(data.initial_state.blocked_edges));
    setClosedExits(new Set(data.initial_state.closed_exits));

    const defaultStart = data.nodes.find(n => (n.type === 'room' || n.type === 'junction') && !data.initial_state.blocked_nodes.includes(n.id));
    if (defaultStart) {
      setStartNodeId(defaultStart.id);
      setSelectedElementMeta({ type: 'node', id: defaultStart.id });
    } else {
      setStartNodeId(null);
    }

    logEvent({
      category: 'system',
      severity: 'info',
      title: `Custom building map imported: ${data.building}`,
      titleBn: `কাস্টম ম্যাপ লোড করা হয়েছে: ${data.building}`,
      details: `Validated schema: ${data.nodes.length} nodes, ${data.edges.length} corridors.`,
      detailsBn: `যাচাইকৃত ডেটা: ${data.nodes.length}টি নোড, ${data.edges.length}টি করিডোর।`,
    });
  }, [logEvent]);

  const setStartNode = useCallback((nodeId: string) => {
    const node = buildingData.nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'exit') return;
    setStartNodeId(nodeId);
    setSelectedElementMeta({ type: 'node', id: nodeId });
    logEvent({
      category: 'start',
      severity: 'info',
      title: `Evacuation start set to ${node.id} (${node.label})`,
      titleBn: `ইভাকুয়েশন শুরুর স্থান ${node.id} (${node.label}) নির্ধারণ`,
      details: `Type: ${node.type}`,
      detailsBn: `ধরন: ${node.type === 'room' ? 'কক্ষ' : 'সংযোগস্থল'}`,
    });
  }, [buildingData, logEvent]);

  const toggleNodeBlocked = useCallback((nodeId: string) => {
    const node = buildingData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'exit') {
      const willClose = !closedExits.has(nodeId);
      setClosedExits(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        return next;
      });
      logEvent({
        category: 'hazard',
        severity: willClose ? 'warning' : 'success',
        title: willClose ? `Emergency Exit ${node.id} closed` : `Emergency Exit ${node.id} reopened`,
        titleBn: willClose ? `জরুরি নির্গমন ${node.id} বন্ধ করা হয়েছে` : `জরুরি নির্গমন ${node.id} পুনরায় খোলা হয়েছে`,
        details: willClose ? 'Exit marked unavailable' : 'Exit restored to open nominal status',
        detailsBn: willClose ? 'নির্গমন পথটি বন্ধ' : 'নির্গমন পথটি পুনরায় উন্মুক্ত',
      });
    } else {
      const willBlock = !blockedNodes.has(nodeId);
      setBlockedNodes(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        return next;
      });
      logEvent({
        category: 'hazard',
        severity: willBlock ? 'critical' : 'success',
        title: willBlock ? `Hazard detected: ${node.type === 'room' ? 'Room' : 'Junction'} ${node.id} blocked` : `${node.type === 'room' ? 'Room' : 'Junction'} ${node.id} cleared`,
        titleBn: willBlock ? `বিপত্তি: ${node.id} অবরুদ্ধ করা হয়েছে` : `${node.id} বিপত্তি মুক্ত করা হয়েছে`,
        details: willBlock ? `Corridors attached to ${node.id} severed.` : `Normal traversal restored through ${node.id}.`,
        detailsBn: willBlock ? `${node.id}-এর সাথে যুক্ত পথসমূহ বিচ্ছিন্ন।` : `${node.id} স্বাভাবিক অবস্থায় ফিরেছে।`,
      });
    }
  }, [buildingData, closedExits, blockedNodes, logEvent]);

  const toggleEdgeBlocked = useCallback((edgeId: string) => {
    const edge = buildingData.edges.find(e => e.id === edgeId);
    const willBlock = !blockedEdges.has(edgeId);
    setBlockedEdges(prev => {
      const next = new Set(prev);
      if (next.has(edgeId)) next.delete(edgeId);
      else next.add(edgeId);
      return next;
    });
    logEvent({
      category: 'hazard',
      severity: willBlock ? 'warning' : 'success',
      title: willBlock ? `Corridor ${edgeId} (${edge?.from} ↔ ${edge?.to}) blocked` : `Corridor ${edgeId} (${edge?.from} ↔ ${edge?.to}) cleared`,
      titleBn: willBlock ? `করিডোর ${edgeId} (${edge?.from} ↔ ${edge?.to}) অবরুদ্ধ` : `করিডোর ${edgeId} (${edge?.from} ↔ ${edge?.to}) উন্মুক্ত`,
      details: willBlock ? `Cost: ${edge?.cost || 0}. Pathway unusable.` : `Cost: ${edge?.cost || 0}. Pathway open.`,
      detailsBn: willBlock ? `কস্ট: ${edge?.cost || 0}। পথ অবরুদ্ধ।` : `কস্ট: ${edge?.cost || 0}। পথ উন্মুক্ত।`,
    });
  }, [buildingData.edges, blockedEdges, logEvent]);

  const toggleExitClosed = useCallback((exitId: string) => {
    const willClose = !closedExits.has(exitId);
    setClosedExits(prev => {
      const next = new Set(prev);
      if (next.has(exitId)) next.delete(exitId);
      else next.add(exitId);
      return next;
    });
    logEvent({
      category: 'hazard',
      severity: willClose ? 'warning' : 'success',
      title: willClose ? `Emergency Exit ${exitId} closed` : `Emergency Exit ${exitId} reopened`,
      titleBn: willClose ? `জরুরি নির্গমন ${exitId} বন্ধ` : `জরুরি নির্গমন ${exitId} পুনরায় খোলা`,
    });
  }, [closedExits, logEvent]);

  const resetToInitialState = useCallback(() => {
    setBlockedNodes(new Set(buildingData.initial_state.blocked_nodes));
    setBlockedEdges(new Set(buildingData.initial_state.blocked_edges));
    setClosedExits(new Set(buildingData.initial_state.closed_exits));
    setWalkthroughStep(0);
    setIsWalking(false);
    logEvent({
      category: 'system',
      severity: 'info',
      title: 'Hazards reset to initial dataset state',
      titleBn: 'বিপত্তিসমূহ ডেটাসেটের প্রাথমিক অবস্থায় রিসেট',
      details: `Restored baseline hazards for ${buildingData.building}.`,
      detailsBn: `${buildingData.building}-এর জন্য প্রাথমিক অবস্থা পুনর্বহাল।`,
    });
  }, [buildingData, logEvent]);

  const clearAllHazards = useCallback(() => {
    setBlockedNodes(new Set());
    setBlockedEdges(new Set());
    setClosedExits(new Set());
    setWalkthroughStep(0);
    setIsWalking(false);
    logEvent({
      category: 'hazard',
      severity: 'success',
      title: 'All simulated hazards cleared',
      titleBn: 'সকল কৃত্রিম বিপত্তি মুছে ফেলা হয়েছে',
      details: 'All pathways restored to nominal status.',
      detailsBn: 'সকল পথ স্বাভাবিক অবস্থায় ফিরিয়ে আনা হয়েছে।',
    });
  }, [logEvent]);

  // Walkthrough methods
  const startWalkthrough = useCallback(() => {
    if (routeResult.status !== 'success') return;
    if (walkthroughStep >= routeResult.pathNodes.length - 1) {
      setWalkthroughStep(0);
    }
    setIsWalking(true);
  }, [routeResult, walkthroughStep]);

  const pauseWalkthrough = useCallback(() => {
    setIsWalking(false);
  }, []);

  const resetWalkthrough = useCallback(() => {
    setIsWalking(false);
    setWalkthroughStep(0);
  }, []);

  const stepForwardWalkthrough = useCallback(() => {
    if (routeResult.status !== 'success') return;
    setIsWalking(false);
    setWalkthroughStep(prev => (prev < routeResult.pathNodes.length - 1 ? prev + 1 : prev));
  }, [routeResult]);

  // Benchmark scenario runner (Exact official tests from Page 3)
  const runBenchmarkScenario = useCallback((scenario: 'baseline' | 'blocked_junction' | 'exits_closed' | 'different_start' | 'blocked_start') => {
    // Ensure official sample is loaded first
    setBuildingData(OFFICIAL_SAMPLE);
    setActivePresetId('official');

    switch (scenario) {
      case 'baseline':
        // Select R1; starts from initial_state
        setBlockedNodes(new Set(OFFICIAL_SAMPLE.initial_state.blocked_nodes));
        setBlockedEdges(new Set(OFFICIAL_SAMPLE.initial_state.blocked_edges));
        setClosedExits(new Set(OFFICIAL_SAMPLE.initial_state.closed_exits));
        setStartNodeId('R1');
        setSelectedElementMeta({ type: 'node', id: 'R1' });
        break;

      case 'blocked_junction':
        // Select R1; block C2
        setBlockedNodes(new Set(['C2']));
        setBlockedEdges(new Set());
        setClosedExits(new Set());
        setStartNodeId('R1');
        setSelectedElementMeta({ type: 'node', id: 'C2' });
        break;

      case 'exits_closed':
        // Select R1; close E1 and E2
        setBlockedNodes(new Set());
        setBlockedEdges(new Set());
        setClosedExits(new Set(['E1', 'E2']));
        setStartNodeId('R1');
        setSelectedElementMeta({ type: 'node', id: 'E1' });
        break;

      case 'different_start':
        // Select R2
        setBlockedNodes(new Set());
        setBlockedEdges(new Set());
        setClosedExits(new Set());
        setStartNodeId('R2');
        setSelectedElementMeta({ type: 'node', id: 'R2' });
        break;

      case 'blocked_start':
        // Select R1; then block R1
        setBlockedNodes(new Set(['R1']));
        setBlockedEdges(new Set());
        setClosedExits(new Set());
        setStartNodeId('R1');
        setSelectedElementMeta({ type: 'node', id: 'R1' });
        break;
    }
  }, []);

  const selectedElement = useMemo((): SelectedElementInfo | null => {
    if (!selectedElementMeta) return null;
    if (selectedElementMeta.type === 'node') {
      const node = buildingData.nodes.find(n => n.id === selectedElementMeta.id);
      return node ? { type: 'node', id: node.id, node } : null;
    } else {
      const edge = buildingData.edges.find(e => e.id === selectedElementMeta.id);
      return edge ? { type: 'edge', id: edge.id, edge } : null;
    }
  }, [selectedElementMeta, buildingData]);

  const value = {
    buildingData,
    startNodeId,
    blockedNodes,
    blockedEdges,
    closedExits,
    routeResult,
    alternativeRoutes,
    selectedElement,
    language,
    theme,
    highContrast,
    t: translations[language],
    isUploadModalOpen,
    activePresetId,
    isWalking,
    walkthroughStep,
    simSpeed,
    setLanguage,
    toggleTheme,
    toggleHighContrast,
    setIsUploadModalOpen,
    isReportModalOpen,
    setIsReportModalOpen,
    loadPreset,
    loadCustomBuilding,
    setStartNode,
    toggleNodeBlocked,
    toggleEdgeBlocked,
    toggleExitClosed,
    resetToInitialState,
    clearAllHazards,
    setSelectedElement: setSelectedElementMeta,
    startWalkthrough,
    pauseWalkthrough,
    resetWalkthrough,
    stepForwardWalkthrough,
    setSimSpeed,
    runBenchmarkScenario,
    timeElapsed,
    isTimerRunning,
    totalSafeExits,
    totalExits,
    reachableSafeExits,
    hazardCoveragePercentage,
    totalElementsCount,
    compromisedElementsCount,
    statsHistory,
    activityLog,
    clearActivityLog,
    toggleTimer,
    resetTimer,
  };

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
};

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
