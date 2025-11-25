import { supabase } from '../lib/supabase';
import { Campanha, Cliente, DashboardStats, ResgateToken, Solicitacao } from '../types';

export async function criarSolicitacao(payload: { cpf: string; placa?: string; servico_id?: string; valor?: number }) {
  const { error } = await supabase.rpc('criar_solicitacao', payload);
  if (error) throw error;
}

export async function aprovarSolicitacao(id: string) {
  const { error } = await supabase.rpc('aprovar_solicitacao', { solicitacao_id: id });
  if (error) throw error;
}

export async function negarSolicitacao(id: string, motivo?: string) {
  const { error } = await supabase.rpc('negar_solicitacao', { solicitacao_id: id, motivo });
  if (error) throw error;
}

export async function listarSolicitacoesPendentes(): Promise<Solicitacao[]> {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select('*')
    .eq('status', 'PENDENTE')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saldoPublico(cpf: string) {
  const { data, error } = await supabase.rpc('public_saldo', { cpf_input: cpf });
  if (error) throw error;
  return data;
}

export async function gerarResgate(payload: { cpf: string; premio_id: string }): Promise<ResgateToken> {
  const { data, error } = await supabase.rpc('gerar_resgate', payload);
  if (error) throw error;
  return data;
}

export async function validarResgate(token: string) {
  const { data, error } = await supabase.rpc('validar_resgate', { token_input: token });
  if (error) throw error;
  return data;
}

export async function dashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('dashboard_stats');
  if (error) throw error;
  return data;
}

export async function listarResgates() {
  const { data, error } = await supabase
    .from('resgates')
    .select('id,cliente_id,created_at,token,status,premio')
    .order('created_at', { ascending: false })
    .limit(15);
  if (error) throw error;
  return data ?? [];
}

export async function clientesRecentes(busca?: string): Promise<Cliente[]> {
  const query = supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (busca) {
    query.or(`cpf.ilike.%${busca}%,placa.ilike.%${busca}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function campanhasAtivas(): Promise<Campanha[]> {
  const { data, error } = await supabase.from('campanhas').select('*').order('ativa', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function salvarCampanha(campanha: Partial<Campanha>) {
  const { error } = await supabase.from('campanhas').upsert(campanha);
  if (error) throw error;
}
