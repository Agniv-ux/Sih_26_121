import type { FilterId, MainIssue, RiskLevel, Severity } from '../types';

export const ISSUE_COLORS: Record<MainIssue | 'Torque Spike', string> = {
  'Mud Loss': '#EF4444',
  'Stuck Pipe': '#F59E0B',
  Kick: '#A855F7',
  'Cementing Issue': '#3B82F6',
  'No major issue': '#64748B',
  'Torque Spike': '#94A3B8',
};

export const ISSUE_SHORT: Record<MainIssue | 'Torque Spike', string> = {
  'Mud Loss': 'Mud Loss',
  'Stuck Pipe': 'Stuck Pipe',
  Kick: 'Kick',
  'Cementing Issue': 'Cementing',
  'No major issue': 'No major issue',
  'Torque Spike': 'Torque Spike',
};

export const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Mud Loss', label: 'Mud Loss' },
  { id: 'Stuck Pipe', label: 'Stuck Pipe' },
  { id: 'Kick', label: 'Kick' },
  { id: 'Cementing Issue', label: 'Cementing' },
  { id: 'No major issue', label: 'No issue' },
];

export const FORMATION_COLORS: Record<string, string> = {
  Alluvium: '#57534E',
  Namsang: '#7C6A4F',
  Girujan: '#4D6B4F',
  Tipam: '#9C8A4A',
  Barail: '#5E5470',
  Kopili: '#3F6170',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

export const SEVERITY_STYLE: Record<Severity, { color: string; label: string }> = {
  HIGH: { color: '#EF4444', label: 'HIGH' },
  MEDIUM: { color: '#F59E0B', label: 'MEDIUM' },
  LOW: { color: '#38BDF8', label: 'LOW · INFO' },
};

export const SEVERITY_RANK: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export const RISK_WINDOW_M = 300;
export const RISK_STEP_M = 25;
export const SIM_INTERVAL_MS = 3000;
export const SIM_STEP_M = 1;
export const DEFAULT_RADIUS_KM = 10;
