import { useEffect, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { CustomChart, ScatterChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ActiveWell, Casing, EventType, FormationTop, OffsetWell, WellEvent } from '../types';
import { FORMATION_COLORS, ISSUE_COLORS, ISSUE_SHORT } from '../lib/constants';
import { fmtHrs, fmtKm, fmtM } from '../lib/format';

echarts.use([CustomChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, DataZoomComponent, CanvasRenderer]);

interface Props {
  active: ActiveWell;
  wells: OffsetWell[];
  bitDepth: number;
  radiusKm: number;
  focusWell: string | null;
  onClose: () => void;
  onReady?: () => void;
}

interface Column {
  name: string;
  sub: string;
  td: number;
  tops: FormationTop[];
  casing: Casing[];
  events: WellEvent[];
  isActive: boolean;
}

interface Band {
  x: number;
  well: string;
  formation: string;
  top: number;
  base: number;
  planned: boolean;
  label: boolean;
}

const BW = 0.34; // column width as a share of the category width
const Y_MAX = 4300;
const EVENT_TYPES: EventType[] = ['Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'Torque Spike'];

function bandsFor(col: Column, x: number, bitDepth: number): Band[] {
  const out: Band[] = [];
  col.tops.forEach((t, i) => {
    const base = Math.min(col.tops[i + 1]?.top ?? col.td, col.td);
    if (base <= t.top) return;
    if (col.isActive && bitDepth > t.top && bitDepth < base) {
      out.push({ x, well: col.name, formation: t.name, top: t.top, base: bitDepth, planned: false, label: false });
      out.push({ x, well: col.name, formation: t.name, top: bitDepth, base, planned: true, label: false });
    } else {
      out.push({ x, well: col.name, formation: t.name, top: t.top, base, planned: col.isActive && t.top >= bitDepth, label: false });
    }
  });
  return out;
}

function buildOption(cols: Column[], bitDepth: number) {
  const bands = cols.flatMap((c, x) => bandsFor(c, x, bitDepth));

  // Formation labels (active column, centred in the whole formation interval).
  const labels = cols[0].tops
    .map((t, i) => ({ name: t.name, top: t.top, base: Math.min(cols[0].tops[i + 1]?.top ?? cols[0].td, cols[0].td) }))
    .filter((l) => l.base > l.top);

  // Correlation fills between adjacent columns.
  const links: { x: number; tl: number; bl: number; tr: number; br: number; f: string }[] = [];
  for (let x = 0; x < cols.length - 1; x++) {
    const a = cols[x];
    const b = cols[x + 1];
    a.tops.forEach((t, i) => {
      const j = b.tops.findIndex((u) => u.name === t.name);
      if (j < 0) return;
      const bl = Math.min(a.tops[i + 1]?.top ?? a.td, a.td);
      const br = Math.min(b.tops[j + 1]?.top ?? b.td, b.td);
      if (bl > t.top && br > b.tops[j].top) links.push({ x, tl: t.top, bl, tr: b.tops[j].top, br, f: t.name });
    });
  }

  const casing = cols.flatMap((c, x) => c.casing.map((cs, k) => ({ x, ...cs, rank: c.casing.length - 1 - k, planned: cs.status === 'planned', well: c.name })));

  const eventSeries = EVENT_TYPES.map((type) => ({
    name: type,
    type: 'scatter' as const,
    z: 5,
    symbol: type === 'Torque Spike' ? 'diamond' : 'circle',
    symbolSize: type === 'Torque Spike' ? 10 : 15,
    // Torque spikes sit beside the column centre so they never hide a major event.
    symbolOffset: type === 'Torque Spike' ? [22, 0] : [0, 0],
    itemStyle: { color: ISSUE_COLORS[type], borderColor: '#0F172A', borderWidth: 2, opacity: 1 },
    label: {
      show: type !== 'Torque Spike',
      position: 'right' as const,
      distance: 8,
      color: '#E5E7EB',
      fontSize: 12,
      fontWeight: 600,
      backgroundColor: 'rgba(15,23,42,0.88)',
      borderColor: '#334155',
      borderWidth: 1,
      borderRadius: 3,
      padding: [3, 6],
      formatter: (p: { data: { ev: WellEvent } }) => `${ISSUE_SHORT[p.data.ev.type]} · ${fmtHrs(p.data.ev.timeLost)} h`,
    },
    labelLayout: { moveOverlap: 'shiftY' as const },
    data: cols.flatMap((c, x) =>
      c.events
        .filter((e) => e.type === type)
        .map((e) => ({
          value: [x, e.depth],
          ev: e,
          well: c.name,
          // Keep labels readable: drop a minor event's label when a bigger one in the same well is within 150 m.
          label: {
            show:
              type !== 'Torque Spike' &&
              !c.events.some((o) => o !== e && o.type !== 'Torque Spike' && Math.abs(o.depth - e.depth) < 150 && o.timeLost > e.timeLost),
          },
        })),
    ),
    tooltip: {
      formatter: (p: { data: { ev: WellEvent; well: string } }) => {
        const e = p.data.ev;
        return `<div style="font-weight:700;font-size:13px;margin-bottom:4px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${ISSUE_COLORS[e.type]};margin-right:6px"></span>${p.data.well} · ${e.type}</div>
          <div style="color:#94A3B8">${fmtM(e.depth)} m · ${e.formation} · ${fmtHrs(e.timeLost)} h lost</div>
          <div style="margin-top:6px">${e.description}</div>
          <div style="margin-top:4px"><span style="color:#94A3B8">Action:</span> ${e.action}</div>
          <div style="margin-top:4px"><span style="color:#94A3B8">Result:</span> ${e.result}</div>
          <div style="margin-top:6px;color:#94A3B8;font-size:11px">Source: ${e.source}</div>`;
      },
    },
  }));

  return {
    // No animation: the live bit depth re-renders the chart every few seconds.
    animation: false,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Inter Variable, Inter, system-ui, sans-serif' },
    grid: { left: 78, right: 36, top: 64, bottom: 44 },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      textStyle: { color: '#E5E7EB', fontSize: 12 },
      extraCssText: 'box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:340px;white-space:normal;border-radius:8px;',
    },
    xAxis: {
      type: 'category',
      position: 'top',
      data: cols.map((c) => c.name),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        interval: 0,
        margin: 14,
        formatter: (_: string, i: number) => `{n|${cols[i].name}}\n{s|${cols[i].sub}}`,
        rich: {
          n: { color: '#E5E7EB', fontSize: 14, fontWeight: 700, lineHeight: 20 },
          s: { color: '#94A3B8', fontSize: 12, lineHeight: 16 },
        },
      },
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: 0,
      max: Y_MAX,
      interval: 500,
      name: 'Depth TVD (m)',
      nameLocation: 'middle',
      nameGap: 58,
      nameTextStyle: { color: '#94A3B8', fontSize: 12 },
      axisLine: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 12, showMaxLabel: false, formatter: (v: number) => fmtM(v) },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.6 } },
    },
    dataZoom: [{ type: 'inside', yAxisIndex: 0, filterMode: 'none', minValueSpan: 400 }],
    series: [
      {
        name: 'links',
        type: 'custom',
        silent: true,
        z: 1,
        clip: true,
        data: links.map((_, i) => i),
        renderItem: (params: { dataIndex: number }, api: any) => {
          const l = links[params.dataIndex];
          const w = api.size([1, 0])[0] * BW;
          const [xa, ya1] = api.coord([l.x, l.tl]);
          const [, ya2] = api.coord([l.x, l.bl]);
          const [xb, yb1] = api.coord([l.x + 1, l.tr]);
          const [, yb2] = api.coord([l.x + 1, l.br]);
          return {
            type: 'polygon',
            shape: {
              points: [
                [xa + w / 2, ya1],
                [xb - w / 2, yb1],
                [xb - w / 2, yb2],
                [xa + w / 2, ya2],
              ],
            },
            style: { fill: FORMATION_COLORS[l.f], opacity: 0.22 },
          };
        },
      },
      {
        name: 'formations',
        type: 'custom',
        z: 2,
        clip: true,
        data: bands.map((_, i) => i),
        tooltip: {
          formatter: (p: { dataIndex: number }) => {
            const b = bands[p.dataIndex];
            return `<b>${b.well}</b> · ${b.formation}<br/><span style="color:#94A3B8">${fmtM(b.top)}–${fmtM(b.base)} m TVD${b.planned ? ' (planned)' : ''}</span>`;
          },
        },
        renderItem: (params: { dataIndex: number }, api: any) => {
          const b = bands[params.dataIndex];
          const w = api.size([1, 0])[0] * BW;
          const [cx, y1] = api.coord([b.x, b.top]);
          const [, y2] = api.coord([b.x, b.base]);
          return {
            type: 'rect',
            shape: { x: cx - w / 2, y: y1, width: w, height: y2 - y1 },
            style: {
              fill: FORMATION_COLORS[b.formation],
              opacity: b.planned ? 0.4 : 0.95,
              stroke: '#0F172A',
              lineWidth: 1,
            },
          };
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#F59E0B', type: 'dashed', width: 2 },
          label: {
            formatter: `Bit depth ${fmtM(bitDepth)} m MD`,
            position: 'insideStartTop',
            color: '#0F172A',
            backgroundColor: '#F59E0B',
            padding: [3, 7],
            borderRadius: 3,
            fontWeight: 700,
            fontSize: 12,
          },
          data: [{ yAxis: bitDepth }],
        },
      },
      {
        name: 'formation-labels',
        type: 'custom',
        silent: true,
        z: 3,
        clip: true,
        data: labels.map((_, i) => i),
        renderItem: (params: { dataIndex: number }, api: any) => {
          const l = labels[params.dataIndex];
          const [cx, y1] = api.coord([0, l.top]);
          const [, y2] = api.coord([0, l.base]);
          if (y2 - y1 < 16) return null;
          return {
            type: 'text',
            style: {
              x: cx,
              y: (y1 + y2) / 2,
              text: l.name,
              fill: '#F8FAFC',
              font: '600 13px Inter Variable, Inter, sans-serif',
              align: 'center',
              verticalAlign: 'middle',
            },
          };
        },
      },
      {
        name: 'casing',
        type: 'custom',
        z: 4,
        clip: true,
        data: casing.map((_, i) => i),
        tooltip: {
          formatter: (p: { dataIndex: number }) => {
            const c = casing[p.dataIndex];
            return `<b>${c.well}</b> · ${c.size} casing<br/><span style="color:#94A3B8">Shoe ${fmtM(c.shoe)} m${c.planned ? ' (planned)' : ''}</span>`;
          },
        },
        renderItem: (params: { dataIndex: number }, api: any) => {
          const c = casing[params.dataIndex];
          const w = api.size([1, 0])[0] * BW;
          const [cx, y0] = api.coord([c.x, 0]);
          const [, ys] = api.coord([c.x, c.shoe]);
          const xl = cx - w / 2 - 3 - c.rank * 4;
          const color = '#CBD5E1';
          return {
            type: 'group',
            children: [
              {
                type: 'line',
                shape: { x1: xl, y1: y0, x2: xl, y2: ys },
                style: { stroke: color, lineWidth: 1, lineDash: c.planned ? [4, 3] : undefined, opacity: 0.45 },
              },
              {
                type: 'polygon',
                shape: {
                  points: [
                    [xl, ys],
                    [xl - 7, ys],
                    [xl, ys - 8],
                  ],
                },
                style: { fill: color, opacity: c.planned ? 0.6 : 1 },
              },
              {
                type: 'text',
                style: {
                  x: xl - 10,
                  y: ys - 3,
                  text: c.size,
                  fill: '#94A3B8',
                  font: '500 11px Inter Variable, Inter, sans-serif',
                  align: 'right',
                  verticalAlign: 'middle',
                },
              },
            ],
          };
        },
      },
      {
        name: 'td',
        type: 'custom',
        silent: true,
        z: 4,
        clip: true,
        data: cols.map((_, i) => i),
        renderItem: (params: { dataIndex: number }, api: any) => {
          const c = cols[params.dataIndex];
          const w = api.size([1, 0])[0] * BW;
          const [cx, y] = api.coord([params.dataIndex, c.td]);
          return {
            type: 'group',
            children: [
              { type: 'line', shape: { x1: cx - w / 2, y1: y, x2: cx + w / 2, y2: y }, style: { stroke: '#E5E7EB', lineWidth: 2 } },
              {
                type: 'text',
                style: {
                  x: cx,
                  y: y + 12,
                  text: `${c.isActive ? 'Planned TD' : 'TD'} ${fmtM(c.td)} m`,
                  fill: '#94A3B8',
                  font: '500 12px Inter Variable, Inter, sans-serif',
                  align: 'center',
                  verticalAlign: 'middle',
                },
              },
            ],
          };
        },
      },
      ...eventSeries,
    ],
  };
}

export default function DepthView({ active, wells, bitDepth, radiusKm, focusWell, onClose, onReady }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cols: Column[] = useMemo(
    () => [
      {
        name: active.name,
        sub: 'Active · drilling',
        td: active.plannedTd,
        tops: active.formationTops,
        casing: active.casing,
        events: [],
        isActive: true,
      },
      ...wells.map((w) => ({
        name: w.name,
        sub: `${fmtKm(w.distanceKm)} km · ${w.year}${w.type === 'deviated' ? ' · dev.' : ''}`,
        td: w.td,
        tops: w.formationTops,
        casing: w.casing,
        events: w.events,
        isActive: false,
      })),
    ],
    [active, wells],
  );

  const option = useMemo(() => buildOption(cols, bitDepth), [cols, bitDepth]);
  const formations = active.formationTops.map((t) => t.name);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#020617]/80 p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Depth comparison"
        className="flex h-[min(960px,92vh)] w-[min(1720px,96vw)] flex-col rounded-xl border border-line bg-panel"
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[1.3rem] font-semibold text-ink">Depth comparison</h2>
            <p className="text-[0.9rem] text-muted">
              {active.name} against {wells.length} nearby offset wells — nearest well for each past problem{focusWell ? `, incl. ${focusWell}` : ''} · search
              radius {radiusKm} km · formation tops correlated across wells
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close depth comparison"
            className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line px-6 py-3 text-[0.85rem] text-ink">
          <div className="flex items-center gap-3">
            <span className="text-[0.72rem] uppercase tracking-wider text-muted">Formations</span>
            {formations.map((f) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm" style={{ background: FORMATION_COLORS[f] }} />
                {f}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.72rem] uppercase tracking-wider text-muted">Events</span>
            {EVENT_TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className={t === 'Torque Spike' ? 'h-2 w-2 rotate-45' : 'h-3 w-3 rounded-full'} style={{ background: ISSUE_COLORS[t] }} />
                {ISSUE_SHORT[t]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 border-t-2 border-dashed border-accent" /> Bit depth
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="10" height="12" viewBox="0 0 10 12">
                <path d="M8 0v12M8 12H1L8 4z" stroke="#CBD5E1" fill="#CBD5E1" strokeWidth="1.5" />
              </svg>
              Casing shoe
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-3 pt-2">
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            onChartReady={() => onReady?.()}
          />
        </div>
        <div className="border-t border-line px-6 py-2.5 text-[0.78rem] text-muted">
          Hover an event marker for details and source. Scroll on the chart to zoom depth. Depths shown as TVD; sample data for demonstration only.
        </div>
      </div>
    </div>
  );
}
