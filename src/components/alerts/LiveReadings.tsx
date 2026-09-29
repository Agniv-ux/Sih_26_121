import ReactECharts from 'echarts-for-react';
import { useApp } from '../../state/AppState';
import { C } from '../../lib/constants';
import { SHOT } from '../../lib/shot';
import type { LiveData } from '../../types';

interface Reading {
  key: keyof Omit<LiveData, 'minutes'>;
  label: string;
  unit: string;
  digits: number;
  note: (v: number[]) => { text: string; warn: boolean };
}

const change = (v: number[]) => v[v.length - 1] - v[0];
const READINGS: Reading[] = [
  { key: 'bitDepth', label: 'Bit depth', unit: 'm MD', digits: 1, note: (v) => ({ text: `+${change(v).toFixed(1)} m in 30 min`, warn: false }) },
  { key: 'rop', label: 'ROP', unit: 'm/hr', digits: 1, note: (v) => ({ text: `${Math.round((change(v) / v[0]) * 100)}% in 30 min – falling`, warn: change(v) < -2 }) },
  { key: 'torque', label: 'Torque', unit: 'kft·lbf', digits: 1, note: (v) => ({ text: `+${change(v).toFixed(1)} in 30 min – rising`, warn: change(v) > 2 }) },
  { key: 'spp', label: 'Standpipe pressure', unit: 'psi', digits: 0, note: () => ({ text: 'Stable', warn: false }) },
  { key: 'pitVolume', label: 'Pit volume', unit: 'bbl', digits: 1, note: (v) => ({ text: `${change(v) >= 0 ? '+' : ''}${change(v).toFixed(1)} bbl – no gain/loss`, warn: false }) },
  { key: 'mudWeight', label: 'Mud weight (in)', unit: 'SG', digits: 2, note: () => ({ text: 'Constant', warn: false }) },
];

function Spark({ data, minutes, digits, unit, warn }: { data: number[]; minutes: number[]; digits: number; unit: string; warn: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min || Math.abs(max) * 0.01 || 1) * 0.25;
  const option = {
    animation: false,
    grid: { left: 2, right: 2, top: 6, bottom: 2 },
    xAxis: { type: 'category', data: minutes.map((m) => `${m} min`), show: false, boundaryGap: false },
    yAxis: { type: 'value', show: false, min: min - pad, max: max + pad },
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v.toFixed(digits)} ${unit}`, textStyle: { fontSize: 12 } },
    series: [
      {
        type: 'line',
        data,
        symbol: 'none',
        lineStyle: { width: 2, color: warn ? C.amber : C.navy },
        areaStyle: { color: warn ? 'rgba(214,137,16,0.08)' : 'rgba(11,61,145,0.06)' },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height: 34, width: '100%' }} notMerge lazyUpdate={!SHOT} />;
}

export default function LiveReadings() {
  const { live } = useApp();
  return (
    <div className="grid grid-cols-3 gap-2.5 px-3 py-2.5 2xl:grid-cols-6">
      {READINGS.map((r) => {
        const v = live[r.key];
        const n = r.note(v);
        return (
          <div key={r.key} className="border border-line bg-white px-3 pb-1 pt-2" style={n.warn ? { borderTop: `3px solid ${C.amber}` } : { borderTop: '3px solid transparent' }}>
            <div className="text-[0.82rem] text-muted">{r.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[1.4rem] font-bold leading-tight">{v[v.length - 1].toLocaleString('en-IN', { minimumFractionDigits: r.digits, maximumFractionDigits: r.digits })}</span>
              <span className="text-[0.82rem] text-muted">{r.unit}</span>
            </div>
            <div className={`text-[0.78rem] ${n.warn ? 'font-semibold text-[#9a6207]' : 'text-muted'}`}>{n.text}</div>
            <Spark data={v} minutes={live.minutes} digits={r.digits} unit={r.unit} warn={n.warn} />
          </div>
        );
      })}
    </div>
  );
}
