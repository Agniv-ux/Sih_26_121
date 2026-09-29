import { NavLink } from 'react-router';
import { useApp } from '../../state/AppState';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const icons: Record<string, React.ReactNode> = {
  map: <><path {...P} d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path {...P} d="M9 4v14M15 6v14" /></>,
  bell: <><path {...P} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path {...P} d="M10 20a2 2 0 0 0 4 0" /></>,
  layers: <><path {...P} d="M4 5h4v15H4zM10 5h4v15h-4zM16 5h4v15h-4z" /><path {...P} d="M4 10h16M4 14h16" strokeDasharray="2 2" /></>,
  risk: <><path {...P} d="M12 3l9 16H3z" /><path {...P} d="M12 10v4M12 17v.5" /></>,
  chat: <><path {...P} d="M4 5h16v11H9l-5 4z" /><path {...P} d="M8 9h8M8 12h5" /></>,
  search: <><circle {...P} cx="11" cy="11" r="6" /><path {...P} d="M16 16l4 4" /></>,
  doc: <><path {...P} d="M6 3h8l4 4v14H6z" /><path {...P} d="M14 3v4h4M9 12h6M9 16h6" /></>,
  check: <><rect {...P} x="4" y="4" width="16" height="16" /><path {...P} d="M8 12l3 3 5-6" /></>,
  info: <><circle {...P} cx="12" cy="12" r="9" /><path {...P} d="M12 11v6M12 7.5v.5" /></>,
};

const LINKS = [
  { to: '/', label: 'Dashboard', sub: 'Nearby Wells Map', icon: 'map' },
  { to: '/alerts', label: 'Live Alerts', icon: 'bell' },
  { to: '/depth', label: 'Depth Correlation', icon: 'layers' },
  { to: '/risk', label: 'Risk Prediction', icon: 'risk' },
  { to: '/ask', label: 'Ask the Reports', sub: 'RAG Assistant', icon: 'chat' },
  { to: '/search', label: 'Knowledge Search', icon: 'search' },
  { to: '/documents', label: 'Document Processing', icon: 'doc' },
  { to: '/review', label: 'Engineer Review', icon: 'check' },
  { to: '/about', label: 'About NWIS', icon: 'info' },
];

export default function Sidebar() {
  const { alerts } = useApp();
  return (
    <nav className="nav flex w-[232px] flex-none flex-col border-r border-line bg-white py-2" aria-label="Main">
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            {icons[l.icon]}
          </svg>
          <span className="flex-1 leading-tight">
            {l.label}
            {l.sub && <span className="block text-[0.76rem] font-normal text-muted">{l.sub}</span>}
          </span>
          {l.to === '/alerts' && alerts.length > 0 && (
            <span className="rounded-[3px] bg-risk-red px-1.5 text-[0.75rem] font-semibold text-white">{alerts.length}</span>
          )}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-line px-4 pt-3 text-[0.78rem] leading-snug text-muted">
        Decision-support prototype. Runs alongside eRTMAC; does not control drilling.
        <br />
        Sample data only.
      </div>
    </nav>
  );
}
