import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ACTIVE } from '../data';
import { RISK_AHEAD_M, RISK_COLORS, RISK_STEP_M, RISK_TYPE_LABEL } from '../lib/constants';
import { fmtM } from '../lib/format';
import { gridStart, riskProfile } from '../lib/risk';
import { useApp } from '../state/AppState';
import type { RiskType } from '../types';

/** "Risk ahead" strip: the next 300 m below the bit in 25 m intervals. */
export default function RiskStrip() {
  const nav = useNavigate();
  const { bitDepth, wellsInRadius } = useApp();
  const start = gridStart(bitDepth);
  const end = start + RISK_AHEAD_M;
  const intervals = useMemo(() => riskProfile(bitDepth, start + RISK_AHEAD_M, wellsInRadius), [bitDepth, start, wellsInRadius]);
  const pos = (d: number) => `${((d - start) / RISK_AHEAD_M) * 100}%`;
  const tops = ACTIVE.formationTops.filter((t) => t.top > start && t.top < end);
  const topType = (i: (typeof intervals)[number]) =>
    (Object.values(i.cells).sort((a, b) => b.p - a.p)[0]?.type ?? 'Mud Loss') as RiskType;

  return (
    <div className="px-4 pb-2 pt-2">
      {/* formation tops + bit marker row */}
      <div className="relative h-[22px] text-[0.8rem]">
        <span className="absolute -translate-x-1/2 font-semibold text-[#a84f0c]" style={{ left: pos(bitDepth) }}>
          ▼ Bit {fmtM(bitDepth)} m
        </span>
        {tops.map((t) => (
          <span key={t.name} className="absolute -translate-x-1/2 whitespace-nowrap font-semibold text-ink" style={{ left: pos(t.top) }}>
            {t.name} top {fmtM(t.top)} m
          </span>
        ))}
      </div>
      <div className="relative flex h-[46px] border border-line">
        {intervals.map((i) => (
          <button
            key={i.from}
            onClick={() => nav(`/risk?interval=${i.from}`)}
            className="flex flex-1 flex-col items-center justify-center border-r border-white text-[0.72rem] font-bold uppercase text-white last:border-r-0"
            style={{ background: RISK_COLORS[i.level] }}
            title={`${fmtM(i.from)}–${fmtM(i.to)} m · ${i.formation} · ${i.level} (${RISK_TYPE_LABEL[topType(i)]})`}
          >
            {i.level}
            {i.level !== 'low' && <span className="text-[0.66rem] font-semibold normal-case opacity-90">{RISK_TYPE_LABEL[topType(i)].replace('Overpressure / ', '')}</span>}
          </button>
        ))}
        {tops.map((t) => (
          <span key={t.name} className="pointer-events-none absolute -top-[4px] bottom-[-4px] w-[3px] -translate-x-1/2 bg-ink" style={{ left: pos(t.top) }} />
        ))}
        <span className="pointer-events-none absolute -top-[4px] bottom-[-4px] w-[3px] -translate-x-1/2 bg-accent" style={{ left: pos(bitDepth) }} />
      </div>
      <div className="relative mt-1 h-[18px] text-[0.76rem] text-muted">
        {intervals.map((i, k) =>
          k % 2 === 0 ? (
            <span key={i.from} className={`absolute ${k === 0 ? '' : '-translate-x-1/2'}`} style={{ left: pos(i.from) }}>
              {fmtM(i.from)}
            </span>
          ) : null,
        )}
        <span className="absolute -translate-x-full whitespace-nowrap" style={{ left: '100%' }}>
          {fmtM(end)} m
        </span>
      </div>
      <div className="mt-1 flex items-center gap-4 text-[0.8rem] text-muted">
        <span>Depth in m MD · {RISK_STEP_M} m intervals · click an interval for details</span>
        <span className="ml-auto flex items-center gap-3">
          {(['low', 'medium', 'high'] as const).map((l) => (
            <span key={l} className="flex items-center gap-1 capitalize">
              <span className="inline-block h-[10px] w-[16px]" style={{ background: RISK_COLORS[l] }} />
              {l}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
