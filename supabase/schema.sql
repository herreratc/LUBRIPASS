-- Tabelas principais
create table if not exists public.estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  created_at timestamp with time zone default now()
);

create table if not exists public.perfis (
  id uuid primary key default auth.uid(),
  usuario_id uuid references auth.users(id) on delete cascade,
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  email text not null,
  nome text,
  role text check (role in ('GESTOR','ATENDENTE')) not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  cpf text not null,
  nome text,
  created_at timestamp with time zone default now()
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  placa text,
  modelo text,
  created_at timestamp with time zone default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  pontos_base int default 0,
  pontos_por_real int default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  multiplicador numeric default 1,
  bonus int default 0,
  ativa boolean default true,
  starts_at date default current_date,
  ends_at date,
  created_at timestamp with time zone default now()
);

create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  cliente_id uuid references public.clientes(id),
  servico_id uuid references public.servicos(id),
  valor numeric,
  status text check (status in ('PENDENTE','APROVADA','NEGADA')) default 'PENDENTE',
  created_at timestamp with time zone default now(),
  motivo_negacao text
);

create table if not exists public.pontos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  cliente_id uuid references public.clientes(id),
  solicitacao_id uuid references public.solicitacoes(id),
  quantidade int not null,
  origem text default 'SOLICITACAO',
  created_at timestamp with time zone default now()
);

create table if not exists public.regras_resgate (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  descricao text,
  custo_pontos int not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.resgates (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  cliente_id uuid references public.clientes(id),
  premio uuid references public.regras_resgate(id),
  token text unique not null,
  status text check (status in ('GERADO','VALIDADO','EXPIRADO')) default 'GERADO',
  expires_at timestamp with time zone not null,
  validated_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.limites_uso (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos(id) on delete cascade,
  cpf text not null,
  data date not null default current_date,
  constraint unique_cpf_dia unique (estabelecimento_id, cpf, data)
);

-- View de saldo
create or replace view public.v_saldo_cliente as
select c.id as cliente_id,
       c.cpf,
       c.nome,
       sum(p.quantidade) as saldo_total
from public.clientes c
left join public.pontos p on p.cliente_id = c.id
group by c.id, c.cpf, c.nome;

-- Helpers
create or replace function public.only_digits(text) returns text language sql immutable as $$
  select regexp_replace($1, '\D', '', 'g');
$$;

create or replace function public.get_or_create_cliente(cpf_input text, placa_input text default null, estabelecimento uuid)
returns uuid
language plpgsql
as $$
declare
  cliente_id uuid;
begin
  select id into cliente_id from public.clientes where cpf = only_digits(cpf_input) and estabelecimento_id = estabelecimento limit 1;
  if cliente_id is null then
    insert into public.clientes (cpf, estabelecimento_id, nome) values (only_digits(cpf_input), estabelecimento, 'Cliente') returning id into cliente_id;
  end if;
  if placa_input is not null then
    insert into public.veiculos (cliente_id, placa) values (cliente_id, placa_input) on conflict do nothing;
  end if;
  return cliente_id;
end;
$$;

-- RPCs
create or replace function public.criar_solicitacao(cpf text, placa text default null, servico_id uuid default null, valor numeric default 0)
returns void
language plpgsql
security definer
as $$
declare
  estabelecimento uuid;
  cliente uuid;
begin
  select estabelecimento_id into estabelecimento from perfis where id = auth.uid();
  if exists(select 1 from limites_uso where estabelecimento_id = estabelecimento and cpf = only_digits(cpf) and data = current_date) then
    raise exception 'Limite diário já utilizado';
  end if;
  cliente := get_or_create_cliente(cpf, placa, estabelecimento);
  insert into solicitacoes (estabelecimento_id, cliente_id, servico_id, valor, status) values (estabelecimento, cliente, servico_id, valor, 'PENDENTE');
  insert into limites_uso (estabelecimento_id, cpf) values (estabelecimento, only_digits(cpf));
end;
$$;

create or replace function public.aprovar_solicitacao(solicitacao_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  s solicitacoes%rowtype;
  serv servicos%rowtype;
  pontos_calc int;
  campanha campanhas%rowtype;
begin
  select * into s from solicitacoes where id = solicitacao_id;
  select * into serv from servicos where id = s.servico_id;
  select * into campanha from campanhas where estabelecimento_id = s.estabelecimento_id and ativa = true limit 1;
  pontos_calc := coalesce(serv.pontos_base,0) + coalesce(serv.pontos_por_real,0) * coalesce(s.valor,0);
  if campanha.id is not null then
    pontos_calc := floor(pontos_calc * coalesce(campanha.multiplicador,1)) + coalesce(campanha.bonus,0);
  end if;
  update solicitacoes set status='APROVADA' where id = solicitacao_id;
  insert into pontos (estabelecimento_id, cliente_id, solicitacao_id, quantidade) values (s.estabelecimento_id, s.cliente_id, s.id, pontos_calc);
end;
$$;

create or replace function public.negar_solicitacao(solicitacao_id uuid, motivo text default null)
returns void
language sql
security definer
as $$
  update solicitacoes set status='NEGADA', motivo_negacao = motivo where id = solicitacao_id;
$$;

create or replace function public.gerar_resgate(cpf text, premio_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  estabelecimento uuid;
  cliente uuid;
  premio regras_resgate%rowtype;
  saldo_atual int;
  tok text;
  exp timestamp;
begin
  select estabelecimento_id into estabelecimento from perfis where id = auth.uid();
  cliente := get_or_create_cliente(cpf, null, estabelecimento);
  select * into premio from regras_resgate where id = premio_id;
  select coalesce(sum(quantidade),0) into saldo_atual from pontos where cliente_id = cliente;
  if saldo_atual < premio.custo_pontos then
    raise exception 'Saldo insuficiente';
  end if;
  tok := encode(gen_random_bytes(4), 'hex');
  exp := now() + interval '10 minutes';
  insert into resgates (estabelecimento_id, cliente_id, premio, token, expires_at) values (estabelecimento, cliente, premio_id, tok, exp);
  insert into pontos (estabelecimento_id, cliente_id, quantidade, origem) values (estabelecimento, cliente, -premio.custo_pontos, 'RESGATE');
  return json_build_object('token', tok, 'expires_at', exp, 'premio', premio.nome);
end;
$$;

create or replace function public.validar_resgate(token_input text)
returns json
language plpgsql
security definer
as $$
declare
  r resgates%rowtype;
begin
  select * into r from resgates where token = token_input;
  if r.id is null then raise exception 'Token inválido'; end if;
  if r.expires_at < now() then
    update resgates set status='EXPIRADO' where id = r.id;
    raise exception 'Token expirado';
  end if;
  update resgates set status='VALIDADO', validated_at = now() where id = r.id;
  return row_to_json(r);
end;
$$;

create or replace function public.public_saldo(cpf_input text)
returns json
language plpgsql
security definer
as $$
declare
  c clientes%rowtype;
  saldo int;
begin
  select * into c from clientes where cpf = only_digits(cpf_input) limit 1;
  if c.id is null then return json_build_object('saldo_total', 0, 'proximos_premios', array[]::text[]); end if;
  select coalesce(sum(quantidade),0) into saldo from pontos where cliente_id = c.id;
  return json_build_object('saldo_total', saldo, 'proximos_premios', array(select nome from regras_resgate where custo_pontos <= saldo));
end;
$$;

create or replace function public.dashboard_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'pendentes', (select count(*) from solicitacoes where status='PENDENTE'),
    'aprovadas7d', (select count(*) from solicitacoes where status='APROVADA' and created_at >= now() - interval '7 days'),
    'resgates30d', (select count(*) from resgates where status='VALIDADO' and created_at >= now() - interval '30 days'),
    'topServico', (select nome from servicos order by pontos_base desc limit 1)
  );
$$;

-- RLS
alter table public.perfis enable row level security;
alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.servicos enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.pontos enable row level security;
alter table public.regras_resgate enable row level security;
alter table public.resgates enable row level security;
alter table public.campanhas enable row level security;
alter table public.limites_uso enable row level security;

create policy perfis_policy on public.perfis using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy clientes_policy on public.clientes using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid())) with check (true);
create policy veiculos_policy on public.veiculos using (cliente_id in (select id from clientes where estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid())));
create policy servicos_policy on public.servicos using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy solicitacoes_policy on public.solicitacoes using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy pontos_policy on public.pontos using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy regras_policy on public.regras_resgate using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy resgates_policy on public.resgates using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy campanhas_policy on public.campanhas using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));
create policy limites_policy on public.limites_uso using (estabelecimento_id = (select estabelecimento_id from perfis where id = auth.uid()));

-- Seeds
insert into public.estabelecimentos (id, nome, cnpj) values ('11111111-1111-1111-1111-111111111111', 'Posto Exemplo', '00000000000100') on conflict do nothing;
insert into public.servicos (id, estabelecimento_id, nome, pontos_base, pontos_por_real) values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Troca de óleo', 100, 1),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Filtro de óleo', 80, 1)
  on conflict do nothing;
insert into public.regras_resgate (id, estabelecimento_id, nome, descricao, custo_pontos) values
  ('bbbbbbb1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Lavagem grátis', 'Lavagem simples', 500),
  ('bbbbbbb1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Troca de óleo cortesia', 'Troca padrão', 900)
  on conflict do nothing;
insert into public.campanhas (id, estabelecimento_id, nome, multiplicador, bonus, ativa) values
  ('ccccccc1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Campanha de lançamento', 2, 50, true)
  on conflict do nothing;
-- Usuários seed (assumindo usuários existentes no auth.users)
-- Substitua UUIDs conforme criados no Supabase Auth
insert into public.perfis (id, usuario_id, estabelecimento_id, email, nome, role)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'gestor@lubri.com', 'Gestor Demo', 'GESTOR')
  on conflict do nothing;
insert into public.perfis (id, usuario_id, estabelecimento_id, email, nome, role)
values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'atendente@lubri.com', 'Atendente Demo', 'ATENDENTE')
  on conflict do nothing;
