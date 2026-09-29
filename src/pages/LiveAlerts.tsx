import AlertCard from '../components/AlertCard';
import RiskStrip from '../components/RiskStrip';
import LiveReadings from '../components/alerts/LiveReadings';
import PageHeader from '../components/ui/PageHeader';
import { useShotReady } from '../lib/useShotReady';
import { useApp } from '../state/AppState';

export default function LiveAlerts() {
  const { alerts, radiusKm, wellsInRadius, running, role } = useApp();
  useShotReady();
  const lookAhead = alerts.filter((a) => a.kind === 'Look-ahead').length;
  return (
    <div className="p-4">
      <PageHeader
        title="Live Alerts"
        subtitle={`Readings from eRTMAC (simulated) compared with ${wellsInRadius.length} offset wells within ${radiusKm} km. Alerts are advisory – the driller and company man decide.`}
      />
      <section className="card mb-3">
        <div className="card-h">
          <span>Live readings – last 30 minutes</span>
          <span className="text-[0.82rem] font-normal text-muted">{running ? 'Updating every 3 s (simulated)' : 'Simulation paused'}</span>
        </div>
        <LiveReadings />
      </section>
      <section className="card mb-3">
        <div className="card-h">
          <span>Risk ahead – next 300 m below the bit</span>
          <span className="text-[0.82rem] font-normal text-muted">Highest risk of any problem type per interval</span>
        </div>
        <RiskStrip />
      </section>
      <section className="card">
        <div className="card-h">
          <span>
            Alerts <span className="font-normal text-muted">– most urgent first</span>
          </span>
          <span className="text-[0.82rem] font-normal text-muted">
            {alerts.length} active · {lookAhead} look-ahead · {alerts.length - lookAhead} pattern match
          </span>
        </div>
        <div className={`grid gap-3 p-3 ${role === 'field' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} size={role === 'field' ? 'large' : 'normal'} />
          ))}
        </div>
      </section>
    </div>
  );
}
