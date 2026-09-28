export type EventType = 'Mud Loss' | 'Stuck Pipe' | 'Kick' | 'Cementing Issue' | 'Torque Spike';
export type MainIssue = Exclude<EventType, 'Torque Spike'> | 'No major issue';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'low' | 'medium' | 'high';
export type TabId = 'alerts' | 'wells' | 'ask';
export type FilterId = 'All' | MainIssue;
export type ShotMode = 'dashboard' | 'popup' | 'depth' | 'ask' | null;

export interface FormationTop {
  name: string;
  top: number;
}

export interface Casing {
  size: string;
  shoe: number;
  status?: 'set' | 'planned';
}

export interface WellEvent {
  type: EventType;
  depth: number;
  formation: string;
  description: string;
  action: string;
  result: string;
  timeLost: number;
  effective: boolean;
  source: string;
}

export interface OffsetWellRaw {
  name: string;
  lat: number;
  lon: number;
  year: number;
  td: number;
  type: 'vertical' | 'deviated';
  bhl?: { lat: number; lon: number };
  formationTops: FormationTop[];
  casing: Casing[];
  events: WellEvent[];
}

export interface OffsetWell extends OffsetWellRaw {
  distanceKm: number;
  mainIssue: MainIssue;
  nptHours: number;
}

export interface ActiveWell {
  name: string;
  lat: number;
  lon: number;
  year: number;
  plannedTd: number;
  type: 'vertical' | 'deviated';
  startBitDepth: number;
  holeSection: string;
  formationTops: FormationTop[];
  casing: Casing[];
}

export interface AlertDef {
  id: string;
  severity: Severity;
  formation: string;
  eventType: EventType;
  targetDepth: number;
  targetLabel: string;
  headline: string;
  finding: string;
  whatWorked: string;
  whatWorkedWells: string[];
  whyQaId: string;
}

export interface ComputedAlert extends AlertDef {
  distanceAhead: number;
  involvedWells: string[];
  findingText: string;
}

export interface QaEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  sources: string[];
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
}

export interface RiskInterval {
  from: number;
  to: number;
  level: RiskLevel;
  formation: string;
  wells: string[];
}
