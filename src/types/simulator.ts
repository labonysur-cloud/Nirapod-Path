export type NodeType = 'room' | 'junction' | 'exit';

export interface BuildingNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

export interface BuildingEdge {
  id: string;
  from: string;
  to: string;
  cost: number;
}

export interface InitialState {
  blocked_nodes: string[];
  blocked_edges: string[];
  closed_exits: string[];
}

export interface BuildingData {
  building: string;
  nodes: BuildingNode[];
  edges: BuildingEdge[];
  initial_state: InitialState;
}

export interface RouteResult {
  status: 'success' | 'no_route' | 'start_blocked';
  pathNodes: string[];
  pathEdges: string[];
  exitId: string | null;
  totalCost: number;
  message?: string;
  stepDetails?: Array<{
    from: string;
    to: string;
    edgeId: string;
    cost: number;
    cumulativeCost: number;
  }>;
}

export interface RouteCandidate {
  pathNodes: string[];
  pathEdges: string[];
  exitId: string;
  totalCost: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: BuildingData;
}

export interface StatHistoryPoint {
  time: number;
  timeLabel: string;
  hazardCoverage: number;
  routeCost: number;
  safeExits: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  timeLabel: string;
  category: 'hazard' | 'route' | 'start' | 'system';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  titleBn: string;
  details?: string;
  detailsBn?: string;
}

