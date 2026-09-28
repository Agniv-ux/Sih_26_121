import type { ComputedAlert } from '../types';
import { SEVERITY_STYLE } from '../lib/constants';
import { fmtM } from '../lib/format';

interface Props {
  alert: ComputedAlert;
  onWhy: (qaId: string) => void;
}

export default function AlertCard({ alert, onWhy }: Props) {
  const sev = SEVERITY_STYLE[alert.severity];
  const ahead = alert.distanceAhead;
  const headline = ahead > 0 ? alert.headline.replace('{d}', fmtM(ahead)) : `${alert.targetLabel} reached — bit is at or below ${fmtM(alert.targetDepth)} m.`;

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-panel pl-5 pr-4 py-3.5">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: sev.color }} />
      <div className="flex items-center gap-2.5">
        <span
          className="rounded px-2 py-0.5 text-[0.72rem] font-bold tracking-wider"
          style={{ color: sev.color, background: sev.color + '22', border: `1px solid ${sev.color}66` }}
        >
          {sev.label}
        </span>
        <span className="text-[0.85rem] font-semibold text-ink">{alert.formation}</span>
        <span className="text-line">|</span>
        <span className="text-[0.85rem] text-muted">
          <span className="font-semibold text-ink">{ahead > 0 ? `${fmtM(ahead)} m` : '0 m'}</span> ahead of bit · {alert.targetLabel} {fmtM(alert.targetDepth)}{' '}
          m
        </span>
        <button
          type="button"
          onClick={() => onWhy(alert.whyQaId)}
          className="ml-auto rounded-md border border-line px-3 py-1 text-[0.8rem] font-medium text-ink hover:border-accent hover:text-accent"
        >
          Why?
        </button>
      </div>

      <p className="mt-2 text-[0.95rem] leading-snug text-ink">
        <span className="font-semibold">{headline}</span> {alert.findingText}
      </p>

      <div className="mt-2.5 flex items-center gap-2 text-[0.8rem]">
        <span className="text-muted">Offset wells</span>
        {alert.involvedWells.map((w) => (
          <span key={w} className="rounded border border-line bg-bg px-1.5 py-0.5 font-medium text-ink">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-2.5 rounded-md border border-line bg-bg/60 px-3 py-2 text-[0.85rem] leading-snug">
        <span className="font-semibold text-ok">What worked: </span>
        <span className="text-ink">
          {alert.whatWorked}
          {alert.whatWorkedWells.length > 0 && <span className="text-muted"> ({alert.whatWorkedWells.join(', ')})</span>}
        </span>
      </div>
    </article>
  );
}
