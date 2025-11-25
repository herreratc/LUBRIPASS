import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { saldoPublico } from '../../services/loyalty';

const schema = z.object({
  cpf: z.string().min(11, { message: 'Informe o CPF' }),
});

type FormData = z.infer<typeof schema>;

export default function MinhaContaPage() {
  const { register, handleSubmit, watch, formState } = useForm<FormData>({ resolver: zodResolver(schema) });
  const cpf = watch('cpf');
  const query = useQuery({
    queryKey: ['saldo', cpf],
    enabled: !!cpf && cpf.length >= 11,
    queryFn: () => saldoPublico(cpf),
  });

  return (
    <div className="bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader title="Consultar saldo" description="Digite o CPF para visualizar pontos" />
          <form className="flex gap-3" onSubmit={handleSubmit(() => query.refetch())}>
            <Input label="CPF" {...register('cpf')} error={formState.errors.cpf?.message} />
            <Button type="submit" className="self-end">Consultar</Button>
          </form>
          <div className="mt-6 rounded-lg bg-slate-900 p-4">
            {query.isFetching && <p>Buscando saldo...</p>}
            {query.data && (
              <div className="space-y-2">
                <p className="text-lg font-semibold">Saldo: {query.data.saldo_total} pts</p>
                <p className="text-sm text-slate-300">Próximos prêmios: {query.data.proximos_premios?.join(', ') ?? '---'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
