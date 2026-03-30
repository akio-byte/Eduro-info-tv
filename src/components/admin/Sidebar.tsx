import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Calendar, Star, QrCode, Settings, LogOut, MonitorPlay } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navigation = [
  { name: 'Kojelauta', href: '/admin', icon: LayoutDashboard },
  { name: 'Tiedotteet', href: '/admin/announcements', icon: Megaphone },
  { name: 'Tapahtumat', href: '/admin/events', icon: Calendar },
  { name: 'Nostot', href: '/admin/highlights', icon: Star },
  { name: 'QR-linkit', href: '/admin/qr-links', icon: QrCode },
  { name: 'Asetukset', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <MonitorPlay className="h-6 w-6 text-slate-900 mr-2" />
        <span className="text-lg font-semibold text-slate-900">Eduro InfoTV</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 space-y-2">
        <Link
          to="/display"
          target="_blank"
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          <MonitorPlay className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-500" />
          Avaa näyttö
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-500" />
          Kirjaudu ulos
        </button>
      </div>
    </div>
  );
}
