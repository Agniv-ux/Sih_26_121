import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import AskPanel, { type ChatMessage } from '../components/AskPanel';
import PageHeader from '../components/ui/PageHeader';
import { QA } from '../data';
import { FORMATIONS } from '../lib/constants';
import { answerInScope, matchQuestion, type Scope } from '../lib/qa';
import { useShotReady } from '../lib/useShotReady';
import { useApp } from '../state/AppState';

export default function AskReports() {
  const [params] = useSearchParams();
  const { wellsInRadius, radiusKm } = useApp();
  const [excluded, setExcluded] = useState<string[]>([]);
  const [formation, setFormation] = useState('All');
  const [depthFrom, setDepthFrom] = useState(0);
  const [depthTo, setDepthTo] = useState(4500);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const seq = useRef(0);

  const scopeWells = wellsInRadius.map((w) => w.name).filter((n) => !excluded.includes(n));
  const scope: Scope = { wells: scopeWells, formation, depthFrom, depthTo };

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const match = matchQuestion(text);
    const answer = match && answerInScope(match, scope) ? match : null;
    const question = match && text.toLowerCase() === match.id ? match.question : text;
    setMessages((m) => [...m, { id: ++seq.current, question, answer }]);
    setInput('');
  };

  // Pre-filled question from ?q= (e.g. from an alert's "Why?" button)
  const q = params.get('q');
  useEffect(() => {
    if (q) {
      setMessages([]);
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useShotReady(!q || messages.length > 0);

  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length > 1) bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  return (
    <div className="p-4">
      <PageHeader title="Ask the Reports (RAG Assistant)" subtitle="Ask questions of old well reports. Every answer cites the report, date and page it came from." />

      <div className="mb-3 flex items-start gap-3 border border-[#b9cbe9] bg-[#eef3fb] px-4 py-2.5 text-[0.92rem]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="1.8" className="mt-[2px] flex-none" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </svg>
        <span>
          Answers are generated only from reports of wells selected on the map (currently: <b>{scopeWells.length} offset wells within {radiusKm} km</b>). Runs on OIL's own servers – no data
          leaves the network.
        </span>
      </div>

      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <section className="card mb-3">
            <div className="card-h">
              <span>Scope</span>
              <span className="text-[0.82rem] font-normal text-muted">Click a well to include / exclude it</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="label mr-1">Wells</span>
                {wellsInRadius.map((w) => {
                  const on = !excluded.includes(w.name);
                  return (
                    <button
                      key={w.name}
                      className={`chip ${on ? 'on' : 'text-muted line-through'}`}
                      onClick={() => setExcluded((x) => (on ? [...x, w.name] : x.filter((n) => n !== w.name)))}
                      aria-pressed={on}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-2">
                <span className="label">Formation</span>
                <select className="input" value={formation} onChange={(e) => setFormation(e.target.value)}>
                  <option>All</option>
                  {FORMATIONS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="label">Depth</span>
                <input className="input w-[80px]" type="number" value={depthFrom} step={100} onChange={(e) => setDepthFrom(Number(e.target.value))} aria-label="Depth from" />
                <span className="text-muted">to</span>
                <input className="input w-[80px]" type="number" value={depthTo} step={100} onChange={(e) => setDepthTo(Number(e.target.value))} aria-label="Depth to" />
                <span className="text-muted">m</span>
              </label>
            </div>
          </section>

          <section className="card">
            <div className="card-h">Conversation</div>
            <div className="min-h-[300px] p-4">
              {messages.length === 0 ? (
                <div className="py-10 text-center text-muted">Pick a suggested question or type your own below.</div>
              ) : (
                <AskPanel messages={messages} />
              )}
              <div ref={bottom} />
            </div>
            <form
              className="flex gap-2 border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input className="input flex-1" placeholder="Ask about losses, stuck pipe, mud weight, cementing… in the selected wells" value={input} onChange={(e) => setInput(e.target.value)} />
              <button className="btn btn-primary" type="submit">
                Ask
              </button>
            </form>
          </section>
        </div>

        <aside className="w-[330px] flex-none space-y-3">
          <section className="card">
            <div className="card-h">Suggested questions</div>
            <div className="space-y-2 p-3">
              {QA.filter((e) => e.suggested).map((e) => (
                <button key={e.id} className="btn w-full justify-start whitespace-normal py-2 text-left" onClick={() => ask(e.question)}>
                  {e.question}
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="card-h">How answers are made</div>
            <ol className="list-decimal space-y-1 py-3 pl-8 pr-4 text-[0.86rem] text-muted">
              <li>Report text is split into passages and indexed (bge-m3 embeddings in pgvector).</li>
              <li>Only passages from wells in scope are searched.</li>
              <li>A local LLM (Llama / Qwen via Ollama) writes the answer from those passages only.</li>
              <li>If nothing relevant is found, it says so instead of guessing.</li>
            </ol>
            <div className="border-t border-line px-4 py-2 text-[0.8rem] text-muted">Prototype: answers are pre-written sample text matched by keywords.</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
