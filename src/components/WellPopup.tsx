import type { OffsetWell } from '../types';
import { fmtHrs, fmtKm, fmtM } from '../lib/format';
import { IssueDot } from './IssueTag';
import { ISSUE_COLORS, ISSUE_SHORT } from '../lib/constants';

interface Props {
  well: OffsetWell;
  onViewDepth: (name: string) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-[14px] font-semibold text-ink">{value}</div>
    </div>
  );
}

export default function WellPopup({ well, onViewDepth }: Props) {
  return (
    <div className="w-[356px] p-4">
      <div className="flex items-center gap-2 pr-6">
        <span className="text-[17px] font-bold text-ink">{well.name}</span>
        <span
          className="ml-1 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[12px] font-medium"
          style={{ borderColor: ISSUE_COLORS[well.mainIssue] + '80', color: '#E5E7EB' }}
        >
          <IssueDot issue={well.mainIssue} size={8} />
          {ISSUE_SHORT[well.mainIssue]}
        </span>
        <span className="text-[12px] capitalize text-muted">{well.type}</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 border-y border-line py-2.5">
        <Field label="Distance" value={`${fmtKm(well.distanceKm)} km`} />
        <Field label="Drilled" value={String(well.year)} />
        <Field label="TD" value={`${fmtM(well.td)} m`} />
        <Field label="NPT" value={`${fmtHrs(well.nptHours)} h`} />
      </div>

      <div className="mt-2.5 space-y-1 text-[12.5px] leading-snug">
        <div className="flex flex-wrap gap-x-2">
          <span className="text-muted">Formations</span>
          {well.formationTops.map((f) => (
            <span key={f.name} className="whitespace-nowrap">
              {f.name} <span className="text-muted">{fmtM(f.top)}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-2.5">
          <span className="text-muted">Casing</span>
          {well.casing.map((c) => (
            <span key={c.size} className="whitespace-nowrap">
              {c.size} @ {fmtM(c.shoe)} m
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 text-[11px] uppercase tracking-wider text-muted">Events ({well.events.length})</div>
      <ul className="mt-1.5 space-y-1.5">
        {well.events.map((e) => (
          <li key={e.depth + e.type} className="rounded-md bg-bg/60 border border-line px-2.5 py-1.5">
            <div className="flex items-center gap-2 text-[12.5px]">
              <IssueDot issue={e.type} size={8} />
              <span className="font-semibold">{e.type}</span>
              <span className="text-muted">
                {fmtM(e.depth)} m · {e.formation}
              </span>
              <span className="ml-auto text-muted">{fmtHrs(e.timeLost)} h lost</span>
            </div>
            <div className="mt-0.5 text-[12px] text-ink/80 leading-snug">{e.action}</div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onViewDepth(well.name)}
        className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg hover:bg-amber-400"
      >
        View depth comparison
      </button>
    </div>
  );
}
