import { Card, CardHeader } from '../../components/ui/card';
import { useSession } from '../../hooks/useSession';

export default function ConfigPage() {
  const { profile } = useSession();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader title="Usuário" />
        <ul className="space-y-2 text-sm text-slate-300">
          <li>Nome: {profile?.name}</li>
          <li>Email: {profile?.email}</li>
          <li>Papel: {profile?.role}</li>
        </ul>
      </Card>
      <Card>
        <CardHeader title="Estabelecimento" />
        <p className="text-sm text-slate-300">ID: {profile?.estabelecimento_id}</p>
        <p className="text-xs text-slate-500">Dados detalhados estão no Supabase e no RLS.</p>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader title="Equipe" description="Perfis vinculados ao estabelecimento" />
        <p className="text-sm text-slate-300">Cadastre usuários pelo painel do Supabase ou seeds.</p>
      </Card>
    </div>
  );
}
