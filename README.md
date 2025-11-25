# LUBRIPASS – Sistema de Fidelidade para Troca de Óleo

Projeto completo em React + Vite + TypeScript com backend Supabase (Auth, Postgres, RLS, RPCs e seeds) para gerir o programa de fidelidade de troca de óleo.

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS + componentes inspirados no shadcn/ui
- React Router, Zustand, TanStack Query
- react-hook-form + zod
- supabase-js v2

## Estrutura
```
src/
  app/ (router)
  components/ (ui e layout)
  guards/ (proteção de rotas e papéis)
  hooks/
  lib/ (cliente Supabase)
  pages/
    Public/ (registro, minha conta, resgate)
    Auth/ (login)
    Portal/ (dashboard, solicitações, resgates, clientes, campanhas, config)
  services/ (chamadas RPC e dados)
  store/ (Zustand)
  styles/
  types/
supabase/schema.sql (tabelas, policies, views, RPCs e seeds)
```

## Supabase
1. Crie o projeto no Supabase e copie as chaves para `.env.local`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
2. Execute `supabase db push` ou rode o conteúdo de `supabase/schema.sql` diretamente no SQL editor para criar tabelas, RLS, views, seeds e RPCs:
   - `criar_solicitacao`, `aprovar_solicitacao`, `negar_solicitacao`
   - `gerar_resgate`, `validar_resgate`, `public_saldo`
   - helpers `only_digits`, `get_or_create_cliente`
   - view `v_saldo_cliente`
3. Crie dois usuários no Auth (emails e senhas) e associe os `uuid` na seção de seeds para perfis de Gestor e Atendente.

## Scripts
```
npm install
npm run dev
npm run build
npm run preview
```

## Fluxos implementados
- **Público**: registro de uso (1 uso/dia por CPF via RLS + limite), consulta de saldo e geração de token de resgate com contagem regressiva.
- **Portal autenticado**: dashboard com indicadores, aprovação/negação de solicitações com refetch a cada 5s, validação de resgate, busca de clientes, CRUD simplificado de campanhas e tela de configuração do usuário/estabelecimento.
- **Estado**: Zustand guarda token, role e estabelecimento; guards protegem rotas e papéis.

## Estilo e UX
- Tema escuro, layout responsivo com Sidebar + TopBar.
- Componentes de cartão, tabela, modal, badges e formulários com validação zod.
- Toasts podem ser adicionados facilmente usando o provider de sua escolha; os formulários já retornam mensagens e contagens regressivas.

## Observações
- Os IDs seedados podem ser ajustados conforme sua instância; as policies usam `auth.uid()` para restringir dados ao estabelecimento do perfil.
- Funções RPC usam `security definer` para permitir regras públicas de registro/consulta mantendo RLS.
