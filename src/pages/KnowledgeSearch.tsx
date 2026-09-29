import { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { IssueTag } from '../components/IssueTag';
import ReportPage from '../components/docs/ReportPage';
import Modal from '../components/ui/Modal';
import { ALL_EVENTS, OFFSETS, docById, wellByName, type FlatEvent } from '../data';
import { FORMATIONS } from '../lib/constants';
import { fmtM, sourceLabel } from '../lib/format';
import { useShotReady } from '../lib/useShotReady';
import type { EventType } from '../types';

const EVENT_TYPES: EventType[] = ['Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'Torque Spike'];
const YEARS = [...new Set(OFFSETS.map((w) => w.year))].sort();

/** Up to 3 related events from other wells: same type first, then same formation. */
function similar(e: FlatEvent) {
  const others = ALL_EVENTS.filter((x) => x.well !== e.well);
  const same = others.filter((x) => x.type === e.type).sort((a, b) => Math.abs(a.md - e.md) - Math.abs(b.md - e.md));
  const form = others.filter((x) => x.type !== e.type && x.formation === e.formation).sort((a, b) => Math.abs(a.md - e.md) - Math.abs(b.md - e.md));
  return [...same, ...form].slice(0, 3);
}

export default function KnowledgeSearch() {
  const [q, setQ] = useState('');
  const [well, setWell] = useState('All');
  const [type, setType] = useState('All');
  const [formation, setFormation] = useState('All');
  const [dFrom, setDFrom] = useState(0);
  const [dTo, setDTo] = useState(4500);
  const [year, setYear] = useState('All');
  const [sel, setSel] = useState<FlatEvent | null>(null);
  const [doc, setDoc] = useState<number | null>(null);
  useShotReady();

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return ALL_EVENTS.filter((e) => {
      const hay = `${e.well} ${e.type} ${e.formation} ${e.description} ${e.action} ${e.result}`.toLowerCase();
      return (
        words.every((w) => hay.includes(w)) &&
        (well === 'All' || e.well === well) &&
        (type === 'All' || e.type === type) &&
        (formation === 'All' || e.formation === formation) &&
        e.md >= dFrom &&
        e.md <= dTo &&
        (year === 'All' || wellByName(e.well)!.year === Number(year))
      );
    }).sort((a, b) => a.md - b.md);
  }, [q, well, type, formation, dFrom, dTo, year]);

  const reset = () => {
    setQ('');
    setWell('All');
    setType('All');
    setFormation('All');
    setDFrom(0);
    setDTo(4500);
    setYear('All');
  };

  return (
    <div className="p-4">
      <PageHeader title="Knowledge Search" subtitle="Search events and lessons learned extracted from all offset-well reports (engineer-approved records only)." />
      <section className="card mb-3">
        <div className="flex flex-wrap items-end gap-3 p-3">
          <label className="flex min-w-[300px] flex-1 flex-col gap-1">
            <span className="label">Search</span>
            <input className="input" placeholder="e.g. LCM, wiper trip, 1.18 SG, pack-off" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <Select label="Well" value={well} set={setWell} options={OFFSETS.map((w) => w.name)} />
          <Select label="Event type" value={type} set={setType} options={EVENT_TYPES} />
          <Select label="Formation" value={formation} set={setFormation} options={FORMATIONS} />
          <label className="flex flex-col gap-1">
            <span className="label">Depth (m MD)</span>
            <span className="flex items-center gap-1">
              <input className="input w-[76px]" type="number" step={100} value={dFrom} onChange={(e) => setDFrom(Number(e.target.value))} aria-label="Depth from" />
              <span className="text-muted">–</span>
              <input className="input w-[76px]" type="number" step={100} value={dTo} onChange={(e) => setDTo(Number(e.target.value))} aria-label="Depth to" />
            </span>
          </label>
          <Select label="Year drilled" value={year} set={setYear} options={YEARS.map(String)} />
          <button className="btn" onClick={reset}>
            Clear
          </button>
        </div>
      </section>

      <div className="flex gap-3">
        <section className="card min-w-0 flex-1">
          <div className="card-h">
            <span>Results</span>
            <span className="text-[0.82rem] font-normal text-muted">
              {results.length} of {ALL_EVENTS.length} events
            </span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Well</th>
                <th className="num">Depth (m MD)</th>
                <th>Formation</th>
                <th>Event</th>
                <th>Action taken</th>
                <th>Result</th>
                <th className="num">Time lost</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {results.map((e) => (
                <tr key={e.key} className={`clickable ${sel?.key === e.key ? 'selected' : ''}`} onClick={() => setSel(e)}>
                  <td className="font-semibold text-navy">{e.well}</td>
                  <td className="num">{fmtM(e.md)}</td>
                  <td>{e.formation}</td>
                  <td>
                    <IssueTag issue={e.type} />
                  </td>
                  <td className="max-w-[300px]">{e.action}</td>
                  <td className="max-w-[220px]">{e.result}</td>
                  <td className="num">{e.timeLost} h</td>
                  <td className="whitespace-nowrap text-[0.85rem] text-muted">{sourceLabel(e.source)}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted">
                    No matching events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <aside className="card w-[400px] flex-none self-start">
          <div className="card-h">Event details</div>
          {!sel ? (
            <div className="p-4 text-[0.9rem] text-muted">Click a row to see full details and similar incidents in other wells.</div>
          ) : (
            <div className="p-4 text-[0.9rem]">
              <div className="flex items-center gap-2 text-[1.05rem] font-semibold">
                {sel.well} · <IssueTag issue={sel.type} />
              </div>
              <div className="text-muted">
                {fmtM(sel.md)} m MD / {fmtM(sel.tvd)} m TVD · {sel.formation} · {sel.timeLost} h lost
              </div>
              <dl className="mt-3 space-y-2">
                <Detail k="What happened" v={sel.description} />
                <Detail k="Action taken" v={sel.action} />
                <Detail k="Result" v={sel.result} />
              </dl>
              <button className="btn btn-sm mt-3" onClick={() => setDoc(sel.source.docId)}>
                Open source: {sel.source.file} p.{sel.source.page}
              </button>
              <div className="label mb-1 mt-4">Similar incidents</div>
              <ul className="space-y-2">
                {similar(sel).map((s) => (
                  <li key={s.key}>
                    <button className="w-full border border-line px-2.5 py-1.5 text-left hover:bg-hover" onClick={() => setSel(s)}>
                      <div className="flex items-center gap-2 font-semibold">
                        {s.well} · <IssueTag issue={s.type} /> <span className="ml-auto font-normal text-muted">{fmtM(s.md)} m</span>
                      </div>
                      <div className="text-[0.85rem] text-muted">{s.action}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      {doc && (
        <Modal title={docById(doc)!.file} onClose={() => setDoc(null)}>
          <ReportPage doc={docById(doc)!} />
        </Modal>
      )}
    </div>
  );
}

function Select({ label, value, set, options }: { label: string; value: string; set: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => set(e.target.value)}>
        <option>All</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[0.8rem] font-semibold text-muted">{k}</dt>
      <dd className="m-0">{v}</dd>
    </div>
  );
}
