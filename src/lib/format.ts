const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// en-IN groups lakhs differently only above 99,999 — safe for depths.
export const fmtM = (m: number) => nf0.format(Math.round(m));
export const fmtKm = (km: number) => nf1.format(km);
export const fmtHrs = (h: number) => (Number.isInteger(h) ? nf0.format(h) : nf1.format(h));
