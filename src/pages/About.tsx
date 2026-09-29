import PageHeader from '../components/ui/PageHeader';
import { useShotReady } from '../lib/useShotReady';

const STACK: [string, string, string][] = [
  ['Document processing', 'PaddleOCR, OpenCV, pdfplumber, Camelot', 'Read scanned and digital WCRs, DDRs, mud logs; extract tables'],
  ['NLP', 'spaCy + domain rules', 'Pick out well, depth, formation, event, action, result, time lost'],
  ['Database', 'PostgreSQL + PostGIS, TimescaleDB, pgvector', 'Wells and locations, time-series readings, report passages for search'],
  ['Prediction', 'XGBoost, SHAP', 'Risk per 25 m interval with plain-language reasons'],
  ['RAG', 'bge-m3 embeddings, pgvector, Llama / Qwen via Ollama (on-premise)', 'Answer questions from reports with cited sources'],
  ['Live data', 'WITSML, Kafka, FastAPI, WebSockets', 'Read eRTMAC real-time feed and push alerts'],
  ['Frontend', 'React, Leaflet, ECharts', 'Map, correlation, risk and alert screens'],
  ['Security', 'Keycloak, Docker, on-premise deployment', 'Role-based access; no data leaves OIL network'],
];

type BoxDef = { x: number; y: number; w: number; h: number; title: string; sub?: string; accent?: boolean };

function Box({ x, y, w, h, title, sub, accent }: BoxDef) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={accent ? '#FDF6EF' : '#FFFFFF'} stroke={accent ? '#E67E22' : '#0B3D91'} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 5 : h / 2 + 5)} textAnchor="middle" fontSize="14" fontWeight="600" fill="#1F2937">
        {title}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fontSize="11.5" fill="#6B7280">
          {sub}
        </text>
      )}
    </g>
  );
}

const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4B5563" strokeWidth={1.5} markerEnd="url(#arrow)" />
);

function Architecture() {
  // Row 1: ingestion pipeline. Row 2: analytics modules. Row 3: live data -> alerts -> dashboard.
  const bw = 180;
  const bh = 58;
  const r1 = 20;
  const r2 = 150;
  const r3 = 290;
  const x = (i: number) => 20 + i * 250;
  const mods = ['Map', 'Correlation', 'Risk Model', 'RAG'];
  const modSub = ['PostGIS', 'Formation tops', 'XGBoost + SHAP', 'bge-m3 + local LLM'];
  const mx = (i: number) => 150 + i * 200;
  return (
    <svg viewBox="0 0 1000 370" className="h-auto w-full" role="img" aria-label="NWIS architecture diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#4B5563" />
        </marker>
      </defs>
      <Box x={x(0)} y={r1} w={bw} h={bh} title="Reports" sub="WCR, DDR, mud logs" />
      <Box x={x(1)} y={r1} w={bw} h={bh} title="OCR / NLP" sub="PaddleOCR, spaCy" />
      <Box x={x(2)} y={r1} w={bw} h={bh} title="Engineer Review" sub="approve / correct" accent />
      <Box x={x(3)} y={r1} w={bw + 10} h={bh} title="PostgreSQL" sub="PostGIS · TimescaleDB · pgvector" />
      <Arrow x1={x(0) + bw} y1={r1 + bh / 2} x2={x(1) - 2} y2={r1 + bh / 2} />
      <Arrow x1={x(1) + bw} y1={r1 + bh / 2} x2={x(2) - 2} y2={r1 + bh / 2} />
      <Arrow x1={x(2) + bw} y1={r1 + bh / 2} x2={x(3) - 2} y2={r1 + bh / 2} />

      {mods.map((m, i) => (
        <g key={m}>
          <Box x={mx(i)} y={r2} w={160} h={bh} title={m} sub={modSub[i]} />
          <Arrow x1={x(3) + (bw + 10) / 2} y1={r1 + bh} x2={mx(i) + 80} y2={r2 - 2} />
          <Arrow x1={mx(i) + 80} y1={r2 + bh} x2={500} y2={r3 - 2} />
        </g>
      ))}

      <Box x={20} y={r3} w={230} h={bh} title="eRTMAC real-time feed" sub="WITSML → Kafka" />
      <Box x={410} y={r3} w={180} h={bh} title="Alerts" sub="look-ahead + pattern match" accent />
      <Box x={750} y={r3} w={230} h={bh} title="Dashboard" sub="React · Leaflet · ECharts" />
      <Arrow x1={250} y1={r3 + bh / 2} x2={408} y2={r3 + bh / 2} />
      <Arrow x1={590} y1={r3 + bh / 2} x2={748} y2={r3 + bh / 2} />
      <text x={329} y={r3 + bh / 2 - 8} textAnchor="middle" fontSize="11.5" fill="#6B7280">
        FastAPI
      </text>
      <text x={669} y={r3 + bh / 2 - 8} textAnchor="middle" fontSize="11.5" fill="#6B7280">
        WebSockets
      </text>
    </svg>
  );
}

export default function About() {
  useShotReady();
  return (
    <div className="p-4">
      <PageHeader title="About NWIS" subtitle="Team ALTITUDE · Smart India Hackathon 2026 · Problem statement SIH26121 (Oil India Limited)" />
      <div className="mb-3 grid grid-cols-2 gap-3">
        <section className="card">
          <div className="card-h">The problem</div>
          <div className="space-y-2 p-4 text-[0.95rem] leading-relaxed">
            <p>
              Before and during drilling, engineers need to know what happened in nearby (offset) wells: where mud was lost, where pipe got stuck, where kicks were taken, and what fixed it.
            </p>
            <p>
              This knowledge sits in thousands of old well completion reports and daily drilling reports – many of them scanned paper. Finding the right page takes hours, so lessons are often missed
              and the same problems cost rig time again.
            </p>
          </div>
        </section>
        <section className="card">
          <div className="card-h">Our solution</div>
          <div className="space-y-2 p-4 text-[0.95rem] leading-relaxed">
            <p>
              <b>NWIS</b> is a decision-support system that runs alongside OIL's real-time drilling monitor (eRTMAC). It reads old reports with OCR and NLP, shows offset wells on a map, compares wells
              by depth and formation, predicts drilling risks from offset-well history, and warns engineers <b>before</b> the bit reaches a risky zone – together with what worked before.
            </p>
            <p>Engineers can also ask questions of the reports in plain language and get answers with the sources cited. NWIS advises; people decide.</p>
          </div>
        </section>
      </div>

      <section className="card mb-3">
        <div className="card-h">Architecture</div>
        <div className="px-6 py-4">
          <Architecture />
        </div>
      </section>

      <section className="card mb-3">
        <div className="card-h">Technology stack (planned full system)</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Tools</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {STACK.map(([a, b, c]) => (
              <tr key={a}>
                <td className="font-semibold">{a}</td>
                <td>{b}</td>
                <td className="text-muted">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="border border-[#f0c9a2] bg-[#fdf6ef] px-4 py-3 text-[0.92rem]">
        <b>Note:</b> Prototype built with sample data. Planned validation on Equinor's public Volve dataset with recorded real-time data replayed as eRTMAC. This prototype is frontend only – all
        "AI" outputs are pre-written sample data. It is not an official Oil India Limited or Government of India website.
      </div>
    </div>
  );
}
