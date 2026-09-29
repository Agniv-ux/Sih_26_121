import { useEffect, type ReactNode } from 'react';

export default function Modal({ title, onClose, children, width = 760 }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[rgba(17,24,39,0.45)]" onClick={onClose}>
      <div className="card flex max-h-[88vh] flex-col shadow-lg" style={{ width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="card-h">
          <span>{title}</span>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
