import { BuildingData } from '../types/simulator';

export const OFFICIAL_SAMPLE: BuildingData = {
  building: 'East Annex - Practice Building',
  nodes: [
    { id: 'R1', label: 'Room 101', type: 'room', x: 60, y: 65 },
    { id: 'R2', label: 'Room 102', type: 'room', x: 60, y: 185 },
    { id: 'C1', label: 'Junction A', type: 'junction', x: 190, y: 65 },
    { id: 'C2', label: 'Junction B', type: 'junction', x: 325, y: 65 },
    { id: 'C3', label: 'Junction C', type: 'junction', x: 190, y: 185 },
    { id: 'C4', label: 'Junction D', type: 'junction', x: 325, y: 185 },
    { id: 'E1', label: 'North Exit', type: 'exit', x: 445, y: 65 },
    { id: 'E2', label: 'South Exit', type: 'exit', x: 445, y: 185 },
  ],
  edges: [
    { id: 'L01', from: 'R1', to: 'C1', cost: 2 },
    { id: 'L02', from: 'C1', to: 'C2', cost: 3 },
    { id: 'L03', from: 'C2', to: 'E1', cost: 2 },
    { id: 'L04', from: 'R1', to: 'R2', cost: 4 },
    { id: 'L05', from: 'R2', to: 'C3', cost: 2 },
    { id: 'L06', from: 'C3', to: 'C4', cost: 3 },
    { id: 'L07', from: 'C4', to: 'E2', cost: 2 },
    { id: 'L08', from: 'C1', to: 'C3', cost: 4 },
    { id: 'L09', from: 'C2', to: 'C4', cost: 3 },
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: [],
  },
};

export const MULTI_WING_LAB: BuildingData = {
  building: 'Biotech Innovation Wing (Tie-Breaker Benchmark)',
  nodes: [
    { id: 'LAB_A', label: 'Robotics Lab A', type: 'room', x: 100, y: 200 },
    { id: 'HALL_1', label: 'Central Hall', type: 'junction', x: 260, y: 200 },
    { id: 'WING_NORTH', label: 'North Atrium', type: 'junction', x: 420, y: 120 },
    { id: 'WING_SOUTH', label: 'South Atrium', type: 'junction', x: 420, y: 280 },
    { id: 'EXIT_A', label: 'North Stairwell', type: 'exit', x: 580, y: 120 },
    { id: 'EXIT_B', label: 'South Stairwell', type: 'exit', x: 580, y: 280 },
    { id: 'OFFICE_B', label: 'Control Room B', type: 'room', x: 260, y: 340 },
  ],
  edges: [
    { id: 'ed_1', from: 'LAB_A', to: 'HALL_1', cost: 3 },
    { id: 'ed_2', from: 'HALL_1', to: 'WING_NORTH', cost: 4 },
    { id: 'ed_3', from: 'WING_NORTH', to: 'EXIT_A', cost: 3 },
    { id: 'ed_4', from: 'HALL_1', to: 'WING_SOUTH', cost: 4 },
    { id: 'ed_5', from: 'WING_SOUTH', to: 'EXIT_B', cost: 3 },
    { id: 'ed_6', from: 'OFFICE_B', to: 'WING_SOUTH', cost: 2 },
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: [],
  },
};

export const TWO_TOWER_COMPLEX: BuildingData = {
  building: 'Dual-Tower Research Hub (Disconnected Zones)',
  nodes: [
    // Tower 1
    { id: 'T1_R1', label: 'Tower 1 Studio', type: 'room', x: 100, y: 120 },
    { id: 'T1_J1', label: 'Tower 1 Lobby', type: 'junction', x: 240, y: 120 },
    { id: 'T1_E1', label: 'Tower 1 Exit', type: 'exit', x: 380, y: 120 },
    // Bridge (Skywalk)
    { id: 'SKYWALK', label: 'Skywalk Bridge', type: 'junction', x: 240, y: 220 },
    // Tower 2
    { id: 'T2_R1', label: 'Tower 2 Server Room', type: 'room', x: 100, y: 320 },
    { id: 'T2_J1', label: 'Tower 2 Lobby', type: 'junction', x: 240, y: 320 },
    { id: 'T2_E1', label: 'Tower 2 Exit', type: 'exit', x: 380, y: 320 },
    // Isolated basement annex
    { id: 'ISO_VAULT', label: 'Isolated Sub-Vault', type: 'room', x: 520, y: 220 },
  ],
  edges: [
    { id: 't1_e1', from: 'T1_R1', to: 'T1_J1', cost: 2 },
    { id: 't1_e2', from: 'T1_J1', to: 'T1_E1', cost: 2 },
    { id: 't1_bridge', from: 'T1_J1', to: 'SKYWALK', cost: 5 },
    { id: 't2_bridge', from: 'SKYWALK', to: 'T2_J1', cost: 5 },
    { id: 't2_e1', from: 'T2_R1', to: 'T2_J1', cost: 2 },
    { id: 't2_e2', from: 'T2_J1', to: 'T2_E1', cost: 2 },
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: ['t1_bridge'],
    closed_exits: [],
  },
};

export const HIGH_RISE_FLOOR: BuildingData = {
  building: 'Grand Metro Centre Floor 14',
  nodes: [
    { id: 'R101', label: 'Conference A', type: 'room', x: 80, y: 100 },
    { id: 'R102', label: 'Executive Suite', type: 'room', x: 80, y: 220 },
    { id: 'R103', label: 'Engineering Hub', type: 'room', x: 80, y: 340 },
    { id: 'J_WEST', label: 'West Corridor', type: 'junction', x: 200, y: 220 },
    { id: 'J_CENTRAL', label: 'Main Concourse', type: 'junction', x: 340, y: 220 },
    { id: 'J_NORTH', label: 'North Gallery', type: 'junction', x: 340, y: 100 },
    { id: 'J_SOUTH', label: 'South Gallery', type: 'junction', x: 340, y: 340 },
    { id: 'J_EAST', label: 'East Corridor', type: 'junction', x: 480, y: 220 },
    { id: 'EXIT_NORTH', label: 'Fire Exit North', type: 'exit', x: 500, y: 100 },
    { id: 'EXIT_EAST', label: 'Fire Exit East', type: 'exit', x: 620, y: 220 },
    { id: 'EXIT_SOUTH', label: 'Fire Exit South', type: 'exit', x: 500, y: 340 },
  ],
  edges: [
    { id: 'c1', from: 'R101', to: 'J_NORTH', cost: 2 },
    { id: 'c2', from: 'R102', to: 'J_WEST', cost: 1 },
    { id: 'c3', from: 'R103', to: 'J_SOUTH', cost: 2 },
    { id: 'c4', from: 'J_WEST', to: 'J_NORTH', cost: 3 },
    { id: 'c5', from: 'J_WEST', to: 'J_CENTRAL', cost: 2 },
    { id: 'c6', from: 'J_WEST', to: 'J_SOUTH', cost: 3 },
    { id: 'c7', from: 'J_NORTH', to: 'J_CENTRAL', cost: 2 },
    { id: 'c8', from: 'J_SOUTH', to: 'J_CENTRAL', cost: 2 },
    { id: 'c9', from: 'J_CENTRAL', to: 'J_EAST', cost: 2 },
    { id: 'c10', from: 'J_NORTH', to: 'EXIT_NORTH', cost: 3 },
    { id: 'c11', from: 'J_EAST', to: 'EXIT_EAST', cost: 2 },
    { id: 'c12', from: 'J_SOUTH', to: 'EXIT_SOUTH', cost: 3 },
    { id: 'c13', from: 'J_EAST', to: 'EXIT_NORTH', cost: 4 },
  ],
  initial_state: {
    blocked_nodes: [],
    blocked_edges: [],
    closed_exits: [],
  },
};

export const PRESET_OPTIONS = [
  { id: 'official', labelKey: 'officialSample', data: OFFICIAL_SAMPLE },
  { id: 'tie_breaker', labelKey: 'multiWingLab', data: MULTI_WING_LAB },
  { id: 'disconnected', labelKey: 'twoTowerComplex', data: TWO_TOWER_COMPLEX },
  { id: 'high_rise', labelKey: 'highRiseFloor', data: HIGH_RISE_FLOOR },
];
