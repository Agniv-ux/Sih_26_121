import type { OffsetWell } from '../types';
import { IssueTag } from './IssueTag';

interface Props {
  wells: OffsetWell[];
  selected?: string | null;
  onSelect: (name: string) => void;
}

/** Compact "Nearby wells" table on the dashboard. */
export default function WellsTable({ wells, selected, onSelect }: Props) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Well</th>
          <th className="num">Distance km</th>
          <th>Main issue</th>
          <th className="num">NPT h</th>
        </tr>
      </thead>
      <tbody>
        {wells.map((w) => (
          <tr key={w.name} className={`clickable ${selected === w.name ? 'selected' : ''}`} onClick={() => onSelect(w.name)} title={`Show ${w.name} on the map`}>
            <td className="font-semibold text-navy">{w.name}</td>
            <td className="num">{w.distanceKm.toFixed(1)}</td>
            <td>
              <IssueTag issue={w.mainIssue} />
            </td>
            <td className="num">{w.nptHours}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="text-[0.85rem] text-muted">
          <td className="px-[0.6rem] py-1.5">{wells.length} wells</td>
          <td />
          <td className="px-[0.6rem] py-1.5 text-right">Total</td>
          <td className="num px-[0.6rem] py-1.5 font-semibold text-ink">{wells.reduce((s, w) => s + w.nptHours, 0)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
