import { useState } from 'react';
import type { QaEntry, ReportDoc } from '../types';
import { docById } from '../data';
import { NO_ANSWER } from '../lib/qa';
import ReportPage from './docs/ReportPage';
import Modal from './ui/Modal';

export interface ChatMessage {
  id: number;
  question: string;
  answer: QaEntry | null;
}

function AnswerText({ text, onCite }: { text: string; onCite: (n: number) => void }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="text-[0.97rem] leading-relaxed">
      {parts.map((p, i) => {
        const m = p.match(/^\[(\d+)\]$/);
        return m ? (
          <button key={i} onClick={() => onCite(Number(m[1]))} className="mx-[1px] align-super text-[0.72rem] font-bold text-navy hover:underline" title="Open source">
            [{m[1]}]
          </button>
        ) : (
          <span key={i}>{p}</span>
        );
      })}
    </p>
  );
}

function Feedback() {
  const [state, setState] = useState<'none' | 'up' | 'wrong'>('none');
  return (
    <div className="mt-3 flex items-center gap-2 text-[0.85rem]">
      <button className={`btn btn-sm ${state === 'up' ? 'border-risk-green text-risk-green' : ''}`} onClick={() => setState('up')} aria-label="Helpful">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M7 11v9H3v-9zM7 11l4-8c1.7 0 3 1.3 3 3v3h5.5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 18.3 20H7" />
        </svg>
        Helpful
      </button>
      <button className={`btn btn-sm ${state === 'wrong' ? 'border-risk-red text-risk-red' : ''}`} onClick={() => setState('wrong')}>
        Report wrong answer
      </button>
      {state === 'up' && <span className="text-risk-green">Thanks – feedback recorded (demo).</span>}
      {state === 'wrong' && <span className="text-risk-red">Flagged for engineer review (demo).</span>}
    </div>
  );
}

export default function AskPanel({ messages }: { messages: ChatMessage[] }) {
  const [open, setOpen] = useState<{ doc: ReportDoc; match: string; n: number } | null>(null);
  const openSource = (a: QaEntry, n: number) => {
    const s = a.sources[n - 1];
    const doc = s && docById(s.docId);
    if (doc) setOpen({ doc, match: s.match, n });
  };

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <div key={m.id} className="space-y-2">
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-[4px] bg-[#e8eef9] px-3 py-2 text-[0.95rem]">
              <span className="mr-1 text-[0.78rem] font-semibold text-navy">Engineer:</span>
              {m.question}
            </div>
          </div>
          <div className="card border-l-[3px] px-4 py-3" style={{ borderLeftColor: m.answer ? '#0B3D91' : '#7F8C8D' }}>
            <div className="mb-1 text-[0.78rem] font-semibold uppercase tracking-wide text-muted">NWIS assistant · answer from selected reports</div>
            {m.answer ? (
              <>
                <AnswerText text={m.answer.answer} onCite={(n) => openSource(m.answer!, n)} />
                <div className="mt-3 border-t border-line pt-2">
                  <div className="label mb-1">Sources</div>
                  <ol className="space-y-1 text-[0.9rem]">
                    {m.answer.sources.map((s, i) => {
                      const d = docById(s.docId)!;
                      return (
                        <li key={i}>
                          <button className="text-left hover:underline" onClick={() => openSource(m.answer!, i + 1)}>
                            <span className="font-semibold text-navy">[{i + 1}]</span> {d.well} · {d.type} · {d.date} · p.{d.page}{' '}
                            <span className="text-muted">– {d.file}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <Feedback />
              </>
            ) : (
              <p className="text-[0.97rem]">
                {NO_ANSWER}{' '}
                <span className="text-muted">The assistant does not guess. Try widening the radius or clearing filters.</span>
              </p>
            )}
          </div>
        </div>
      ))}
      {open && (
        <Modal
          title={
            <span>
              Source [{open.n}] – {open.doc.file} <span className="font-normal text-muted">· page {open.doc.page}</span>
            </span>
          }
          onClose={() => setOpen(null)}
        >
          <p className="mb-2 text-[0.85rem] text-muted">Highlighted lines were used in the answer. Mock report excerpt (sample data).</p>
          <ReportPage doc={open.doc} match={open.match} />
        </Modal>
      )}
    </div>
  );
}
