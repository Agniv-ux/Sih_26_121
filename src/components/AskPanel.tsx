import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';
import { qaById, suggestedQaIds } from '../data';

interface Props {
  messages: ChatMessage[];
  pending: boolean;
  scopeWells: string[];
  onAsk: (question: string) => void;
}

export default function AskPanel({ messages, pending, scopeWells, onAsk }: Props) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pending]);

  const submit = (q: string) => {
    const t = q.trim();
    if (!t || pending) return;
    onAsk(t);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-lg border border-line bg-panel px-4 py-3">
        <p className="text-[0.9rem] text-ink">Answers come only from reports of the wells selected on the map.</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.78rem]">
          <span className="text-muted">In scope ({scopeWells.length}):</span>
          {scopeWells.map((w) => (
            <span key={w} className="rounded border border-line bg-bg px-1.5 py-0.5 text-ink">
              {w}
            </span>
          ))}
          {scopeWells.length === 0 && <span className="text-muted">none — widen the radius or clear the filter</span>}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && !pending && (
          <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[0.9rem] text-muted">
            Ask a question about the offset-well reports, or pick a suggested question below.
          </div>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-sm bg-accent/15 border border-accent/40 px-3.5 py-2.5 text-[0.95rem] text-ink">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="rounded-lg rounded-bl-sm border border-line bg-panel px-4 py-3">
              <div className="mb-1.5 text-[0.72rem] uppercase tracking-wider text-muted">From offset-well reports</div>
              <p className="text-[0.95rem] leading-relaxed text-ink">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[0.78rem] font-medium text-muted">Sources:</span>
                  {m.sources.map((s) => (
                    <span key={s} className="rounded border border-line bg-bg px-2 py-0.5 text-[0.78rem] text-ink">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {pending && <div className="px-1 text-[0.85rem] text-muted">Searching {scopeWells.length} well reports…</div>}
        <div ref={endRef} />
      </div>

      <div className="mt-3">
        <div className="mb-2 text-[0.72rem] uppercase tracking-wider text-muted">Suggested questions</div>
        <div className="flex flex-col gap-1.5">
          {suggestedQaIds.map((id) => {
            const q = qaById.get(id)!.question;
            return (
              <button
                key={id}
                type="button"
                onClick={() => submit(q)}
                className="rounded-md border border-line bg-panel px-3 py-2 text-left text-[0.88rem] text-ink hover:border-accent"
              >
                {q}
              </button>
            );
          })}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about losses, stuck pipe, kicks, cementing…"
            className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-[0.9rem] text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-[0.9rem] font-semibold text-bg hover:bg-amber-400 disabled:opacity-50"
            disabled={pending || !draft.trim()}
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
