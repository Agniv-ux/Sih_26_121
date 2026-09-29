import type { FormationTop, OffsetWell } from '../types';
import { ACTIVE } from '../data';

/** TVD from MD: vertical to kick-off point, then a constant-inclination tangent (same as the data generator). */
export function tvd(well: Pick<OffsetWell, 'trajectory'> | undefined, md: number): number {
  const t = well?.trajectory;
  if (!t || md <= t.kop) return md;
  return Math.round(t.kop + (md - t.kop) * Math.cos((t.inc * Math.PI) / 180));
}

export function formationAt(tops: FormationTop[], depth: number): string {
  let name = tops[0].name;
  for (const t of tops) if (depth >= t.top) name = t.name;
  return name;
}

export const topOf = (tops: FormationTop[], formation: string) => tops.find((t) => t.name === formation)?.top;

/** Base of a formation in a well = next top, or TD. */
export function baseOf(tops: FormationTop[], formation: string, td: number) {
  const i = tops.findIndex((t) => t.name === formation);
  if (i < 0) return undefined;
  return tops[i + 1]?.top ?? td;
}

export const penetrates = (w: OffsetWell, formation: string) => w.formationTops.some((t) => t.name === formation);

/** Map an offset-well depth onto the active well by its offset below the same formation top. */
export function toActiveDepth(w: OffsetWell, md: number, formation: string) {
  const own = topOf(w.formationTops, formation);
  const act = topOf(ACTIVE.formationTops, formation);
  if (own === undefined || act === undefined) return undefined;
  return act + (md - own);
}

/** Deepest active-well depth covered by an offset well (its TD mapped by the last formation it reached). */
export function reachOnActive(w: OffsetWell) {
  const last = w.formationTops[w.formationTops.length - 1];
  return toActiveDepth(w, w.td, last.name) ?? w.td;
}

export const eventsOfType = (wells: OffsetWell[], type: string) =>
  wells.flatMap((w) => w.events.filter((e) => e.type === type).map((e) => ({ well: w, event: e })));
