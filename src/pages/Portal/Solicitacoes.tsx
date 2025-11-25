import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { listarSolicitacoesPendentes, aprovarSolicitacao, negarSolicitacao } from '../../services/loyalty';
import { Modal } from '../../components/ui/modal';
import { Input } from '../../components/ui/input';

export default function SolicitacoesPage() {
  const queryClient = useQueryClient();
  const solicitacoes = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: listarSolicitacoesPendentes,
    refetchInterval: 5000,
  });
  const approve = useMutation({
    mutationFn: (id: string) => aprovarSolicitacao(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitacoes'] }),
  });
  const deny = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) => negarSolicitacao(id, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitacoes'] }),
  });
  const [editing, setEditing] = useState<{ id: string; placa?: string }>();
  const [motivo, setMotivo] = useState('');

  return (
    <Card>
      <CardHeader title="Solicitações pendentes" description="Aprovar gera pontos conforme regras" />
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Serviço</th>
              <th>Valor</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {solicitacoes.data?.map((item) => (
              <tr key={item.id}>
                <td>{item.cliente_id}</td>
                <td>{item.servico_id}</td>
                <td>{item.valor ?? '-'}</td>
                <td>{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                <td className="flex gap-2 py-3">
                  <Button onClick={() => approve.mutate(item.id)} disabled={approve.isLoading}>
                    Aprovar
                  </Button>
                  <Button variant="outline" onClick={() => setEditing({ id: item.id })}>
                    Negar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal title="Negar solicitação" open={!!editing} onClose={() => setEditing(undefined)}>
        <p className="mb-3 text-sm text-slate-300">Informe o motivo para negar a solicitação.</p>
        <Input label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(undefined)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!editing) return;
              deny.mutate({ id: editing.id, motivo });
              setEditing(undefined);
              setMotivo('');
            }}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
