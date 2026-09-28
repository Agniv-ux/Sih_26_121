import { ISSUE_COLORS, ISSUE_SHORT } from '../lib/constants';
import type { MainIssue } from '../types';

export function IssueDot({ issue, size = 10 }: { issue: MainIssue | 'Torque Spike'; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: ISSUE_COLORS[issue] }} />;
}

export default function IssueTag({ issue }: { issue: MainIssue }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <IssueDot issue={issue} />
      <span>{ISSUE_SHORT[issue]}</span>
    </span>
  );
}
