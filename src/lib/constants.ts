import type { EventType, FilterId, MainIssue, RiskLevel, RiskType, Severity } from '../types';

export const C = {
  navy: '#0B3D91',
  bg: '#F5F7FA',
  line: '#D9DEE5',
  ink: '#1F2937',
  muted: '#6B7280',
  accent: '#E67E22',
  red: '#C0392B',
  amber: '#D68910',
  purple: '#7D3C98',
  blue: '#2471A3',
  green: '#1E8449',
  grey: '#7F8C8D',
};

export const ISSUE_COLORS: Record<MainIssue | EventType, string> = {
  'Mud Loss': C.red,
  'Stuck Pipe': C.amber,
  Kick: C.purple,
  'Cementing Issue': C.blue,
  'No Issue': C.grey,
  'Torque Spike': '#5D6D7E',
};

export const ISSUE_LABEL: Record<MainIssue | EventType, string> = {
  'Mud Loss': 'Mud Loss',
  'Stuck Pipe': 'Stuck Pipe',
  Kick: 'Kick',
  'Cementing Issue': 'Cementing',
  'No Issue': 'No Issue',
  'Torque Spike': 'Torque Spike',
};

export const FILTERS: FilterId[] = ['All', 'Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'No Issue'];

export const FORMATIONS = ['Alluvium', 'Namsang', 'Girujan', 'Tipam', 'Barail', 'Kopili'];
/** Muted, print-friendly formation band colours. */
export const FORMATION_COLORS: Record<string, string> = {
  Alluvium: '#EDE7D9',
  Namsang: '#E3D9C0',
  Girujan: '#D5E3CF',
  Tipam: '#F3E3B3',
  Barail: '#D9D4E6',
  Kopili: '#CFE0E8',
};
export const FORMATION_EDGE: Record<string, string> = {
  Alluvium: '#B8AB8C',
  Namsang: '#AE9D72',
  Girujan: '#8FAF84',
  Tipam: '#C9A94A',
  Barail: '#9C92B8',
  Kopili: '#7FA5B8',
};

export const RISK_COLORS: Record<RiskLevel, string> = { low: C.green, medium: C.amber, high: C.red };
export const SEVERITY_COLORS: Record<Severity, string> = { HIGH: C.red, MEDIUM: C.amber, LOW: C.green };
export const SEVERITY_RANK: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export const RISK_TYPES: RiskType[] = ['Mud Loss', 'Stuck Pipe', 'Kick', 'Torque Spike', 'Cementing Issue'];
export const RISK_TYPE_LABEL: Record<RiskType, string> = {
  'Mud Loss': 'Mud Loss',
  'Stuck Pipe': 'Stuck Pipe',
  Kick: 'Overpressure / Kick',
  'Torque Spike': 'Torque Spike',
  'Cementing Issue': 'Cementing Issue',
};

export const RISK_STEP_M = 25;
export const RISK_AHEAD_M = 300;
export const SIM_INTERVAL_MS = 3000;
export const SIM_STEP_M = 0.5;
export const DEFAULT_RADIUS_KM = 10;
export const SHOT_BIT_DEPTH = 2765;
