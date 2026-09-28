import type { FormationTop, OffsetWell } from '../types';

export function formationAt(tops: FormationTop[], depth: number): string {
  let name = tops[0].name;
  for (const t of tops) if (depth >= t.top) name = t.name;
  return name;
}

export function formationTop(tops: FormationTop[], name: string): number | undefined {
  return tops.find((t) => t.name === name)?.top;
}

/** Base of a formation in a well: next top, or TD if it is the last one penetrated. */
export function formationBase(tops: FormationTop[], name: string, td: number): number | undefined {
  const i = tops.findIndex((t) => t.name === name);
  if (i < 0) return undefined;
  return Math.min(tops[i + 1]?.top ?? td, td);
}

export function penetrates(w: OffsetWell, formation: string): boolean {
  const top = formationTop(w.formationTops, formation);
  return top !== undefined && w.td > top;
}

/**
 * Map an offset-well depth onto the active well by keeping the same
 * offset below the formation top (simple formation-based correlation).
 */
export function toActiveDepth(w: OffsetWell, depth: number, formation: string, activeTops: FormationTop[]): number | undefined {
  const offTop = formationTop(w.formationTops, formation);
  const actTop = formationTop(activeTops, formation);
  if (offTop === undefined || actTop === undefined) return undefined;
  return actTop + (depth - offTop);
}
