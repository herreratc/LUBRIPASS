import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { campanhasAtivas, salvarCampanha } from '../../services/loyalty';
import { Modal } from '../../components/ui/modal';

const schema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3),
  multiplicador: z.coerce.number().min(1),
  bonus: z.coerce.number().min(0),
  ativa: z.coerce.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function CampanhasPage() {
  const queryClient = useQueryClient();
  const campanhas = useQuery({ queryKey: ['campanhas'], queryFn: campanhasAtivas });
  const mutation = useMutation({
    mutationFn: (payload: FormData) => salvarCampanha(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campanhas'] }),
  });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormData) => {
    mutation.mutate(values);
    setOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Campanhas" description="Multiplicador e bônus são aplicados nas solicitações" />
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setOpen(true)}>Nova campanha</Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Multiplicador</th>
                <th>Bônus</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {campanhas.data?.map((campanha) => (
                <tr key={campanha.id}>
                  <td>{campanha.nome}</td>
                  <td>x{campanha.multiplicador}</td>
                  <td>{campanha.bonus} pts</td>
                  <td>{campanha.ativa ? 'Ativa' : 'Inativa'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal title="Cadastrar campanha" open={open} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Nome" {...register('nome')} error={formState.errors.nome?.message} />
          <Input label="Multiplicador" type="number" step="0.1" {...register('multiplicador')} error={formState.errors.multiplicador?.message} />
          <Input label="Bônus" type="number" step="1" {...register('bonus')} error={formState.errors.bonus?.message} />
          <Select label="Status" {...register('ativa')}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
