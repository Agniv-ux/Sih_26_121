import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ComputedAlert, FilterId, LiveData, OffsetWell, Role } from '../types';
import { ACTIVE, ALERT_DEFS, LIVE, OFFSETS } from '../data';
import { DEFAULT_RADIUS_KM, SHOT_BIT_DEPTH, SIM_INTERVAL_MS, SIM_STEP_M } from '../lib/constants';
import { inRadius } from '../lib/geo';
import { computeAlerts } from '../lib/risk';
import { formationAt } from '../lib/wells';
import { SHOT } from '../lib/shot';

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  filter: FilterId;
  setFilter: (f: FilterId) => void;
  bitDepth: number;
  formation: string;
  running: boolean;
  toggleRunning: () => void;
  live: LiveData;
  wellsInRadius: OffsetWell[];
  alerts: ComputedAlert[];
  /** Well whose popup the map should open (seq changes on every request so the same well can be re-focused). */
  focus: { name: string; seq: number } | null;
  focusWell: (name: string | null) => void;
}

const Ctx = createContext<AppState | null>(null);

const r1 = (x: number) => Math.round(x * 10) / 10;
const wobble = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.5 + Math.sin(t * 0.41 + s * 3) * 0.5;

/** Advance the simulated live readings by one tick (3 s). A new 1-min point is added every 20 ticks. */
function stepLive(prev: LiveData, tick: number, bitDepth: number): LiveData {
  const next: LiveData = {
    minutes: prev.minutes,
    rop: [...prev.rop],
    torque: [...prev.torque],
    spp: [...prev.spp],
    pitVolume: [...prev.pitVolume],
    mudWeight: [...prev.mudWeight],
    bitDepth: [...prev.bitDepth],
  };
  const newMinute = tick % 20 === 0;
  const vals = {
    rop: r1(Math.max(4, 7.0 + wobble(tick, 1) * 0.8)),
    torque: r1(17.1 + wobble(tick, 2) * 0.4),
    spp: Math.round(2850 + wobble(tick, 3) * 18),
    pitVolume: r1(412 + wobble(tick, 4) * 1.2),
    mudWeight: 1.2,
    bitDepth: r1(bitDepth),
  };
  for (const k of Object.keys(vals) as (keyof typeof vals)[]) {
    const arr = next[k];
    if (newMinute) {
      arr.shift();
      arr.push(vals[k]);
    } else arr[arr.length - 1] = vals[k];
  }
  return next;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('office');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [filter, setFilter] = useState<FilterId>('All');
  const [bitDepth, setBitDepth] = useState(SHOT ? SHOT_BIT_DEPTH : ACTIVE.startBitDepth);
  const [running, setRunning] = useState(!SHOT);
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState<LiveData>(LIVE);
  const [focus, setFocus] = useState<AppState['focus']>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => t + 1), SIM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (tick === 0) return;
    const d = ACTIVE.startBitDepth + tick * SIM_STEP_M;
    setBitDepth(d);
    setLive((prev) => stepLive(prev, tick, d));
  }, [tick]);

  const wellsInRadius = useMemo(() => inRadius(OFFSETS, radiusKm), [radiusKm]);
  const alerts = useMemo(() => computeAlerts(ALERT_DEFS, bitDepth, wellsInRadius), [bitDepth, wellsInRadius]);
  const focusWell = useCallback((name: string | null) => setFocus((f) => (name ? { name, seq: (f?.seq ?? 0) + 1 } : null)), []);

  const value: AppState = {
    role,
    setRole,
    radiusKm,
    setRadiusKm,
    filter,
    setFilter,
    bitDepth,
    formation: formationAt(ACTIVE.formationTops, bitDepth),
    running,
    toggleRunning: () => setRunning((r) => !r),
    live,
    wellsInRadius,
    alerts,
    focus,
    focusWell,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
