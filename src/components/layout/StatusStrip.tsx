import { useApp } from '../../state/AppState';
import { ACTIVE } from '../../data';
import { fmtM } from '../../lib/format';

function Item({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted">{label}</span>
      <span className={strong ? 'font-semibold text-ink' : 'text-ink'}>{value}</span>
    </span>
  );
}

export default function StatusStrip() {
  const { bitDepth, formation, running, toggleRunning } = useApp();
  return (
    <div className="flex h-[36px] flex-none items-center gap-6 border-b border-line bg-white px-5 text-[0.88rem]">
      <Item label="Active well" value={<span className="font-semibold text-[#a84f0c]">{ACTIVE.name}</span>} />
      <span className="text-line">|</span>
      <Item label="Bit depth" value={`${fmtM(bitDepth)} m MD`} strong />
      <span className="text-line">|</span>
      <Item label="Current formation" value={formation} strong />
      <span className="text-line">|</span>
      <span className="flex items-center gap-1.5">
        <span className="text-muted">eRTMAC feed:</span>
        <span className="dot" style={{ background: '#1E8449', width: 8, height: 8 }} />
        <span>Connected (simulated)</span>
      </span>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-[0.82rem] text-muted">Live simulation: {running ? 'running' : 'paused'}</span>
        <button className="btn btn-sm" onClick={toggleRunning} aria-label={running ? 'Pause simulation' : 'Play simulation'}>
          {running ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <rect x="2" y="1.5" width="2.8" height="9" fill="currentColor" />
              <rect x="7.2" y="1.5" width="2.8" height="9" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M3 1.5 L10.5 6 L3 10.5 Z" fill="currentColor" />
            </svg>
          )}
          {running ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
