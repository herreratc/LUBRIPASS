import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export function ProtectedRoute() {
  const { token } = useSession();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
