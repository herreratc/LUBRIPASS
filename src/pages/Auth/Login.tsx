import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { login } from '../../services/auth';
import { useSession } from '../../hooks/useSession';
import { Card } from '../../components/ui/card';

const schema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { setAuth } = useSession();

  const onSubmit = async (values: FormData) => {
    const { token, profile } = await login(values.email, values.password);
    setAuth({ token, profile });
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="mb-2 text-2xl font-semibold text-white">Entrar no portal</h1>
        <p className="mb-6 text-sm text-slate-400">Use as credenciais do Supabase Auth</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Senha" type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Autenticando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
