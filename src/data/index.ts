import wellsJson from './wells.json';
import documentsJson from './documents.json';
import reviewJson from './review.json';
import qaJson from './qa.json';
import alertsJson from './alerts.json';
import liveJson from './live.json';
import type { ActiveWell, AlertDef, LiveData, OffsetWell, QaEntry, ReportDoc, ReviewItem } from '../types';

export const ACTIVE = wellsJson.active as ActiveWell;
export const OFFSETS = wellsJson.offsets as unknown as OffsetWell[];
export const DOCUMENTS = documentsJson as unknown as ReportDoc[];
export const REVIEW_QUEUE = reviewJson as ReviewItem[];
export const QA = qaJson as unknown as QaEntry[];
export const ALERT_DEFS = alertsJson as unknown as AlertDef[];
export const LIVE = liveJson as LiveData;

export const docById = (id: number) => DOCUMENTS.find((d) => d.id === id);
export const wellByName = (name: string) => OFFSETS.find((w) => w.name === name);

/** All events from every offset well, flattened (used by Knowledge Search). */
export const ALL_EVENTS = OFFSETS.flatMap((w) => w.events.map((e, i) => ({ ...e, well: w.name, key: `${w.name}-${i}` })));
export type FlatEvent = (typeof ALL_EVENTS)[number];
