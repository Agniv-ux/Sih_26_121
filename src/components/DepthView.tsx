import ReactECharts from 'echarts-for-react';
import type { CustomSeriesRenderItemAPI, CustomSeriesRenderItemParams } from 'echarts';
import type { Casing, EventType, FormationTop } from '../types';
import { ACTIVE } from '../data';
import { C, FORMATION_COLORS, FORMATION_EDGE, ISSUE_COLORS } from '../lib/constants';
import { fmtM, sourceLabel } from '../lib/format';
import { SHOT } from '../lib/shot';
import { registerChart } from '../lib/charts';
import { tvd } from '../lib/wells';
import type { OffsetWell, WellEvent } from '../types';

export type DepthMode = 'MD' | 'TVD';

/** A column prepared for plotting: depths already converted (MD/TVD) and shifted for alignment. */
interface Column {
  name: string;
  active: boolean;
  tops: FormationTop[];
  td: number;
  casing: Casing[];
  events: (WellEvent & { y: number })[];
  shift: number;
}

const SYMBOL: Record<EventType, string> = {
  'Mud Loss': 'circle',
  'Stuck Pipe': 'rect',
  Kick: 'triangle',
  'Cementing Issue': 'diamond',
  'Torque Spike': 'pin',
};
const COL_FRAC = 0.34;

export function buildColumns(wells: OffsetWell[], mode: DepthMode, alignTo: string | null): Column[] {
  const conv = (w: OffsetWell | undefined, md: number) => (mode === 'TVD' ? tvd(w, md) : md);
  const activeTop = alignTo ? ACTIVE.formationTops.find((t) => t.name === alignTo)?.top : undefined;
  const cols: Column[] = [
    { name: ACTIVE.name, active: true, tops: ACTIVE.formationTops, td: ACTIVE.plannedTd, casing: ACTIVE.casing, events: [], shift: 0 },
  ];
  for (const w of wells) {
    const tops = w.formationTops.map((t) => ({ ...t, top: conv(w, t.top) }));
    const own = alignTo ? tops.find((t) => t.name === alignTo)?.top : undefined;
    const shift = activeTop !== undefined && own !== undefined ? activeTop - own : 0;
    cols.push({
      name: w.name,
      active: false,
      tops: tops.map((t) => ({ ...t, top: t.top + shift })),
      td: conv(w, w.td) + shift,
      casing: w.casing.map((c) => ({ ...c, shoe: conv(w, c.shoe) + shift })),
      events: w.events.map((e) => ({ ...e, y: (mode === 'TVD' ? e.tvd : e.md) + shift })),
      shift,
    });
  }
  return cols;
}

interface Props {
  columns: Column[];
  bitDepth: number;
  mode: DepthMode;
  height: number;
  /** Top of the plotted depth range (0 = from surface). */
  fromDepth: number;
}

export default function DepthView({ columns, bitDepth, mode, height, fromDepth }: Props) {
  const maxDepth = Math.ceil((Math.max(...columns.map((c) => c.td)) + 100) / 250) * 250;
  const minDepth = fromDepth;

  // Formation band items: [colIndex, top, base, formation]
  const bands = columns.flatMap((c, i) => c.tops.map((t, k) => ({ value: [i, t.top, c.tops[k + 1]?.top ?? c.td], name: t.name, col: c })));
  // Correlation polygons between neighbouring columns
  const links: { value: number[]; name: string }[] = [];
  columns.slice(0, -1).forEach((a, i) => {
    const b = columns[i + 1];
    for (let k = 0; k < a.tops.length; k++) {
      const f = a.tops[k].name;
      const kb = b.tops.findIndex((t) => t.name === f);
      if (kb < 0) continue;
      links.push({ value: [i, a.tops[k].top, a.tops[k + 1]?.top ?? a.td, b.tops[kb].top, b.tops[kb + 1]?.top ?? b.td], name: f });
    }
  });

  const halfW = (api: CustomSeriesRenderItemAPI) => ((api.size!([1, 0]) as number[])[0] * COL_FRAC) / 2;

  const renderBand = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
    const b = bands[params.dataIndex];
    const [x, y0] = api.coord([api.value(0), api.value(1)]);
    const [, y1] = api.coord([api.value(0), api.value(2)]);
    const w = halfW(api);
    const col = b.col;
    const planned = col.active && (api.value(2) as number) > bitDepth;
    const children: object[] = [];
    const drawn = (top: number, bottom: number, faded: boolean) => {
      const [, ya] = api.coord([0, top]);
      const [, yb] = api.coord([0, bottom]);
      children.push({
        type: 'rect',
        shape: { x: x - w, y: ya, width: w * 2, height: Math.max(0, yb - ya) },
        style: { fill: FORMATION_COLORS[b.name], stroke: FORMATION_EDGE[b.name], lineWidth: 1, opacity: faded ? 0.45 : 1 },
      });
    };
    const top = api.value(1) as number;
    const base = api.value(2) as number;
    if (planned && top < bitDepth) {
      drawn(top, bitDepth, false);
      drawn(bitDepth, base, true);
    } else drawn(top, base, planned);
    const [, yMin] = api.coord([0, minDepth]);
    const ly = Math.max(y0, yMin) + 4;
    if (y1 - ly > 16)
      children.push({
        type: 'text',
        style: { text: b.name, x: x - w + 5, y: ly, align: 'left', verticalAlign: 'top', fill: '#374151', font: '600 12px "Noto Sans", sans-serif' },
      });
    return { type: 'group', children, clipPath: { type: 'rect', shape: clipRect(params) } };
  };

  const clipRect = (params: CustomSeriesRenderItemParams) => {
    const c = params.coordSys as unknown as { x: number; y: number; width: number; height: number };
    return { x: c.x - 200, y: c.y, width: c.width + 400, height: c.height };
  };

  const renderLink = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
    const l = links[params.dataIndex];
    const i = api.value(0) as number;
    const w = halfW(api);
    const [xa, a0] = api.coord([i, api.value(1)]);
    const [, a1] = api.coord([i, api.value(2)]);
    const [xb, b0] = api.coord([i + 1, api.value(3)]);
    const [, b1] = api.coord([i + 1, api.value(4)]);
    return {
      type: 'group',
      children: [
        {
          type: 'polygon',
          shape: { points: [[xa + w, a0], [xb - w, b0], [xb - w, b1], [xa + w, a1]] },
          style: { fill: FORMATION_COLORS[l.name], opacity: 0.45 },
        },
        { type: 'line', shape: { x1: xa + w, y1: a0, x2: xb - w, y2: b0 }, style: { stroke: FORMATION_EDGE[l.name], lineWidth: 1, lineDash: [4, 3] } },
      ],
      clipPath: { type: 'rect', shape: clipRect(params) },
    };
  };

  const shoes = columns.flatMap((c, i) => c.casing.map((s) => ({ value: [i, s.shoe], size: s.size, col: c, planned: s.status === 'planned' })));
  const renderShoe = (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) => {
    const s = shoes[params.dataIndex];
    if ((api.value(1) as number) < minDepth) return { type: 'group', children: [] };
    const [x, y] = api.coord([api.value(0), api.value(1)]);
    const w = halfW(api);
    const color = s.planned ? '#9CA3AF' : '#111827';
    return {
      type: 'group',
      children: [
        { type: 'polygon', shape: { points: [[x + w, y], [x + w + 9, y], [x + w, y - 9]] }, style: { fill: color } },
        { type: 'polygon', shape: { points: [[x - w, y], [x - w - 9, y], [x - w, y - 9]] }, style: { fill: color } },
        { type: 'text', style: { text: s.size + (s.planned ? ' (plan)' : ''), x: x + w + 11, y: y - 4, verticalAlign: 'middle', fill: '#4B5563', font: '11px "Noto Sans", sans-serif' } },
      ],
    };
  };

  const eventTypes = [...new Set(columns.flatMap((c) => c.events.map((e) => e.type)))];
  const eventSeries = (['Mud Loss', 'Stuck Pipe', 'Kick', 'Cementing Issue', 'Torque Spike'] as EventType[])
    .filter((t) => eventTypes.includes(t))
    .map((t) => ({
      name: t,
      type: 'scatter',
      z: 5,
      symbol: SYMBOL[t],
      symbolSize: t === 'Torque Spike' ? 20 : 16,
      // Markers sit right of centre (labels are top-left); torque spikes further right so they never hide a major event.
      symbolOffset: [t === 'Torque Spike' ? 32 : 12, 0],
      itemStyle: { color: ISSUE_COLORS[t], borderColor: '#fff', borderWidth: 1.5 },
      data: columns.flatMap((c, i) =>
        c.events.filter((e) => e.type === t).map((e) => ({ value: [i, e.y], event: e, well: c.name })),
      ),
      tooltip: {
        formatter: (p: { data: { event: WellEvent; well: string } }) => {
          const e = p.data.event;
          return `<div style="max-width:320px;white-space:normal"><b>${p.data.well} – ${e.type}</b><br/>${fmtM(e.md)} m MD / ${fmtM(e.tvd)} m TVD · ${e.formation}<br/>${e.description}<br/><span style="color:#1E8449">Action:</span> ${e.action}<br/>${e.timeLost} h lost · <i>${sourceLabel(e.source)}</i></div>`;
        },
      },
    }));

  const option = {
    animation: !SHOT,
    grid: { left: 70, right: 70, top: 30, bottom: 36 },
    legend: {
      bottom: 4,
      left: 'center',
      itemWidth: 14,
      itemHeight: 12,
      textStyle: { fontSize: 12.5, color: C.ink },
      data: [...eventSeries.map((s) => s.name), 'Bit depth'],
    },
    tooltip: { trigger: 'item', confine: true, textStyle: { fontSize: 12.5 } },
    xAxis: {
      type: 'category',
      position: 'top',
      data: columns.map((c) => c.name),
      axisLabel: { show: true, fontSize: 13, fontWeight: 700, color: (v: string) => (v === ACTIVE.name ? '#a84f0c' : C.ink) },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: minDepth,
      max: maxDepth,
      interval: 250,
      name: `${mode === 'MD' ? 'Measured depth' : 'TVD'} (m)`,
      nameLocation: 'middle',
      nameGap: 52,
      nameTextStyle: { color: C.muted, fontSize: 12.5 },
      axisLabel: { color: C.muted, formatter: (v: number) => fmtM(v) },
      splitLine: { lineStyle: { color: '#EEF1F5' } },
    },
    dataZoom: [{ type: 'inside', yAxisIndex: 0, filterMode: 'none' }],
    series: [
      { type: 'custom', name: 'correlation', silent: true, z: 1, renderItem: renderLink, data: links, encode: { x: 0, y: [1, 2, 3, 4] } },
      {
        type: 'custom',
        name: 'formations',
        z: 2,
        renderItem: renderBand,
        data: bands,
        encode: { x: 0, y: [1, 2] },
        tooltip: {
          formatter: (p: { dataIndex: number }) => {
            const b = bands[p.dataIndex];
            const [, top, base] = b.value;
            return `<b>${b.col.name}</b><br/>${b.name}: ${fmtM(top - b.col.shift)}–${fmtM(base - b.col.shift)} m ${mode}${b.col.shift ? `<br/><span style="color:#6B7280">shifted ${b.col.shift > 0 ? '+' : ''}${b.col.shift} m for alignment</span>` : ''}`;
          },
        },
      },
      { type: 'custom', name: 'casing', z: 3, renderItem: renderShoe, data: shoes, encode: { x: 0, y: 1 }, tooltip: { formatter: (p: { dataIndex: number }) => `${shoes[p.dataIndex].col.name}: ${shoes[p.dataIndex].size} casing shoe at ${fmtM(shoes[p.dataIndex].value[1])} m${shoes[p.dataIndex].planned ? ' (planned)' : ''}` } },
      ...eventSeries,
      {
        name: 'Bit depth',
        type: 'line',
        data: [],
        symbol: 'none',
        lineStyle: { color: C.accent, type: 'dashed', width: 2 },
        itemStyle: { color: C.accent },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: C.accent, type: 'dashed', width: 2 },
          label: { formatter: `Bit ${fmtM(bitDepth)} m`, position: 'insideStartTop', color: '#a84f0c', fontWeight: 600, fontSize: 12 },
          data: [{ yAxis: bitDepth }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} notMerge onChartReady={(c) => registerChart('depth', c)} />;
}


