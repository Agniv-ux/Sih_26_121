import type { AlertDef, ComputedAlert, OffsetWell, RiskLevel, RiskType } from '../types';
import { ACTIVE } from '../data';
import { RISK_STEP_M, RISK_TYPES, SEVERITY_RANK } from './constants';
import { fmtM } from './format';
import { formationAt, penetrates, reachOnActive, toActiveDepth } from './wells';

const TOLERANCE_M = 30;
const BASE_RATE = 0.08;
const NOUN: Record<RiskType, string> = {
  'Mud Loss': 'losses',
  'Stuck Pipe': 'stuck pipe',
  Kick: 'kicks',
  'Torque Spike': 'torque spikes',
  'Cementing Issue': 'cementing problems',
};

export interface Factor {
  text: string;
  weight: number;
}
export interface RiskCell {
  type: RiskType;
  from: number;
  to: number;
  formation: string;
  p: number;
  level: RiskLevel;
  factors: Factor[];
  wells: string[];
}
export interface RiskInterval {
  from: number;
  to: number;
  formation: string;
  method: 'Model' | 'Rule-based';
  cells: Record<RiskType, RiskCell>;
  level: RiskLevel;
}

const levelOf = (p: number): RiskLevel => (p >= 0.5 ? 'high' : p >= 0.25 ? 'medium' : 'low');
// Torque spikes are frequent and minor, so formation history counts for less.
const FORMATION_WEIGHT: Record<RiskType, number> = { 'Mud Loss': 0.4, 'Stuck Pipe': 0.4, Kick: 0.4, 'Torque Spike': 0.25, 'Cementing Issue': 0.4 };
const plannedShoe = ACTIVE.casing.find((c) => c.size === '9⅝"')!.shoe;

function scoreCell(type: RiskType, from: number, to: number, wells: OffsetWell[]): RiskCell {
  const formation = formationAt(ACTIVE.formationTops, (from + to) / 2);
  const pen = wells.filter((w) => penetrates(w, formation));
  const m = pen.length;
  const factors: Factor[] = [];

  const mapped = wells.flatMap((w) =>
    w.events
      .filter((e) => e.type === type)
      .map((e) => ({ w, e, d: toActiveDepth(w, e.md, e.formation) }))
      .filter((x): x is typeof x & { d: number } => x.d !== undefined && x.d >= from - TOLERANCE_M && x.d < to + TOLERANCE_M),
  );
  const hitWells = [...new Set(mapped.map((x) => x.w))].sort((a, b) => a.distanceKm - b.distanceKm);
  const n = hitWells.length;

  // 1. Formation history
  if (m > 0) {
    const r = pen.filter((w) => w.events.some((e) => e.type === type && e.formation === formation)).length / m;
    const fw = FORMATION_WEIGHT[type];
    if (r >= 0.4) factors.push({ text: `Formation: ${formation} (high ${NOUN[type]} history)`, weight: fw * r });
    else if (r > 0) factors.push({ text: `Formation: ${formation} (some ${NOUN[type]} history)`, weight: fw * r });
    else factors.push({ text: `Formation: ${formation} (no ${NOUN[type]} recorded)`, weight: -0.03 });
  }
  // 2. Offset wells with the event near this depth
  const denom = Math.max(m, n);
  if (n > 0) factors.push({ text: `${n} of ${denom} offset wells had ${NOUN[type]} within ±${TOLERANCE_M} m`, weight: (0.8 * n) / denom });
  else if (m > 0) factors.push({ text: `None of ${m} offset wells had ${NOUN[type]} within ±${TOLERANCE_M} m`, weight: -0.04 });
  if (n > 0) {
    const near = hitWells[0];
    factors.push({ text: `Nearest similar event: ${near.name} (${near.distanceKm.toFixed(1)} km away)`, weight: near.distanceKm < 5 ? 0.05 : 0.02 });
  }
  // 3. Type-specific engineering factors
  const planned = ACTIVE.plannedMw[formation];
  if (type === 'Mud Loss') {
    const worked = pen.flatMap((w) => w.events.filter((e) => e.type === 'Mud Loss' && e.formation === formation && e.workedMw).map((e) => e.workedMw!));
    if (worked.length && planned !== undefined) {
      const best = Math.min(...worked);
      if (planned > best) factors.push({ text: `Planned MW ${planned.toFixed(2)} SG above what worked (${best.toFixed(2)} SG)`, weight: Math.min(0.15, ((planned - best) / 0.03) * 0.08) });
    }
  }
  if (type === 'Kick' && formation === 'Barail' && from >= 3800) {
    const kill = wells.flatMap((w) => w.events.filter((e) => e.type === 'Kick' && e.workedMw).map((e) => ({ w, mw: e.workedMw! })))[0];
    if (kill && planned < kill.mw)
      factors.push({ text: `Planned MW ${planned.toFixed(2)} SG below kill weight used in ${kill.w.name} (${kill.mw.toFixed(2)} SG)`, weight: 0.15 });
  }
  if (type === 'Cementing Issue' && Math.abs((from + to) / 2 - plannedShoe) <= 50) {
    const tipamLosses = wells.some((w) => w.events.some((e) => e.type === 'Mud Loss' && e.formation === 'Tipam'));
    if (tipamLosses) factors.push({ text: `Planned 9⅝" shoe at ${fmtM(plannedShoe)} m – cement job across Tipam loss zone`, weight: 0.15 });
  }

  const p = Math.min(0.97, Math.max(0.02, BASE_RATE + factors.reduce((s, f) => s + f.weight, 0)));
  factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  return { type, from, to, formation, p, level: levelOf(p), factors, wells: hitWells.map((w) => w.name) };
}

const RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

export function riskInterval(from: number, wells: OffsetWell[]): RiskInterval {
  const to = from + RISK_STEP_M;
  const cells = Object.fromEntries(RISK_TYPES.map((t) => [t, scoreCell(t, from, to, wells)])) as Record<RiskType, RiskCell>;
  const level = Object.values(cells).reduce<RiskLevel>((acc, c) => (RANK[c.level] > RANK[acc] ? c.level : acc), 'low');
  const reaching = wells.filter((w) => reachOnActive(w) >= from).length;
  return { from, to, formation: formationAt(ACTIVE.formationTops, from + RISK_STEP_M / 2), method: reaching >= 4 ? 'Model' : 'Rule-based', cells, level };
}

export const gridStart = (depth: number) => Math.floor(depth / RISK_STEP_M) * RISK_STEP_M;

/** Intervals on a fixed 25 m grid, starting with the one that contains `fromDepth`. */
export function riskProfile(fromDepth: number, toDepth: number, wells: OffsetWell[]): RiskInterval[] {
  const out: RiskInterval[] = [];
  for (let d = gridStart(fromDepth); d < toDepth; d += RISK_STEP_M) out.push(riskInterval(d, wells));
  return out;
}

export function computeAlerts(defs: AlertDef[], bitDepth: number, wells: OffsetWell[]): ComputedAlert[] {
  const names = new Set(wells.map((w) => w.name));
  return defs
    .map((d) => {
      let involved: string[];
      let m: number;
      if (d.kind === 'Pattern match') {
        involved = d.patternWell && names.has(d.patternWell) ? [d.patternWell] : [];
        m = involved.length;
      } else {
        const pen = wells.filter((w) => penetrates(w, d.formation));
        m = pen.length;
        involved = pen.filter((w) => w.events.some((e) => e.type === d.eventType && e.formation === d.formation)).map((w) => w.name);
      }
      const distanceAhead = d.targetDepth !== undefined ? d.targetDepth - bitDepth : 0;
      const dStr = distanceAhead > 0 ? `~${fmtM(distanceAhead)} m` : '0 m (bit in zone)';
      const text = d.message.replace('~{d} m', dStr).replace('{n}', String(involved.length)).replace('{m}', String(m));
      return { ...d, distanceAhead, involvedWells: involved, text, workedWells: d.whatWorkedWells.filter((w) => names.has(w)) };
    })
    .filter((a) => a.involvedWells.length > 0)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.distanceAhead - b.distanceAhead);
}
