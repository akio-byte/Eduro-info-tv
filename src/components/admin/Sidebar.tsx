import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Calendar, Star, QrCode, Settings, LogOut, MonitorPlay, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Kojelauta', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'editor'] },
  { name: 'Tiedotteet', href: '/admin/announcements', icon: Megaphone, roles: ['admin', 'editor'] },
  { name: 'Tapahtumat', href: '/admin/events', icon: Calendar, roles: ['admin', 'editor'] },
  { name: 'Nostot', href: '/admin/highlights', icon: Star, roles: ['admin', 'editor'] },
  { name: 'QR-linkit', href: '/admin/qr-links', icon: QrCode, roles: ['admin', 'editor'] },
  { name: 'Asetukset', href: '/admin/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const filteredNavigation = navigation.filter((item) => role && item.roles.includes(role));

  return (
    <div className="brand-panel m-4 flex h-[calc(100vh-2rem)] w-72 flex-col overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm">
      <div className="border-b border-[var(--color-brand-border)] px-6 py-6">
        <div className="brand-wordmark">
          <span className="brand-wordmark__eyebrow text-[var(--color-brand-primary)]">Eduro</span>
          <span className="brand-wordmark__title text-[var(--color-brand-ink)]">InfoTV</span>
        </div>
        <p className="mt-3 text-sm text-[var(--color-brand-muted)]">Hallittu lobbynäytön sisältö yhdestä paikasta.</p>
      </div>

      <div className="flex-1 overflow-y-auto py-5">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand-surface-muted)] text-[var(--color-brand-primary)]'
                    : 'text-slate-700 hover:bg-[var(--color-brand-surface)] hover:text-[var(--color-brand-ink)]'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-[var(--color-brand-primary)]' : 'text-slate-400 group-hover:text-[var(--color-brand-primary)]'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 border-t border-[var(--color-brand-border)] p-4">
        <Link
          to="/admin/preview"
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--color-brand-surface)] hover:text-[var(--color-brand-ink)]"
        >
          <Eye className="mr-3 h-5 w-5 text-slate-400 group-hover:text-[var(--color-brand-primary)]" />
          Esikatselu
        </Link>
        <Link
          to="/display"
          target="_blank"
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--color-brand-surface)] hover:text-[var(--color-brand-ink)]"
        >
          <MonitorPlay className="mr-3 h-5 w-5 text-slate-400 group-hover:text-[var(--color-brand-primary)]" />
          Avaa näyttö
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[var(--color-brand-surface)] hover:text-[var(--color-brand-ink)]"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-[var(--color-brand-primary)]" />
          Kirjaudu ulos
        </button>
      </div>
    </div>
  );
}
