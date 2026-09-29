export type EventType = 'Mud Loss' | 'Stuck Pipe' | 'Kick' | 'Cementing Issue' | 'Torque Spike';
export type MainIssue = 'Mud Loss' | 'Stuck Pipe' | 'Kick' | 'Cementing Issue' | 'No Issue';
export type FilterId = 'All' | MainIssue;
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'low' | 'medium' | 'high';
export type Role = 'field' | 'office';
export type RiskType = 'Mud Loss' | 'Stuck Pipe' | 'Kick' | 'Torque Spike' | 'Cementing Issue';

export interface FormationTop {
  name: string;
  top: number;
}

export interface Casing {
  size: string;
  shoe: number;
  status?: 'set' | 'planned';
}

export interface SourceRef {
  docId: number;
  file: string;
  report: string;
  date: string;
  page: number;
}

export interface WellEvent {
  type: EventType;
  md: number;
  tvd: number;
  formation: string;
  description: string;
  action: string;
  result: string;
  timeLost: number;
  workedMw?: number;
  source: SourceRef;
}

export interface Trajectory {
  kop: number;
  inc: number;
  az: number;
  points: [number, number][];
}

export interface OffsetWell {
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  year: number;
  td: number;
  tdTvd: number;
  type: 'vertical' | 'deviated';
  mainIssue: MainIssue;
  trajectory?: Trajectory;
  formationTops: FormationTop[];
  casing: Casing[];
  mudWeight: { min: number; max: number; byFormation: Record<string, [number, number]> };
  nptHours: number;
  events: WellEvent[];
  documents: string[];
  note?: string;
}

export interface ActiveWell {
  name: string;
  lat: number;
  lon: number;
  plannedTd: number;
  type: 'vertical';
  startBitDepth: number;
  holeSection: string;
  formationTops: FormationTop[];
  casing: Casing[];
  plannedMw: Record<string, number>;
}

export interface ExcerptRow {
  time: string;
  hrs: string;
  text: string;
  hl?: boolean;
}

export interface ExtractedField {
  field: string;
  value: string;
  confidence: number;
}

export type DocType = 'WCR' | 'DDR' | 'Mud log' | 'Casing record';
export type DocStatus = 'Processed' | 'In review' | 'Failed' | 'Processing';

export interface ReportDoc {
  id: number;
  file: string;
  well: string;
  type: DocType;
  date: string;
  pages: number;
  method: 'Digital text' | 'OCR';
  status: DocStatus;
  eventsExtracted: number;
  page: number;
  failReason?: string;
  excerpt: { title: string; meta: [string, string][]; rows: ExcerptRow[] } | null;
  extracted: ExtractedField[];
}

export interface ReviewItem {
  id: string;
  docId: number;
  well: string;
  event: string;
  depth: string;
  formation: string;
  confidence: number;
  sentence: string;
}

export interface QaEntry {
  id: string;
  question: string;
  suggested: boolean;
  formation: string;
  depthRange: [number, number];
  keywords: string[];
  answer: string;
  sources: { docId: number; match: string }[];
}

export interface AlertDef {
  id: string;
  kind: 'Look-ahead' | 'Pattern match';
  severity: Severity;
  eventType: EventType;
  formation: string;
  targetDepth?: number;
  patternWell?: string;
  title: string;
  message: string;
  whatWorked: string;
  whatWorkedWells: string[];
  question: string;
}

export interface ComputedAlert extends AlertDef {
  distanceAhead: number;
  involvedWells: string[];
  text: string;
  workedWells: string[];
}

export interface LiveData {
  minutes: number[];
  rop: number[];
  torque: number[];
  spp: number[];
  pitVolume: number[];
  mudWeight: number[];
  bitDepth: number[];
}
