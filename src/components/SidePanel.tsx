import type { ReactNode } from 'react';
import type { TabId } from '../types';

interface Props {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  alertCount: number;
  wellCount: number;
  children: ReactNode;
}

export default function SidePanel({ tab, onTabChange, alertCount, wellCount, children }: Props) {
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'alerts', label: 'Alerts', badge: alertCount },
    { id: 'wells', label: 'Nearby Wells', badge: wellCount },
    { id: 'ask', label: 'Ask the Reports' },
  ];
  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-line bg-bg">
      <nav className="flex shrink-0 border-b border-line bg-panel px-2" role="tablist">
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-[0.95rem] font-medium ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className={`rounded px-1.5 text-[0.75rem] font-semibold ${on ? 'bg-accent text-bg' : 'bg-line text-ink'}`}>{t.badge}</span>
              )}
              {on && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent" />}
            </button>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
