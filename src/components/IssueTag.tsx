import type { EventType, MainIssue, RiskLevel, Severity } from '../types';
import { ISSUE_COLORS, ISSUE_LABEL, RISK_COLORS, SEVERITY_COLORS } from '../lib/constants';

export function IssueTag({ issue }: { issue: MainIssue | EventType }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="dot" style={{ background: ISSUE_COLORS[issue] }} />
      {ISSUE_LABEL[issue]}
    </span>
  );
}

export function SeverityBadge({ severity, large }: { severity: Severity; large?: boolean }) {
  return (
    <span
      className={`inline-block rounded-[2px] font-bold tracking-wide text-white ${large ? 'px-2 py-0.5 text-[0.85rem]' : 'px-1.5 py-[1px] text-[0.72rem]'}`}
      style={{ background: SEVERITY_COLORS[severity] }}
    >
      {severity}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className="inline-block rounded-[2px] px-1.5 py-[1px] text-[0.72rem] font-bold uppercase tracking-wide text-white" style={{ background: RISK_COLORS[level] }}>
      {level}
    </span>
  );
}

export function MethodBadge({ method }: { method: 'Model' | 'Rule-based' }) {
  const model = method === 'Model';
  return (
    <span
      className="inline-block rounded-[2px] border px-1.5 py-[1px] text-[0.72rem] font-semibold"
      style={{ borderColor: model ? '#0B3D91' : '#6B7280', color: model ? '#0B3D91' : '#4B5563', background: model ? '#EAF0FA' : '#F3F4F6' }}
    >
      {method}
    </span>
  );
}

export function WellChip({ name, onClick }: { name: string; onClick?: () => void }) {
  const cls = 'chip font-semibold text-navy';
  return onClick ? (
    <button className={cls} onClick={onClick} style={{ padding: '0.12rem 0.5rem', fontSize: '0.82rem' }}>
      {name}
    </button>
  ) : (
    <span className={cls}>{name}</span>
  );
}

export function Confidence({ value }: { value: number }) {
  const color = value >= 0.9 ? '#1E8449' : value >= 0.75 ? '#D68910' : '#C0392B';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-block h-[6px] w-[56px] bg-[#e5e7eb]">
        <span className="absolute inset-y-0 left-0" style={{ width: `${value * 100}%`, background: color }} />
      </span>
      <span className="w-[36px] text-right text-[0.85rem] tabular-nums" style={{ color }}>
        {Math.round(value * 100)}%
      </span>
    </span>
  );
}
