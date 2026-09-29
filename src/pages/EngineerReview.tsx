import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import ReportPage from '../components/docs/ReportPage';
import { Confidence } from '../components/IssueTag';
import { REVIEW_QUEUE, docById } from '../data';
import { useShotReady } from '../lib/useShotReady';
import type { ReviewItem } from '../types';

const REVIEWED_TODAY = 14;
const byConfidence = (q: ReviewItem[]) => [...q].sort((a, b) => a.confidence - b.confidence);
const CORRECTIONS = 37;

export default function EngineerReview() {
  const [queue, setQueue] = useState<ReviewItem[]>(REVIEW_QUEUE);
  const [selId, setSelId] = useState<string | null>(byConfidence(REVIEW_QUEUE)[0]?.id ?? null);
  const [reviewed, setReviewed] = useState(REVIEWED_TODAY);
  const [corrections, setCorrections] = useState(CORRECTIONS);
  const [log, setLog] = useState<string | null>(null);
  useShotReady();

  const item = queue.find((q) => q.id === selId);
  const doc = item ? docById(item.docId) : undefined;
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = doc?.extracted ?? [];
  const valueOf = (f: string) => values[f] ?? fields.find((x) => x.field === f)?.value ?? '';
  const edited = fields.some((f) => values[f.field] !== undefined && values[f.field] !== f.value);

  const pick = (id: string) => {
    setSelId(id);
    setValues({});
  };
  const finish = (action: 'Approved' | 'Corrected & approved' | 'Rejected') => {
    if (!item) return;
    const rest = queue.filter((q) => q.id !== item.id);
    setQueue(rest);
    setReviewed((r) => r + 1);
    if (action === 'Corrected & approved') setCorrections((c) => c + 1);
    setLog(`${item.id} (${item.well}, ${item.event}) – ${action}.`);
    pick(byConfidence(rest)[0]?.id ?? '');
  };

  return (
    <div className="p-4">
      <PageHeader title="Engineer Review" subtitle="Extracted events are checked by an engineer before they are used for alerts, risk prediction and answers." />

      <div className="mb-3 grid grid-cols-3 gap-3">
        <Counter label="Reviewed today" value={reviewed} />
        <Counter label="Pending" value={queue.length} accent />
        <Counter label="Corrections used to retrain the extraction model" value={corrections} />
      </div>

      <section className="card mb-3">
        <div className="card-h">
          <span>Review queue</span>
          <span className="text-[0.82rem] font-normal text-muted">Sorted by lowest field confidence · click a row to review</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Document</th>
              <th>Well</th>
              <th>Suggested event</th>
              <th className="num">Depth</th>
              <th>Formation</th>
              <th>Lowest field confidence</th>
            </tr>
          </thead>
          <tbody>
            {byConfidence(queue).map((q) => (
                <tr key={q.id} className={`clickable ${q.id === selId ? 'selected' : ''}`} onClick={() => pick(q.id)}>
                  <td className="text-muted">{q.id}</td>
                  <td className="font-semibold text-navy">{docById(q.docId)!.file}</td>
                  <td>{q.well}</td>
                  <td>{q.event}</td>
                  <td className="num">{q.depth}</td>
                  <td>{q.formation}</td>
                  <td>
                    <Confidence value={q.confidence} />
                  </td>
                </tr>
              ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={7} className="py-5 text-center text-muted">
                  Queue is empty – all extracted events reviewed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {log && <div className="border-t border-line bg-[#f1f8f3] px-4 py-2 text-[0.88rem] text-risk-green">Last action: {log}</div>}
      </section>

      {item && doc && (
        <section className="card">
          <div className="card-h">
            <span>
              Review {item.id} <span className="font-normal text-muted">· {doc.file}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <div className="label mb-1.5">Original report excerpt – source sentence highlighted</div>
              <ReportPage doc={doc} compact />
            </div>
            <div>
              <div className="label mb-1.5">Extracted fields (editable)</div>
              <div className="border border-line">
                {fields.map((f, i) => (
                  <div key={f.field} className={`flex items-center gap-3 px-3 py-1.5 ${i % 2 ? 'bg-zebra' : ''}`}>
                    <span className="w-[82px] flex-none text-[0.88rem] font-semibold">{f.field}</span>
                    <input
                      className="input min-w-0 flex-1"
                      style={f.confidence < 0.75 ? { borderColor: '#E3A99F', background: '#FFF8F6' } : undefined}
                      value={valueOf(f.field)}
                      onChange={(e) => setValues((v) => ({ ...v, [f.field]: e.target.value }))}
                    />
                    <Confidence value={f.confidence} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="btn btn-primary" onClick={() => finish('Approved')} disabled={edited}>
                  Approve
                </button>
                <button className="btn" onClick={() => finish('Corrected & approved')} disabled={!edited}>
                  Correct &amp; Approve
                </button>
                <button className="btn border-[#e3a99f] text-risk-red" onClick={() => finish('Rejected')}>
                  Reject
                </button>
                <span className="ml-2 text-[0.82rem] text-muted">{edited ? 'Edited – use “Correct & Approve”.' : 'Fields in red are below 75% confidence.'}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Counter({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card px-4 py-1.5" style={accent ? { borderTop: "3px solid #E67E22" } : undefined}>
      <div className="text-[0.85rem] text-muted">{label}</div>
      <div className="text-[1.5rem] font-bold leading-tight">{value}</div>
    </div>
  );
}
