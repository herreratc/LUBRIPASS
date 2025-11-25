import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { RoleGuard } from '../guards/RoleGuard';
import LoginPage from '../pages/Auth/Login';
import RegistroPage from '../pages/Public/Registro';
import MinhaContaPage from '../pages/Public/MinhaConta';
import ResgatePublicPage from '../pages/Public/Resgate';
import DashboardPage from '../pages/Portal/Dashboard';
import SolicitacoesPage from '../pages/Portal/Solicitacoes';
import ResgatesPage from '../pages/Portal/Resgates';
import ClientesPage from '../pages/Portal/Clientes';
import CampanhasPage from '../pages/Portal/Campanhas';
import ConfigPage from '../pages/Portal/Config';
import PortalLayout from '../pages/Portal/Layout';

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { path: '/', element: <RegistroPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/minha-conta', element: <MinhaContaPage /> },
      { path: '/resgate', element: <ResgatePublicPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/solicitacoes', element: <SolicitacoesPage /> },
          { path: '/resgates', element: <ResgatesPage /> },
          { path: '/clientes', element: <ClientesPage /> },
          { path: '/campanhas', element: <CampanhasPage /> },
          {
            element: <RoleGuard allowed={['GESTOR']} />,
            children: [{ path: '/config', element: <ConfigPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <RegistroPage /> },
]);

export default router;
