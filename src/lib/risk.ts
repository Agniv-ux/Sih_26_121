import type { AlertDef, ComputedAlert, FormationTop, OffsetWell, RiskInterval, RiskLevel } from '../types';
import { RISK_STEP_M, RISK_WINDOW_M, SEVERITY_RANK } from './constants';
import { formationAt, penetrates, toActiveDepth } from './wells';

const MATCH_TOLERANCE_M = 10;

/** Split the next RISK_WINDOW_M below the bit into RISK_STEP_M intervals and score each one. */
export function computeRiskStrip(bitDepth: number, wells: OffsetWell[], activeTops: FormationTop[]): RiskInterval[] {
  const mapped = wells.flatMap((w) =>
    w.events
      .filter((e) => e.type !== 'Torque Spike')
      .map((e) => ({ well: w.name, depth: toActiveDepth(w, e.depth, e.formation, activeTops) }))
      .filter((e): e is { well: string; depth: number } => e.depth !== undefined),
  );

  // Formation-level baseline: share of penetrating wells with a major event in that formation.
  const formationRate = (formation: string) => {
    const pen = wells.filter((w) => penetrates(w, formation));
    if (pen.length === 0) return 0;
    const hit = pen.filter((w) => w.events.some((e) => e.type !== 'Torque Spike' && e.formation === formation));
    return hit.length / pen.length;
  };

  const out: RiskInterval[] = [];
  for (let from = bitDepth; from < bitDepth + RISK_WINDOW_M; from += RISK_STEP_M) {
    const to = from + RISK_STEP_M;
    const hits = mapped.filter((e) => e.depth >= from - MATCH_TOLERANCE_M && e.depth < to + MATCH_TOLERANCE_M);
    const hitWells = [...new Set(hits.map((h) => h.well))];
    const formation = formationAt(activeTops, (from + to) / 2);
    let level: RiskLevel = 'low';
    if (hitWells.length >= 2) level = 'high';
    else if (hitWells.length === 1 || formationRate(formation) >= 0.3) level = 'medium';
    out.push({ from, to, level, formation, wells: hitWells });
  }
  return out;
}

export function computeAlerts(defs: AlertDef[], bitDepth: number, wells: OffsetWell[]): ComputedAlert[] {
  return defs
    .map((d) => {
      const involved = wells.filter((w) => w.events.some((e) => e.type === d.eventType && e.formation === d.formation));
      const penetrating = wells.filter((w) => penetrates(w, d.formation));
      // "What worked" only cites wells that are currently in scope.
      const worked = d.whatWorkedWells.filter((n) => involved.some((w) => w.name === n));
      return {
        ...d,
        whatWorkedWells: worked,
        distanceAhead: d.targetDepth - bitDepth,
        involvedWells: involved.map((w) => w.name),
        findingText: d.finding.replace('{n}', String(involved.length)).replace('{m}', String(penetrating.length)),
      };
    })
    .filter((a) => a.involvedWells.length > 0)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.distanceAhead - b.distanceAhead);
}
