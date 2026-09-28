import type { FormationTop, RiskInterval } from '../types';
import { RISK_COLORS, RISK_WINDOW_M } from '../lib/constants';
import { fmtM } from '../lib/format';

interface Props {
  intervals: RiskInterval[];
  bitDepth: number;
  activeTops: FormationTop[];
}

const LEVEL_LABEL = { low: 'Low', medium: 'Medium', high: 'High' } as const;

export default function RiskStrip({ intervals, bitDepth, activeTops }: Props) {
  const end = bitDepth + RISK_WINDOW_M;
  const pct = (d: number) => ((d - bitDepth) / RISK_WINDOW_M) * 100;
  const tops = activeTops.filter((t) => t.top > bitDepth && t.top < end);
  const labels = intervals
    .filter((_, i) => i % 2 === 0)
    .map((iv) => iv.from)
    .concat(end);

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-[1rem] font-semibold text-ink">Risk ahead</h3>
          <p className="text-[0.8rem] text-muted">Next {RISK_WINDOW_M} m below the bit · 25 m intervals</p>
        </div>
        <div className="flex gap-3 text-[0.8rem] text-muted">
          {(['low', 'medium', 'high'] as const).map((l) => (
            <span key={l} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RISK_COLORS[l] }} />
              {LEVEL_LABEL[l]}
            </span>
          ))}
        </div>
      </div>

      {/* Formation tops inside the window */}
      <div className="relative mt-3 h-5">
        {tops.map((t) => (
          <div
            key={t.name}
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[0.78rem] font-medium text-ink"
            style={{ left: `${pct(t.top)}%` }}
          >
            {t.name} top {fmtM(t.top)} m
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="flex h-9 gap-[2px]">
          {intervals.map((iv) => (
            <div
              key={iv.from}
              className="flex-1 first:rounded-l last:rounded-r"
              style={{ background: RISK_COLORS[iv.level], opacity: iv.level === 'low' ? 0.75 : 0.9 }}
              title={`${fmtM(iv.from)}–${fmtM(iv.to)} m · ${iv.formation} · ${LEVEL_LABEL[iv.level]} risk${iv.wells.length ? ` (${iv.wells.join(', ')})` : ''}`}
            />
          ))}
        </div>
        {tops.map((t) => (
          <div key={t.name} className="absolute -top-1 -bottom-1 w-0.5 bg-ink" style={{ left: `calc(${pct(t.top)}% - 1px)` }} />
        ))}
      </div>
      <div className="relative mt-1.5 h-4 text-[0.75rem] text-muted">
        {labels.map((d, i) => (
          <span
            key={d}
            className="absolute whitespace-nowrap"
            style={{
              left: `${pct(d)}%`,
              transform: i === 0 ? 'none' : i === labels.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
            }}
          >
            {i === 0 ? `Bit ${fmtM(d)}` : fmtM(d)}
          </span>
        ))}
      </div>
    </section>
  );
}
