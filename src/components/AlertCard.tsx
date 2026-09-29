import { useNavigate } from 'react-router';
import type { ComputedAlert } from '../types';
import { SEVERITY_COLORS } from '../lib/constants';
import { fmtM } from '../lib/format';
import { SeverityBadge, WellChip } from './IssueTag';

interface Props {
  alert: ComputedAlert;
  size?: 'compact' | 'normal' | 'large';
}

export default function AlertCard({ alert: a, size = 'normal' }: Props) {
  const nav = useNavigate();
  const large = size === 'large';
  const compact = size === 'compact';
  const ahead = a.kind === 'Pattern match' ? 'At bit (trend)' : a.distanceAhead > 0 ? `${fmtM(a.distanceAhead)} m ahead` : 'Bit in zone';
  if (compact)
    return (
      <div className="card overflow-hidden" style={{ borderLeft: `4px solid ${SEVERITY_COLORS[a.severity]}` }}>
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={a.severity} />
            <span className="truncate text-[0.95rem] font-semibold">{a.title}</span>
            <span className="ml-auto whitespace-nowrap text-[0.82rem] font-semibold text-ink">{ahead}</span>
          </div>
          <p className="mt-1 text-[0.88rem] leading-snug">{a.text}</p>
          <div className="mt-1.5 flex items-start gap-2">
            <div className="flex-1 border-l-2 border-risk-green bg-[#f1f8f3] px-2 py-1 text-[0.84rem] leading-snug">
              <span className="font-semibold text-risk-green">What worked: </span>
              {a.whatWorked}
              {a.workedWells.length > 0 && <span className="text-muted"> ({a.workedWells.join(', ')})</span>}
            </div>
            <button className="btn btn-sm" onClick={() => nav(`/ask?q=${a.question}`)}>
              Why?
            </button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="card overflow-hidden" style={{ borderLeft: `4px solid ${SEVERITY_COLORS[a.severity]}` }}>
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={a.severity} large={large} />
          <span className={`font-semibold ${large ? 'text-[1.1rem]' : 'text-[1rem]'}`}>{a.title}</span>
          <span className="ml-auto text-[0.8rem] text-muted">{a.kind}</span>
          <button className="btn btn-sm" onClick={() => nav(`/ask?q=${a.question}`)}>
            Why?
          </button>
        </div>
        <div className={`mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-muted ${large ? 'text-[0.95rem]' : 'text-[0.84rem]'}`}>
          <span>
            Formation: <b className="text-ink">{a.formation}</b>
          </span>
          <span>
            Distance: <b className="text-ink">{ahead}</b>
          </span>
        </div>
        <p className={`mt-1.5 ${large ? 'text-[1.08rem] leading-snug' : 'text-[0.95rem]'}`}>{a.text}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.82rem] text-muted">Offset wells:</span>
          {a.involvedWells.map((w) => (
            <WellChip key={w} name={w} />
          ))}
        </div>
        <div className={`mt-2 border-l-2 border-risk-green bg-[#f1f8f3] px-2.5 py-1.5 ${large ? 'text-[1rem]' : 'text-[0.88rem]'}`}>
          <span className="font-semibold text-risk-green">What worked in offset wells: </span>
          {a.whatWorked}
          {a.workedWells.length > 0 && <span className="text-muted"> ({a.workedWells.join(', ')})</span>}
        </div>
      </div>
    </div>
  );
}
