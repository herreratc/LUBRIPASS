import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { listarResgates, validarResgate } from '../../services/loyalty';

const schema = z.object({
  token: z.string().min(6, { message: 'Token obrigatório' }),
});

type FormData = z.infer<typeof schema>;

export default function ResgatesPage() {
  const queryClient = useQueryClient();
  const resgates = useQuery({ queryKey: ['resgates'], queryFn: listarResgates, refetchInterval: 10000 });
  const mutation = useMutation({
    mutationFn: (token: string) => validarResgate(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resgates'] }),
  });
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormData) => mutation.mutate(values.token);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Validar token" description="Confirme resgates gerados no app público" />
        <form className="flex gap-3" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Token" {...register('token')} error={formState.errors.token?.message} />
          <Button type="submit" className="self-end" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Validando...' : 'Validar'}
          </Button>
        </form>
        {mutation.data && (
          <p className="mt-4 text-sm text-emerald-400">Resgate validado para cliente {mutation.data?.cliente_id}</p>
        )}
      </Card>
      <Card>
        <CardHeader title="Histórico recente" />
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {resgates.data?.map((item) => (
                <tr key={item.id}>
                  <td>{item.token}</td>
                  <td>{item.cliente_id}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
