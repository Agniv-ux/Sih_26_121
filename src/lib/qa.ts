import type { QaEntry } from '../types';
import { qaEntries, qaFallback } from '../data';

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}⅝/.\s-]/gu, ' ');

/** Return the pre-written answer whose keywords best match a free-typed question. */
export function matchQuestion(question: string): Pick<QaEntry, 'answer' | 'sources'> {
  const q = norm(question);
  let best: QaEntry | undefined;
  let bestScore = 0;
  for (const e of qaEntries) {
    if (norm(e.question).trim() === q.trim()) return e;
    const score = e.keywords.reduce((s, k) => s + (q.includes(k) ? (k.length > 4 ? 2 : 1) : 0), 0);
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best ?? qaFallback;
}
