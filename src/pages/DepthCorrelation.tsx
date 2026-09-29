import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import DepthView, { buildColumns, type DepthMode } from '../components/DepthView';
import PageHeader from '../components/ui/PageHeader';
import { ACTIVE, OFFSETS } from '../data';
import { FORMATIONS, ISSUE_COLORS } from '../lib/constants';
import { fmtM } from '../lib/format';
import { useShotReady } from '../lib/useShotReady';
import { penetrates } from '../lib/wells';
import { useApp } from '../state/AppState';
import type { EventType, OffsetWell } from '../types';

const byDistance = [...OFFSETS].sort((a, b) => a.distanceKm - b.distanceKm);

function defaultSelection(param: string | null) {
  const nearest = byDistance.slice(0, 4).map((w) => w.name);
  if (!param || !OFFSETS.some((w) => w.name === param)) return nearest;
  return [param, ...nearest.filter((n) => n !== param)].slice(0, 4);
}

function summary(wells: OffsetWell[]) {
  return FORMATIONS.map((f) => {
    const pen = wells.filter((w) => penetrates(w, f));
    const events = pen.flatMap((w) => w.events.filter((e) => e.formation === f && e.type !== 'Torque Spike'));
    const counts = new Map<EventType, number>();
    events.forEach((e) => counts.set(e.type, (counts.get(e.type) ?? 0) + 1));
    const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const mws = pen.map((w) => w.mudWeight.byFormation[f]).filter(Boolean);
    const lo = mws.length ? Math.min(...mws.map((m) => m[0])) : undefined;
    const hi = mws.length ? Math.max(...mws.map((m) => m[1])) : undefined;
    return { f, pen: pen.length, incidents: events.length, common, mw: lo !== undefined ? `${lo.toFixed(2)}–${hi!.toFixed(2)} SG` : '—' };
  });
}

export default function DepthCorrelation() {
  const [params] = useSearchParams();
  const { bitDepth } = useApp();
  const [selected, setSelected] = useState<string[]>(() => defaultSelection(params.get('wells')));
  const [mode, setMode] = useState<DepthMode>('MD');
  const [align, setAlign] = useState(false);
  const [alignTo, setAlignTo] = useState('Tipam');
  const [fromSurface, setFromSurface] = useState(false);
  useShotReady();

  const wells = byDistance.filter((w) => selected.includes(w.name));
  const columns = useMemo(() => buildColumns(wells, mode, align ? alignTo : null), [wells, mode, align, alignTo]);
  const rows = summary(wells);
  const toggle = (n: string) => setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  return (
    <div className="p-4">
      <PageHeader
        title="Depth Correlation"
        subtitle="Compare the active well with offset wells by depth and formation. Formation tops are correlated across wells; events are shown at the depth they happened."
      />
      <div className="flex gap-3">
        <aside className="card w-[250px] flex-none self-start">
          <div className="card-h">Wells to compare</div>
          <div className="space-y-1 p-3 text-[0.9rem]">
            <label className="flex items-center gap-2 font-semibold text-[#a84f0c]">
              <input type="checkbox" checked disabled /> {ACTIVE.name}
            </label>
            {byDistance.map((w) => (
              <label key={w.name} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={selected.includes(w.name)} onChange={() => toggle(w.name)} />
                <span className="w-[48px] font-semibold">{w.name}</span>
                <span className="dot" style={{ background: ISSUE_COLORS[w.mainIssue], width: 8, height: 8 }} />
                <span className="ml-auto text-[0.82rem] text-muted">{w.distanceKm.toFixed(1)} km</span>
              </label>
            ))}
          </div>
          <div className="border-t border-line p-3">
            <div className="label mb-1.5">Depth reference</div>
            <div className="flex overflow-hidden rounded-[3px] border border-line text-[0.85rem]">
              {(['MD', 'TVD'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 px-2 py-1 ${mode === m ? 'bg-navy font-semibold text-white' : 'bg-white hover:bg-hover'}`}>
                  {m === 'MD' ? 'Measured Depth' : 'True Vertical (TVD)'}
                </button>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.9rem]">
              <input type="checkbox" checked={align} onChange={(e) => setAlign(e.target.checked)} /> Align by formation top
            </label>
            <select className="input mt-1.5 w-full" value={alignTo} disabled={!align} onChange={(e) => setAlignTo(e.target.value)}>
              {FORMATIONS.slice(1, 5).map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.9rem]">
              <input type="checkbox" checked={fromSurface} onChange={(e) => setFromSurface(e.target.checked)} /> Show from surface
            </label>
          </div>
          <div className="border-t border-line p-3 text-[0.82rem] leading-relaxed text-muted">
            <div className="label mb-1">Key</div>
            <div className="flex items-center gap-2">
              <svg width="16" height="10"><path d="M0 10h10L0 0z" fill="#111827" /></svg> Casing shoe (grey = planned)
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="10"><path d="M0 5h16" stroke="#E67E22" strokeWidth="2" strokeDasharray="4 3" /></svg> Current bit depth
            </div>
            <div>Faded band = planned section of active well.</div>
            <div className="mt-1">Scroll on the chart to zoom depth.</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-3">
          <section className="card">
            <div className="card-h">
              <span>
                Correlation panel <span className="font-normal text-muted">· {mode === 'MD' ? 'measured depth' : 'true vertical depth'}{align ? ` · aligned on ${alignTo} top` : ''}</span>
              </span>
              <span className="flex items-center gap-3 text-[0.8rem] font-normal text-muted">
                Bit at {fmtM(bitDepth)} m MD
              </span>
            </div>
            <DepthView columns={columns} bitDepth={bitDepth} mode={mode} height={470} fromDepth={fromSurface ? 0 : 2000} />
          </section>

          <section className="card">
            <div className="card-h">
              <span>Formation-wise summary</span>
              <span className="text-[0.82rem] font-normal text-muted">Selected offset wells ({wells.length}) · torque spikes excluded from incident count</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Formation</th>
                  <th className="num">Top in active well</th>
                  <th className="num">Wells drilled through</th>
                  <th className="num">Incidents</th>
                  <th>Most common problem</th>
                  <th>Typical MW used</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.f}>
                    <td className="font-semibold">{r.f}</td>
                    <td className="num">{fmtM(ACTIVE.formationTops.find((t) => t.name === r.f)!.top)} m</td>
                    <td className="num">{r.pen}</td>
                    <td className="num">{r.incidents}</td>
                    <td>
                      {r.common ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="dot" style={{ background: ISSUE_COLORS[r.common[0]] }} />
                          {r.common[0]} ({r.common[1]})
                        </span>
                      ) : (
                        <span className="text-muted">None recorded</span>
                      )}
                    </td>
                    <td>{r.mw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
