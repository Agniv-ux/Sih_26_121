import { useApp } from '../state/AppState';
import type { Role } from '../types';

const ROLES: { id: Role; label: string }[] = [
  { id: 'field', label: 'Field Engineer' },
  { id: 'office', label: 'Office Engineer' },
];

export default function Header() {
  const { role, setRole } = useApp();
  return (
    <header className="flex h-[60px] flex-none items-center justify-between bg-navy px-5 text-white">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[1.25rem] font-bold leading-tight tracking-[0.01em]">NWIS – Nearby Wells Intelligence System</div>
          <div className="text-[0.78rem] text-[#c9d6ee]">Team ALTITUDE · SIH 2026 · SIH26121</div>
        </div>
        <span className="rounded-[3px] border border-[#f3b77f] px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide text-[#f8c795]">
          Prototype · sample data
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-[0.85rem]">
          <span className="text-[#c9d6ee]">Role</span>
          <div className="flex overflow-hidden rounded-[3px] border border-[#5b7fc0]" role="group" aria-label="Role">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`px-3 py-1 text-[0.85rem] ${role === r.id ? 'bg-white font-semibold text-navy' : 'bg-transparent text-white hover:bg-[#164a9f]'}`}
                aria-pressed={role === r.id}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 border-l border-[#3f66ad] pl-5 text-[0.88rem]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Demo User
        </div>
      </div>
    </header>
  );
}
