import wellsJson from './wells.json';
import alertsJson from './alerts.json';
import qaJson from './qa.json';
import type { ActiveWell, AlertDef, MainIssue, OffsetWell, OffsetWellRaw, QaEntry } from '../types';
import { haversineKm } from '../lib/geo';

export const activeWell = wellsJson.active as ActiveWell;

function mainIssueOf(w: OffsetWellRaw): MainIssue {
  const major = w.events.filter((e) => e.type !== 'Torque Spike');
  if (major.length === 0) return 'No major issue';
  // The main past problem is the major event type with the most time lost.
  const byType = new Map<string, number>();
  for (const e of major) byType.set(e.type, (byType.get(e.type) ?? 0) + e.timeLost);
  return [...byType.entries()].sort((a, b) => b[1] - a[1])[0][0] as MainIssue;
}

export const offsetWells: OffsetWell[] = (wellsJson.offsets as OffsetWellRaw[])
  .map((w) => ({
    ...w,
    distanceKm: haversineKm(activeWell.lat, activeWell.lon, w.lat, w.lon),
    mainIssue: mainIssueOf(w),
    nptHours: w.events.reduce((s, e) => s + e.timeLost, 0),
  }))
  .sort((a, b) => a.distanceKm - b.distanceKm);

export const wellByName = new Map(offsetWells.map((w) => [w.name, w]));

export const alertDefs = alertsJson as AlertDef[];

export const qaEntries = qaJson.entries as QaEntry[];
export const qaById = new Map(qaEntries.map((q) => [q.id, q]));
export const suggestedQaIds = qaJson.suggested;
export const qaFallback = qaJson.fallback;
