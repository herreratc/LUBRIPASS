import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { gerarResgate } from '../../services/loyalty';

const schema = z.object({
  cpf: z.string().min(11, { message: 'CPF obrigatório' }),
  premio_id: z.string().min(1, { message: 'Selecione um prêmio' }),
});

type FormData = z.infer<typeof schema>;

export default function ResgatePublicPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [token, setToken] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setCountdown(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const onSubmit = async (values: FormData) => {
    const res = await gerarResgate({ cpf: values.cpf, premio_id: values.premio_id });
    setToken(res.token);
    setExpiresAt(res.expires_at);
  };

  return (
    <div className="bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader title="Gerar token de resgate" description="Apresente ao atendente para validar" />
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input label="CPF" {...register('cpf')} error={errors.cpf?.message} />
            <Select label="Prêmio" {...register('premio_id')} error={errors.premio_id?.message}>
              <option value="">Selecione</option>
              <option value="lavagem">Lavagem grátis</option>
              <option value="troca">Troca de óleo cortesia</option>
            </Select>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Gerando...' : 'Gerar token'}
              </Button>
            </div>
          </form>
          {token && (
            <div className="mt-6 rounded-lg bg-slate-900 p-4 text-center">
              <p className="text-sm text-slate-400">Token válido por tempo limitado</p>
              <p className="text-3xl font-bold tracking-widest text-primary">{token}</p>
              <p className="mt-2 text-sm text-emerald-400">Expira em {countdown}s</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
