import type { OffsetWell } from '../types';
import { ISSUE_COLORS } from '../lib/constants';
import { fmtM, sourceLabel } from '../lib/format';
import { IssueTag } from './IssueTag';

interface Props {
  well: OffsetWell;
  onDepth: () => void;
  onReports: () => void;
}

export default function WellPopup({ well: w, onDepth, onReports }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 bg-navy px-3 py-2 text-white">
        <span className="text-[15px] font-bold">{w.name}</span>
        <span className="text-[12px] text-[#c9d6ee]">
          {w.distanceKm.toFixed(1)} km from active well · drilled {w.year}
        </span>
      </div>
      <div className="px-3 pt-2">
        <table className="w-full text-[12.5px]">
          <tbody>
            <Row k="Total depth" v={`${fmtM(w.td)} m MD${w.type === 'deviated' ? ` (${fmtM(w.tdTvd)} m TVD)` : ''} · ${w.type}`} />
            <Row k="Main issue" v={<IssueTag issue={w.mainIssue} />} />
            <Row k="Formations" v={w.formationTops.map((t) => `${t.name} ${fmtM(t.top)}`).join(' · ')} />
            <Row k="Casing" v={w.casing.map((c) => `${c.size} @ ${fmtM(c.shoe)} m`).join(' · ')} />
            <Row k="Mud weight" v={`${w.mudWeight.min.toFixed(2)}–${w.mudWeight.max.toFixed(2)} SG`} />
            <Row k="NPT" v={<b>{w.nptHours} h</b>} />
          </tbody>
        </table>
        <div className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Events ({w.events.length})</div>
        {w.events.length === 0 ? (
          <div className="py-1 text-[12.5px] text-muted">{w.note ?? 'No major drilling issue recorded.'}</div>
        ) : (
          <ul className="mt-1 max-h-[190px] space-y-1.5 overflow-auto">
            {w.events.map((e, i) => (
              <li key={i} className="border-l-[3px] pl-2 text-[12.5px]" style={{ borderColor: ISSUE_COLORS[e.type] }}>
                <b>{e.type}</b> · {fmtM(e.md)} m · {e.formation} · {e.timeLost} h lost
                <div className="text-[12px] text-muted">
                  {e.action} <span className="whitespace-nowrap">[{sourceLabel(e.source)}]</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-2 flex gap-2 border-t border-line px-3 py-2">
        <button className="btn btn-sm btn-primary" onClick={onDepth}>
          View in Depth Correlation
        </button>
        <button className="btn btn-sm" onClick={onReports}>
          Open source reports ({w.documents.length})
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <tr className="align-top">
      <td className="w-[86px] py-[2px] pr-2 text-muted">{k}</td>
      <td className="py-[2px]">{v}</td>
    </tr>
  );
}
