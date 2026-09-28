import type { ReactNode } from 'react';
import { fmtM } from '../lib/format';

interface Props {
  wellName: string;
  bitDepth: number;
  formation: string;
  running: boolean;
  onToggleRunning: () => void;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-center px-5 border-l border-line first:border-l-0">
      <span className="text-[0.7rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      <span className="text-[1.05rem] font-semibold text-ink leading-tight whitespace-nowrap">{children}</span>
    </div>
  );
}

export default function Header({ wellName, bitDepth, formation, running, onToggleRunning }: Props) {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-5 bg-panel border-b border-line">
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline gap-3">
          <span className="text-[1.6rem] font-bold tracking-tight text-ink leading-none">NWIS</span>
          <span className="text-[1.05rem] text-ink/90 leading-none">Nearby Wells Intelligence System</span>
        </div>
        <span className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-muted">Team ALTITUDE</span>
      </div>

      <div className="flex items-stretch h-11">
        <Stat label="Active well">{wellName}</Stat>
        <Stat label="Bit depth">
          <span data-testid="bit-depth">{fmtM(bitDepth)}</span> <span className="text-muted font-normal">m MD</span>
        </Stat>
        <Stat label="Formation">{formation}</Stat>
        <div className="flex items-center gap-3 pl-5 border-l border-line">
          <div className="flex items-center gap-2 rounded-md border border-line bg-bg px-3 py-1.5">
            <span className={`h-2 w-2 rounded-full bg-ok ${running ? 'live-dot' : ''}`} />
            <span className="text-[0.85rem] font-medium text-ink whitespace-nowrap">eRTMAC · Live</span>
          </div>
          <button
            type="button"
            onClick={onToggleRunning}
            title={running ? 'Pause live simulation' : 'Resume live simulation'}
            aria-label={running ? 'Pause live simulation' : 'Resume live simulation'}
            className="h-8 w-8 grid place-items-center rounded-md border border-line text-muted hover:text-ink hover:border-muted"
          >
            {running ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2" y="1.5" width="3" height="9" rx="0.5" />
                <rect x="7" y="1.5" width="3" height="9" rx="0.5" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 1.5v9l7.5-4.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
