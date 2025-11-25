import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { criarSolicitacao } from '../../services/loyalty';

const schema = z.object({
  cpf: z.string().min(11, { message: 'CPF obrigatório' }),
  placa: z.string().optional(),
  servico_id: z.string().min(1, { message: 'Escolha um serviço' }),
  valor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegistroPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    await criarSolicitacao({
      cpf: values.cpf,
      placa: values.placa,
      servico_id: values.servico_id,
      valor: values.valor ? Number(values.valor) : undefined,
    });
    alert('Solicitação enviada! Lembre-se: 1 uso por CPF por dia.');
    reset();
  };

  return (
    <div className="bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader title="Registro de uso" description="Crie uma solicitação para pontuar o cliente" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input label="CPF" placeholder="Somente números" {...register('cpf')} error={errors.cpf?.message} />
            <Input label="Placa" placeholder="OPCIONAL" {...register('placa')} error={errors.placa?.message} />
            <Select label="Serviço" {...register('servico_id')} error={errors.servico_id?.message}>
              <option value="">Selecione</option>
              <option value="troca_oleo">Troca de óleo</option>
              <option value="filtro">Filtro</option>
            </Select>
            <Input label="Valor gasto (R$)" type="number" step="0.01" {...register('valor')} error={errors.valor?.message} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
              </Button>
            </div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Regras" description="1 uso por CPF por dia. Solicitações vão para revisão do atendente." />
          <p className="text-sm text-slate-300">Campanhas ativas aplicam bônus e multiplicadores automaticamente.</p>
        </Card>
      </div>
    </div>
  );
}
