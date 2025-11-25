import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '../types';
import { useSession } from '../hooks/useSession';

export function RoleGuard({ allowed }: { allowed: Role[] }) {
  const { profile } = useSession();
  if (!profile || !allowed.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
