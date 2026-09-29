import { Link } from 'react-router';
import { useApp } from '../state/AppState';
import AlertCard from './AlertCard';
import WellsTable from './WellsTable';

/** Right-hand dashboard column: top alerts + nearby wells table. */
export default function SidePanel() {
  const { alerts, wellsInRadius, focusWell, focus, role, radiusKm } = useApp();
  const field = role === 'field';
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section className="card flex-none">
        <div className="card-h">
          <span>Alerts ahead of the bit</span>
          <Link to="/alerts" className="text-[0.85rem] font-normal text-navy underline">
            All {alerts.length} alerts
          </Link>
        </div>
        <div className="space-y-2 p-2.5">
          {alerts.slice(0, 3).map((a) => (
            <AlertCard key={a.id} alert={a} size={field ? 'large' : 'compact'} />
          ))}
          {alerts.length === 0 && <div className="p-3 text-muted">No alerts for wells in the current radius.</div>}
        </div>
      </section>
      <section className="card flex min-h-0 flex-1 flex-col">
        <div className="card-h">
          <span>Nearby wells</span>
          <span className="text-[0.82rem] font-normal text-muted">within {radiusKm} km · click a row to show on map</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <WellsTable wells={wellsInRadius} selected={focus?.name} onSelect={focusWell} />
        </div>
      </section>
    </div>
  );
}
