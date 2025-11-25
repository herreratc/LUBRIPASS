export type Role = 'GESTOR' | 'ATENDENTE';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  estabelecimento_id: string;
  name: string;
}

export interface Cliente {
  id: string;
  cpf: string;
  nome: string;
  placa?: string;
  saldo?: number;
}

export type SolicitacaoStatus = 'PENDENTE' | 'APROVADA' | 'NEGADA';

export interface Solicitacao {
  id: string;
  cliente_id: string;
  estabelecimento_id: string;
  status: SolicitacaoStatus;
  created_at: string;
  servico_id: string;
  valor?: number;
}

export interface ResgateToken {
  token: string;
  expires_at: string;
  premio: string;
}

export interface DashboardStats {
  pendentes: number;
  aprovadas7d: number;
  resgates30d: number;
  topServico: string;
}

export interface Campanha {
  id: string;
  nome: string;
  multiplicador: number;
  bonus: number;
  ativa: boolean;
}
