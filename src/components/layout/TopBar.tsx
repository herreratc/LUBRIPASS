import { LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { Button } from '../ui/button';
import { logout } from '../../services/auth';

interface Props {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: Props) {
  const { profile, clear } = useSession();

  const handleLogout = async () => {
    await logout();
    clear();
    window.location.href = '/login';
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={onToggleSidebar} aria-label="Menu">
          <Menu className="text-slate-200" size={20} />
        </button>
        <Link to="/dashboard" className="text-lg font-bold text-white">
          LUBRIPASS Portal
        </Link>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-200">
        <div className="text-right">
          <p className="font-semibold">{profile?.name ?? 'Usuário'}</p>
          <p className="text-xs text-slate-400">{profile?.role}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut size={16} /> Sair
        </Button>
      </div>
    </header>
  );
}
