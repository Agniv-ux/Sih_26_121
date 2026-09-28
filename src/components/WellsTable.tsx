import { useMemo, useState } from 'react';
import type { OffsetWell } from '../types';
import { fmtHrs, fmtKm } from '../lib/format';
import IssueTag from './IssueTag';

type SortKey = 'name' | 'distanceKm' | 'mainIssue' | 'nptHours' | 'events';

interface Props {
  wells: OffsetWell[];
  radiusKm: number;
  selectedWell: string | null;
  onRowClick: (name: string) => void;
}

const COLS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Well', align: 'left' },
  { key: 'distanceKm', label: 'Dist. (km)', align: 'right' },
  { key: 'mainIssue', label: 'Main issue', align: 'left' },
  { key: 'nptHours', label: 'NPT (h)', align: 'right' },
  { key: 'events', label: 'Events', align: 'right' },
];

export default function WellsTable({ wells, radiusKm, selectedWell, onRowClick }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'distanceKm', dir: 1 });

  const rows = useMemo(() => {
    const val = (w: OffsetWell) => (sort.key === 'events' ? w.events.length : w[sort.key]);
    return [...wells].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * sort.dir;
    });
  }, [wells, sort]);

  const totalNpt = wells.reduce((s, w) => s + w.nptHours, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[1rem] font-semibold">Offset wells within {radiusKm} km</h3>
        <span className="text-[0.8rem] text-muted">Click a row to locate the well on the map</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full whitespace-nowrap text-[0.9rem]">
          <thead className="bg-panel-2 text-[0.75rem] uppercase tracking-wider text-muted">
            <tr>
              {COLS.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 font-medium ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink ${sort.key === c.key ? 'text-ink' : ''}`}
                    onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (-s.dir as 1 | -1) : 1 }))}
                  >
                    {c.label}
                    <span className={`text-[0.65rem] ${sort.key === c.key ? 'text-accent' : 'text-line'}`}>
                      {sort.key === c.key && sort.dir === -1 ? '▼' : '▲'}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr
                key={w.name}
                onClick={() => onRowClick(w.name)}
                className={`cursor-pointer border-t border-line ${selectedWell === w.name ? 'bg-accent/10' : 'bg-panel hover:bg-panel-2'}`}
              >
                <td className="px-3 py-2.5 font-semibold">{w.name}</td>
                <td className="px-3 py-2.5 text-right">{fmtKm(w.distanceKm)}</td>
                <td className="px-3 py-2.5">
                  <IssueTag issue={w.mainIssue} />
                </td>
                <td className="px-3 py-2.5 text-right">{fmtHrs(w.nptHours)}</td>
                <td className="px-3 py-2.5 text-right text-muted">{w.events.length}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="bg-panel px-3 py-6 text-center text-muted">
                  No offset wells within {radiusKm} km. Increase the search radius.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t border-line bg-panel-2 text-[0.85rem] text-muted">
              <tr>
                <td className="px-3 py-2" colSpan={3}>
                  {rows.length} wells
                </td>
                <td className="px-3 py-2 text-right font-semibold text-ink">{fmtHrs(totalNpt)}</td>
                <td className="px-3 py-2 text-right">{wells.reduce((s, w) => s + w.events.length, 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
