import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { clientesRecentes } from '../../services/loyalty';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['clientes', search], queryFn: () => clientesRecentes(search) });

  return (
    <Card>
      <CardHeader title="Clientes" description="Busque por CPF ou placa" />
      <div className="mb-4 flex gap-3">
        <Input label="Filtro" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="CPF ou placa" />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="table">
          <thead>
            <tr>
              <th>CPF</th>
              <th>Nome</th>
              <th>Placa</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {query.data?.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.cpf}</td>
                <td>{cliente.nome}</td>
                <td>{cliente.placa ?? '-'}</td>
                <td>{cliente.saldo ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
