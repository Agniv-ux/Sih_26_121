import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '../components/ui/PageHeader';
import ReportPage from '../components/docs/ReportPage';
import ExtractedFields from '../components/docs/ExtractedFields';
import { DOCUMENTS, OFFSETS } from '../data';
import { useShotReady } from '../lib/useShotReady';
import type { DocStatus, ReportDoc } from '../types';

const STATUS_STYLE: Record<DocStatus, { bg: string; fg: string }> = {
  Processed: { bg: '#E8F5EC', fg: '#1E8449' },
  'In review': { bg: '#FDF3E1', fg: '#9A6207' },
  Failed: { bg: '#FBEAEA', fg: '#C0392B' },
  Processing: { bg: '#EAF0FA', fg: '#0B3D91' },
};

const STEPS = [
  { title: 'Upload', tools: 'PDF / scanned TIFF' },
  { title: 'Text / OCR', tools: 'PaddleOCR, pdfplumber' },
  { title: 'Tables', tools: 'Camelot' },
  { title: 'Entity extraction', tools: 'spaCy + rules' },
  { title: 'Engineer review', tools: 'Approve / correct' },
  { title: 'Database', tools: 'PostgreSQL + pgvector' },
];

export function StatusPill({ status }: { status: DocStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-block rounded-[2px] px-1.5 py-[1px] text-[0.8rem] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

export default function DocumentProcessing() {
  const [params, setParams] = useSearchParams();
  const [docs, setDocs] = useState<ReportDoc[]>(DOCUMENTS);
  const [well, setWell] = useState(params.get('well') ?? 'All');
  const [drag, setDrag] = useState(false);
  const selId = Number(params.get('doc')) || null;
  const selected = docs.find((d) => d.id === selId);
  const fileInput = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  useShotReady();

  useEffect(() => {
    if (selected && !params.get('shot')) viewer.current?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const select = (id: number | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set('doc', String(id));
    else p.delete('doc');
    setParams(p, { replace: true });
  };

  // Simulated upload: rows appear as "Processing" and move to "In review" after a moment.
  const addFiles = (names: string[]) => {
    const base = Math.max(...docs.map((d) => d.id));
    const rows: ReportDoc[] = names.map((n, i) => ({
      id: base + i + 1,
      file: n,
      well: OFFSETS.find((w) => n.includes(w.name))?.name ?? '—',
      type: /wcr/i.test(n) ? 'WCR' : /mud/i.test(n) ? 'Mud log' : /casing/i.test(n) ? 'Casing record' : 'DDR',
      date: '—',
      pages: 1 + ((n.length * 7) % 9),
      method: 'OCR',
      status: 'Processing',
      eventsExtracted: 0,
      page: 1,
      excerpt: null,
      extracted: [],
    }));
    setDocs((d) => [...rows, ...d]);
    window.setTimeout(() => setDocs((d) => d.map((x) => (rows.some((r) => r.id === x.id) ? { ...x, status: 'In review', eventsExtracted: 1 } : x))), 2500);
  };

  const shown = docs.filter((d) => well === 'All' || d.well === well);
  const count = (s: DocStatus) => docs.filter((d) => d.status === s).length;

  return (
    <div className="p-4">
      <PageHeader title="Document Processing" subtitle="Old reports (WCRs, DDRs, mud logs, casing records) are read, converted to text and turned into structured events." />

      <div className="mb-3 flex gap-3">
        <div
          className={`flex w-[330px] flex-none flex-col items-center justify-center border-2 border-dashed px-4 py-3 text-center ${drag ? 'border-navy bg-[#eef3fb]' : 'border-[#b7c3d4] bg-white'}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles([...e.dataTransfer.files].map((f) => f.name));
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="1.6" aria-hidden>
            <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" />
          </svg>
          <div className="mt-1 font-semibold">Drag &amp; drop reports here</div>
          <div className="text-[0.82rem] text-muted">PDF or scanned images · simulated, files are not uploaded</div>
          <button className="btn btn-sm mt-2" onClick={() => fileInput.current?.click()}>
            Browse files
          </button>
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => e.target.files && addFiles([...e.target.files].map((f) => f.name))} />
        </div>

        <section className="card min-w-0 flex-1">
          <div className="card-h">
            <span>Processing pipeline</span>
            <span className="text-[0.82rem] font-normal text-muted">
              {docs.length} documents · {count('Processed')} processed · {count('In review')} in review · {count('Failed')} failed
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex flex-1 items-center gap-1.5">
                <div className={`flex-1 border px-2 py-2 text-center ${s.title === 'Engineer review' ? 'border-accent bg-[#fdf6ef]' : 'border-line bg-[#fafbfc]'}`}>
                  <div className="text-[0.9rem] font-semibold">{s.title}</div>
                  <div className="text-[0.78rem] text-muted">{s.tools}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <svg width="16" height="12" className="flex-none" aria-hidden>
                    <path d="M0 6h12M8 2l4 4-4 4" fill="none" stroke="#6B7280" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {selected && (
        <section ref={viewer} className="card mb-3">
          <div className="card-h">
            <span>
              {selected.file} <span className="font-normal text-muted">· {selected.method} · page {selected.page} of {selected.pages}</span>
            </span>
            <span className="flex items-center gap-2">
              <StatusPill status={selected.status} />
              <button className="btn btn-sm" onClick={() => select(null)}>
                Close
              </button>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
            <div>
              <div className="label mb-1.5">Original report page (mock)</div>
              <ReportPage doc={selected} compact />
            </div>
            <div>
              <div className="label mb-1.5">Extracted fields</div>
              <div className="border border-line">
                <ExtractedFields fields={selected.extracted} />
              </div>
              <p className="mt-2 text-[0.82rem] text-muted">
                Highlighted lines on the left are where the values came from. Records with any field below 75% confidence are sent to Engineer Review before entering the database.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-h">
          <span>Processed documents</span>
          <label className="flex items-center gap-2 text-[0.88rem] font-normal">
            <span className="text-muted">Well</span>
            <select className="input" value={well} onChange={(e) => setWell(e.target.value)}>
              <option>All</option>
              {OFFSETS.map((w) => (
                <option key={w.name}>{w.name}</option>
              ))}
            </select>
          </label>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>File name</th>
              <th>Well</th>
              <th>Type</th>
              <th className="num">Pages</th>
              <th>Method</th>
              <th>Status</th>
              <th className="num">Events extracted</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id} className={`clickable ${d.id === selId ? 'selected' : ''}`} onClick={() => select(d.id)}>
                <td className="font-semibold text-navy">{d.file}</td>
                <td>{d.well}</td>
                <td>{d.type}</td>
                <td className="num">{d.pages}</td>
                <td>{d.method}</td>
                <td>
                  <StatusPill status={d.status} />
                  {d.failReason && <span className="ml-2 text-[0.8rem] text-muted">{d.failReason}</span>}
                </td>
                <td className="num">{d.status === 'Processing' ? '…' : d.eventsExtracted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
