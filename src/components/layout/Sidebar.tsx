import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Gift, Home, Layers, ListChecks, Settings, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/solicitacoes', label: 'Solicitações', icon: ListChecks },
    { to: '/resgates', label: 'Resgates', icon: Gift },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/campanhas', label: 'Campanhas', icon: Layers },
    { to: '/config', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className={cn('fixed left-0 top-0 z-30 h-full w-64 border-r border-slate-800 bg-slate-950 px-4 py-6 md:relative md:translate-x-0', open ? 'translate-x-0' : '-translate-x-full md:block') }>
      <div className="mb-6 text-xl font-bold text-white">LUBRIPASS</div>
      <nav className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800',
                active && 'bg-primary text-white hover:bg-primary'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
