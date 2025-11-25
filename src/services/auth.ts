import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const token = data.session?.access_token ?? '';
  const profile = await loadProfile();
  if (!profile) throw new Error('Perfil não encontrado');
  return { token, profile };
}

export async function loadProfile(): Promise<UserProfile | undefined> {
  const { data, error } = await supabase.from('perfis').select('*').single();
  if (error) return undefined;
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    estabelecimento_id: data.estabelecimento_id,
    name: data.nome,
  };
}

export async function logout() {
  await supabase.auth.signOut();
}
