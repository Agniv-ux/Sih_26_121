import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MapView, { type FocusRequest } from './components/MapView';
import SidePanel from './components/SidePanel';
import RiskStrip from './components/RiskStrip';
import AlertCard from './components/AlertCard';
import WellsTable from './components/WellsTable';
import AskPanel from './components/AskPanel';
import { activeWell, alertDefs, offsetWells, qaById } from './data';
import { computeAlerts, computeRiskStrip } from './lib/risk';
import { formationAt } from './lib/wells';
import { matchQuestion } from './lib/qa';
import { DEFAULT_RADIUS_KM, SIM_INTERVAL_MS, SIM_STEP_M } from './lib/constants';
import type { ChatMessage, FilterId, ShotMode, TabId } from './types';

// ECharts is only needed for the depth view, so load it on demand.
const DepthView = lazy(() => import('./components/DepthView'));

const DEPTH_VIEW_WELLS = 5;

function initialMessages(shot: ShotMode): ChatMessage[] {
  if (shot !== 'ask') return [];
  const qa = qaById.get('tipam-losses')!;
  return [
    { id: 1, role: 'user', text: qa.question },
    { id: 2, role: 'assistant', text: qa.answer, sources: qa.sources },
  ];
}

export default function App({ shot }: { shot: ShotMode }) {
  const [bitDepth, setBitDepth] = useState(activeWell.startBitDepth);
  const [running, setRunning] = useState(!shot);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [filter, setFilter] = useState<FilterId>('All');
  const [selectedWell, setSelectedWell] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [tab, setTab] = useState<TabId>(shot === 'ask' ? 'ask' : 'alerts');
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages(shot));
  const [pending, setPending] = useState(false);
  const [depthView, setDepthView] = useState<{ open: boolean; focus: string | null }>({ open: shot === 'depth', focus: null });
  const msgId = useRef(10);
  const readyParts = useRef({ map: false, depth: shot !== 'depth' });

  // Live simulation: bit advances every few seconds (never in screenshot mode).
  useEffect(() => {
    if (!running || shot) return;
    const t = setInterval(() => setBitDepth((d) => Math.min(d + SIM_STEP_M, activeWell.plannedTd)), SIM_INTERVAL_MS);
    return () => clearInterval(t);
  }, [running, shot]);

  const wellsInRadius = useMemo(() => offsetWells.filter((w) => w.distanceKm <= radiusKm), [radiusKm]);
  const visibleWells = useMemo(
    // Chips filter by main past problem (the marker colour), so chip counts always add up to the radius count.
    () => (filter === 'All' ? wellsInRadius : wellsInRadius.filter((w) => w.mainIssue === filter)),
    [wellsInRadius, filter],
  );
  const formation = formationAt(activeWell.formationTops, bitDepth);
  const risk = useMemo(() => computeRiskStrip(bitDepth, wellsInRadius, activeWell.formationTops), [bitDepth, wellsInRadius]);
  const alerts = useMemo(() => computeAlerts(alertDefs, bitDepth, wellsInRadius), [bitDepth, wellsInRadius]);

  // Depth view: the nearest well for each past-problem type, topped up with the nearest remaining wells.
  const depthWells = useMemo(() => {
    const focus = depthView.focus ? offsetWells.find((w) => w.name === depthView.focus) : undefined;
    const pool = [...wellsInRadius, ...offsetWells.filter((w) => w.distanceKm > radiusKm)];
    const picked = focus ? [focus] : [];
    for (const w of pool) if (w.mainIssue !== 'No major issue' && !picked.some((p) => p.mainIssue === w.mainIssue)) picked.push(w);
    for (const w of pool) if (picked.length < DEPTH_VIEW_WELLS && !picked.includes(w)) picked.push(w);
    return picked.slice(0, DEPTH_VIEW_WELLS).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [depthView.focus, wellsInRadius, radiusKm]);

  const markReady = useCallback((part: 'map' | 'depth') => {
    readyParts.current[part] = true;
    if (readyParts.current.map && readyParts.current.depth) window.__nwisReady = true;
  }, []);

  // Screenshot mode: open OW-02's popup once the map has been fitted.
  const onFitted = useCallback(() => {
    if (shot === 'popup' && !readyParts.current.map) {
      setTimeout(() => {
        setFocusRequest({ name: 'OW-02', nonce: Date.now(), fly: false, side: true });
        setTimeout(() => markReady('map'), 400);
      }, 100);
      return;
    }
    if (shot) setTimeout(() => markReady('map'), 200);
  }, [shot, markReady]);

  const ask = useCallback((question: string, answerOverride?: { answer: string; sources: string[] }) => {
    const a = answerOverride ?? matchQuestion(question);
    setMessages((m) => [...m, { id: msgId.current++, role: 'user', text: question }]);
    setPending(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: msgId.current++, role: 'assistant', text: a.answer, sources: a.sources }]);
      setPending(false);
    }, 650);
  }, []);

  const onWhy = useCallback(
    (qaId: string) => {
      const qa = qaById.get(qaId);
      if (!qa) return;
      setTab('ask');
      ask(qa.question, qa);
    },
    [ask],
  );

  const locateWell = useCallback(
    (name: string) => {
      if (filter !== 'All' && !visibleWells.some((w) => w.name === name)) setFilter('All');
      setFocusRequest({ name, nonce: Date.now(), fly: true });
    },
    [filter, visibleWells],
  );

  return (
    <div className="flex h-full min-h-[640px] flex-col">
      <Header wellName={activeWell.name} bitDepth={bitDepth} formation={formation} running={running || !!shot} onToggleRunning={() => setRunning((r) => !r)} />

      <main className="flex min-h-0 flex-1">
        <section className="min-w-0 flex-[65]">
          <MapView
            active={activeWell}
            wellsInRadius={wellsInRadius}
            visibleWells={visibleWells}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            filter={filter}
            onFilterChange={setFilter}
            selectedWell={selectedWell}
            onSelectWell={setSelectedWell}
            focusRequest={focusRequest}
            onViewDepth={(name) => setDepthView({ open: true, focus: name })}
            shot={shot}
            onFitted={onFitted}
          />
        </section>
        <section className="min-w-[440px] flex-[35]">
          <SidePanel tab={tab} onTabChange={setTab} alertCount={alerts.length} wellCount={wellsInRadius.length}>
            {tab === 'alerts' && (
              <div className="space-y-3">
                <RiskStrip intervals={risk} bitDepth={bitDepth} activeTops={activeWell.formationTops} />
                <div className="flex items-baseline justify-between pt-1">
                  <h3 className="text-[1rem] font-semibold">Alerts ahead of the bit</h3>
                  <span className="text-[0.8rem] text-muted">
                    From {wellsInRadius.length} offset wells within {radiusKm} km · most urgent first
                  </span>
                </div>
                {alerts.map((a) => (
                  <AlertCard key={a.id} alert={a} onWhy={onWhy} />
                ))}
                {alerts.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-muted">
                    No offset-well problems found within {radiusKm} km. Widen the search radius.
                  </div>
                )}
              </div>
            )}
            {tab === 'wells' && <WellsTable wells={wellsInRadius} radiusKm={radiusKm} selectedWell={selectedWell} onRowClick={locateWell} />}
            {tab === 'ask' && <AskPanel messages={messages} pending={pending} scopeWells={visibleWells.map((w) => w.name)} onAsk={(q) => ask(q)} />}
          </SidePanel>
        </section>
      </main>

      <Footer />

      {depthView.open && (
        <Suspense fallback={null}>
          <DepthView
            active={activeWell}
            wells={depthWells}
            bitDepth={bitDepth}
            radiusKm={radiusKm}
            focusWell={depthView.focus}
            onClose={() => setDepthView({ open: false, focus: null })}
            onReady={() => setTimeout(() => markReady('depth'), 300)}
          />
        </Suspense>
      )}
    </div>
  );
}
