import type { QaEntry } from '../types';
import { QA, docById } from '../data';

export const NO_ANSWER = "No relevant information found in the selected wells' reports.";

/** Match a free-typed question (or a question id) to the closest pre-written answer by keywords. */
export function matchQuestion(q: string): QaEntry | undefined {
  const byId = QA.find((e) => e.id === q.trim().toLowerCase());
  if (byId) return byId;
  const text = q.toLowerCase();
  let best: QaEntry | undefined;
  let bestScore = 0;
  for (const e of QA) {
    const score = e.keywords.reduce((s, k) => s + (text.includes(k) ? (k.includes(' ') ? 2 : 1) : 0), 0);
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return bestScore >= 1 ? best : undefined;
}

export const wellsCited = (e: QaEntry) => [...new Set(e.sources.map((s) => docById(s.docId)!.well))];

export interface Scope {
  wells: string[];
  formation: string; // 'All' or a formation name
  depthFrom: number;
  depthTo: number;
}

/** An answer is only given when every cited report belongs to a well in scope and it overlaps the filters. */
export function answerInScope(e: QaEntry, scope: Scope) {
  if (!wellsCited(e).every((w) => scope.wells.includes(w))) return false;
  if (scope.formation !== 'All' && scope.formation !== e.formation) return false;
  return e.depthRange[1] >= scope.depthFrom && e.depthRange[0] <= scope.depthTo;
}
