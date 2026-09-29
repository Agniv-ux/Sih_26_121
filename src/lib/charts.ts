import type { EChartsType } from 'echarts';

declare global {
  interface Window {
    __nwisCharts?: Record<string, EChartsType>;
  }
}

/** Keeps a handle on rendered charts so scripted demos (scripts/demo-video.mjs) can point at chart items. */
export function registerChart(name: string, chart: EChartsType) {
  window.__nwisCharts = { ...window.__nwisCharts, [name]: chart };
}
