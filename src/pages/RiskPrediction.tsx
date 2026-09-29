import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageHeader from '../components/ui/PageHeader';
import { MethodBadge, RiskBadge, WellChip } from '../components/IssueTag';
import { ACTIVE } from '../data';
import { C, RISK_COLORS, RISK_STEP_M, RISK_TYPES, RISK_TYPE_LABEL } from '../lib/constants';
import { fmtM } from '../lib/format';
import { gridStart, riskProfile, type RiskInterval } from '../lib/risk';
import { SHOT } from '../lib/shot';
import { useShotReady } from '../lib/useShotReady';
import { useApp } from '../state/AppState';
import type { RiskType } from '../types';

const LEVEL_NUM = { low: 0, medium: 1, high: 2 } as const;

export default function RiskPrediction() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { bitDepth, wellsInRadius, radiusKm } = useApp();
  const profile = useMemo(() => riskProfile(bitDepth, ACTIVE.plannedTd, wellsInRadius), [bitDepth, wellsInRadius]);
  const topType = (iv: RiskInterval) => RISK_TYPES.reduce((a, t) => (iv.cells[t].p > iv.cells[a].p ? t : a), RISK_TYPES[0]);

  const initial = (() => {
    const q = Number(params.get('interval'));
    if (!q) return null;
    const iv = profile.find((i) => i.from === gridStart(q));
    return iv ? { from: iv.from, type: topType(iv) } : null;
  })();
  const [sel, setSel] = useState<{ from: number; type: RiskType } | null>(initial);
  useShotReady();

  const selIv = sel ? profile.find((i) => i.from === sel.from) : undefined;
  const labels = profile.map((i) => String(i.from));
  const types = [...RISK_TYPES].reverse(); // first type on top

  const data = profile.flatMap((iv, x) =>
    types.map((t, y) => {
      const c = iv.cells[t];
      const on = sel?.from === iv.from;
      const picked = on && sel?.type === t;
      return {
        value: [x, y, LEVEL_NUM[c.level]],
        itemStyle: { color: RISK_COLORS[c.level], borderColor: picked ? C.ink : on ? C.accent : '#fff', borderWidth: picked ? 3 : on ? 2.5 : 1 },
        cell: c,
        method: iv.method,
      };
    }),
  );
  const methodData = profile.map((iv, x) => ({
    value: [x, 0, iv.method === 'Model' ? 1 : 0],
    itemStyle: { color: iv.method === 'Model' ? '#9DB3D9' : '#D1D5DB', borderColor: '#fff', borderWidth: 1 },
    method: iv.method,
  }));
  const topsInRange = ACTIVE.formationTops.filter((t) => t.top >= profile[0].from && t.top < ACTIVE.plannedTd);
  const xOf = (depth: number) => String(gridStart(depth));

  const option = {
    animation: !SHOT,
    tooltip: {
      confine: true,
      textStyle: { fontSize: 12.5 },
      formatter: (p: { data: { cell?: (typeof data)[number]['cell']; method: string } }) => {
        const c = p.data.cell;
        if (!c) return `Method: <b>${p.data.method}</b>`;
        return `<b>${fmtM(c.from)}–${fmtM(c.to)} m</b> · ${c.formation}<br/>${RISK_TYPE_LABEL[c.type]}: <b style="color:${RISK_COLORS[c.level]}">${c.level.toUpperCase()}</b> (p = ${c.p.toFixed(2)})<br/><span style="color:#6B7280">${p.data.method} · click for reasons</span>`;
      },
    },
    grid: [
      { left: 150, right: 20, top: 34, height: 330 },
      { left: 150, right: 20, top: 384, height: 22 },
    ],
    xAxis: [
      {
        type: 'category',
        data: labels,
        gridIndex: 0,
        position: 'top',
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { interval: 3, color: C.muted, fontSize: 11.5, formatter: (v: string) => fmtM(Number(v)) },
        splitArea: { show: false },
      },
      { type: 'category', data: labels, gridIndex: 1, show: false },
    ],
    yAxis: [
      { type: 'category', data: types.map((t) => RISK_TYPE_LABEL[t]), gridIndex: 0, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: C.ink, fontSize: 12.5, fontWeight: 600 } },
      { type: 'category', data: ['Method'], gridIndex: 1, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: C.muted, fontSize: 12 } },
    ],
    series: [
      {
        type: 'heatmap',
        data,
        xAxisIndex: 0,
        yAxisIndex: 0,
        emphasis: { itemStyle: { borderColor: C.ink, borderWidth: 1.5 } },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { position: 'start', color: C.ink, fontSize: 11.5, fontWeight: 600, formatter: (p: { name: string }) => p.name },
          lineStyle: { color: '#4B5563', type: 'dashed', width: 1 },
          data: [
            ...topsInRange.map((t) => ({ name: `${t.name} ${fmtM(t.top)}`, xAxis: xOf(t.top) })),
          ],
        },
      },
      { type: 'heatmap', data: methodData, xAxisIndex: 1, yAxisIndex: 1 },
    ],
  };

  const onClick = (p: { data?: { cell?: { from: number; type: RiskType } } }) => {
    const c = p.data?.cell;
    if (c) {
      setSel({ from: c.from, type: c.type });
      nav(`/risk?interval=${c.from}`, { replace: true });
    }
  };

  const counts = { high: 0, medium: 0, low: 0 };
  profile.forEach((iv) => counts[iv.level]++);
  const modelN = profile.filter((i) => i.method === 'Model').length;

  return (
    <div className="p-4">
      <PageHeader
        title="Risk Prediction"
        subtitle={`Predicted risk along the planned well path from the current depth (${fmtM(bitDepth)} m) to planned TD (${fmtM(ACTIVE.plannedTd)} m), in ${RISK_STEP_M} m intervals. Based on ${wellsInRadius.length} offset wells within ${radiusKm} km.`}
      />
      <div className="flex gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <section className="card">
            <div className="card-h">
              <span>Risk along planned path (m MD)</span>
              <span className="flex items-center gap-3 text-[0.82rem] font-normal text-muted">
                {(['low', 'medium', 'high'] as const).map((l) => (
                  <span key={l} className="flex items-center gap-1 capitalize">
                    <span className="inline-block h-[10px] w-[16px]" style={{ background: RISK_COLORS[l] }} />
                    {l}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="inline-block h-[10px] w-[16px] bg-[#9DB3D9]" />
                  Model
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-[10px] w-[16px] bg-[#D1D5DB]" />
                  Rule-based
                </span>
              </span>
            </div>
            <ReactECharts option={option} style={{ height: 420, width: '100%' }} onEvents={{ click: onClick }} notMerge />
            <div className="border-t border-line px-4 py-2 text-[0.85rem] text-muted">
              Summary: <b className="text-risk-red">{counts.high} high</b> · <b className="text-[#9a6207]">{counts.medium} medium</b> · <b className="text-risk-green">{counts.low} low</b> intervals (highest of the five problem types). Click any cell to see why.
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="card">
              <div className="card-h">How the prediction is made</div>
              <div className="space-y-2 p-4 text-[0.9rem] leading-relaxed">
                <p>
                  <b>Model:</b> gradient-boosted trees (XGBoost) trained on offset-well history. Where data is limited, rule-based offset-well alerts are used.
                </p>
                <p className="text-muted">
                  Each 25 m interval is described by formation, depth below formation top, offset-well events within ±30 m, planned vs. used mud weight, distance to offset wells and casing plan. Reasons
                  are shown as factor contributions (SHAP-style) in plain words.
                </p>
                <p className="text-muted">
                  Intervals are marked <MethodBadge method="Rule-based" /> when fewer than 4 offset wells reached that depth ({profile.length - modelN} of {profile.length} intervals here).
                </p>
              </div>
            </section>
            <section className="card">
              <div className="card-h">
                <span>Model information</span>
                <span className="rounded-[2px] bg-[#fdf1e6] px-1.5 text-[0.75rem] font-semibold text-[#a84f0c]">SAMPLE FIGURES</span>
              </div>
              <table className="tbl">
                <tbody>
                  <tr><td className="text-muted">Training wells</td><td>10 offset wells (sample set)</td></tr>
                  <tr><td className="text-muted">Labelled intervals</td><td>1,482 × 25 m intervals, 5 problem types</td></tr>
                  <tr><td className="text-muted">Validation</td><td>Leave-one-well-out</td></tr>
                  <tr><td className="text-muted">Precision / Recall</td><td>0.78 / 0.71 (sample)</td></tr>
                  <tr><td className="text-muted">ROC-AUC</td><td>0.84 (sample)</td></tr>
                  <tr><td className="text-muted">Last retrained</td><td>Demo build – not a trained model</td></tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>

        <aside className="card w-[420px] flex-none self-start">
          <div className="card-h">Why this risk?</div>
          {!selIv || !sel ? (
            <div className="p-4 text-[0.9rem] text-muted">Click an interval in the chart to see the main reasons behind its risk level.</div>
          ) : (
            <WhyPanel iv={selIv} type={sel.type} onType={(t) => setSel({ from: sel.from, type: t })} />
          )}
        </aside>
      </div>
    </div>
  );
}

function WhyPanel({ iv, type, onType }: { iv: RiskInterval; type: RiskType; onType: (t: RiskType) => void }) {
  const cell = iv.cells[type];
  const maxW = Math.max(...cell.factors.map((f) => Math.abs(f.weight)), 0.01);
  return (
    <div>
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[1.15rem] font-bold">
            {fmtM(iv.from)}–{fmtM(iv.to)} m
          </span>
          <MethodBadge method={iv.method} />
        </div>
        <div className="text-[0.88rem] text-muted">Formation: {iv.formation} · planned MW {ACTIVE.plannedMw[iv.formation]?.toFixed(2)} SG</div>
      </div>
      <table className="tbl">
        <tbody>
          {RISK_TYPES.map((t) => (
            <tr key={t} className={`clickable ${t === type ? 'selected' : ''}`} onClick={() => onType(t)}>
              <td>{RISK_TYPE_LABEL[t]}</td>
              <td>
                <RiskBadge level={iv.cells[t].level} />
              </td>
              <td className="num text-muted">p = {iv.cells[t].p.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3">
        <div className="text-[0.95rem] font-semibold">
          Top factors – {RISK_TYPE_LABEL[type]} <span className="font-normal text-muted">(predicted {cell.level}, p = {cell.p.toFixed(2)})</span>
        </div>
        <ul className="mt-2 space-y-2">
          {cell.factors.map((f) => (
            <li key={f.text} className="text-[0.9rem]">
              <div className="flex items-start justify-between gap-2">
                <span>{f.text}</span>
                <span className={`whitespace-nowrap font-semibold tabular-nums ${f.weight >= 0 ? 'text-risk-red' : 'text-risk-green'}`}>
                  {f.weight >= 0 ? '+' : '−'}
                  {Math.abs(f.weight).toFixed(2)}
                </span>
              </div>
              <div className="mt-0.5 h-[6px] bg-[#eef1f5]">
                <div className="h-full" style={{ width: `${(Math.abs(f.weight) / maxW) * 100}%`, background: f.weight >= 0 ? '#C0392B' : '#1E8449' }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 text-[0.8rem] text-muted">Base rate 0.08 + factor contributions = predicted probability. Red raises risk, green lowers it.</div>
        {cell.wells.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.85rem]">
            <span className="text-muted">Offset wells behind this:</span>
            {cell.wells.map((w) => (
              <WellChip key={w} name={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
