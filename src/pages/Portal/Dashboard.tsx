import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader } from '../../components/ui/card';
import { dashboardStats } from '../../services/loyalty';

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardStats });

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader title="Pendentes" />
        <p className="text-3xl font-bold text-primary">{data?.pendentes ?? 0}</p>
      </Card>
      <Card>
        <CardHeader title="Aprovadas (7d)" />
        <p className="text-3xl font-bold text-emerald-400">{data?.aprovadas7d ?? 0}</p>
      </Card>
      <Card>
        <CardHeader title="Resgates (30d)" />
        <p className="text-3xl font-bold text-amber-400">{data?.resgates30d ?? 0}</p>
      </Card>
      <Card>
        <CardHeader title="Serviço mais usado" />
        <p className="text-xl font-semibold">{data?.topServico ?? '---'}</p>
      </Card>
    </div>
  );
}
