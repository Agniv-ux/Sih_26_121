export const fmtM = (m: number) => Math.round(m).toLocaleString('en-IN');
export const fmtKm = (km: number) => km.toFixed(1);
export const fmtH = (h: number) => (Number.isInteger(h) ? String(h) : h.toFixed(1));
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const sourceLabel = (s: { report: string; date: string; page: number }) => `${s.report} ${s.date} p.${s.page}`;
