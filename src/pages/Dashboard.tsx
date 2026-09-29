import MapView from '../components/MapView';
import SidePanel from '../components/SidePanel';
import { FILTERS, ISSUE_COLORS, ISSUE_LABEL } from '../lib/constants';
import { useApp } from '../state/AppState';

function SummaryCard({ label, value, note, accent }: { label: string; value: React.ReactNode; note: string; accent?: string }) {
  return (
    <div className="card px-4 py-2.5" style={accent ? { borderTop: `3px solid ${accent}` } : undefined}>
      <div className="text-[0.85rem] text-muted">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-[1.75rem] font-bold leading-tight text-ink">{value}</span>
        <span className="text-[0.82rem] text-muted">{note}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role, wellsInRadius, alerts, radiusKm, filter, setFilter } = useApp();
  const office = role === 'office';
  const withIncidents = wellsInRadius.filter((w) => w.events.length > 0).length;
  const npt = wellsInRadius.reduce((s, w) => s + w.nptHours, 0);
  const high = alerts.filter((a) => a.severity === 'HIGH').length;
  const count = (f: (typeof FILTERS)[number]) => (f === 'All' ? wellsInRadius.length : wellsInRadius.filter((w) => w.mainIssue === f).length);

  return (
    <div className="flex h-full min-h-[760px] flex-col p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="text-[1.35rem] font-semibold">Dashboard – Nearby Wells Map</h1>
        <span className="text-[0.85rem] text-muted">Offset wells within {radiusKm} km of the active well · sample data</span>
      </div>

      {office && (
        <div className="mb-3 grid flex-none grid-cols-4 gap-3">
          <SummaryCard label="Offset wells in radius" value={wellsInRadius.length} note={`within ${radiusKm} km`} />
          <SummaryCard label="Wells with past incidents" value={withIncidents} note={`of ${wellsInRadius.length} wells`} />
          <SummaryCard label="Total NPT (offset wells)" value={`${npt} h`} note="non-productive time" />
          <SummaryCard label="Active alerts" value={alerts.length} note={`${high} high`} accent={high ? '#C0392B' : undefined} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-3">
        <section className="card flex min-w-0 flex-col" style={{ flex: office ? '0 0 65%' : '0 0 58%' }}>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
            <span className="mr-1 text-[0.85rem] font-semibold text-muted">Show:</span>
            {FILTERS.map((f) => (
              <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {f !== 'All' && <span className="dot" style={{ background: ISSUE_COLORS[f] }} />}
                {f === 'All' ? 'All' : ISSUE_LABEL[f]} ({count(f)})
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <MapView />
          </div>
        </section>
        <div className="min-w-0 flex-1">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
