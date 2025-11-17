# Arquitetura Conceitual da Plataforma LUBRIPASS

Este documento resume a visão conceitual da plataforma LUBRIPASS, organizada em módulos de negócio, camadas do front-end, entidades do banco de dados (Supabase) e fluxos principais que conectam todas as partes.

## 1. Módulos de negócio

A oferta é composta por quatro blocos principais:

1. **Fidelidade** – Tudo o que envolve pontuação (regras, catálogo de prêmios, histórico de uso e ranking de clientes).
2. **Troca de Óleo** – Registro e acompanhamento das trocas (cliente, veículo, km, tipo de óleo, próxima troca sugerida).
3. **Painel de Clientes Recorrentes** – Indicadores de visitas, ticket médio, alertas sobre inatividade e recorrência.
4. **Administração / Usuários / Configurações** – Base comum para autenticação, permissões, cadastro de postos e ajustes de regras.

Essa separação facilita a comercialização como uma “plataforma completa” na qual cada módulo agrega valor claro para o dono do posto.

## 2. Estrutura do Front-end (Vite + React)

### 2.1 Camadas
- **Layout**: cabeçalho com o nome do posto, menu lateral (Dashboard, Fidelidade, Troca de Óleo, Clientes) e área central de conteúdo.
- **Rotas/Páginas**: Login, Dashboard, Fidelidade, Troca de Óleo, Clientes & Recorrência, Configurações.
- **Componentes reutilizáveis**: cards-resumo, tabelas com filtros, gráficos de recorrência/ranking, modais de detalhes, componentes de formulário (inputs, selects, datas).
- **Serviços de dados**: fidelidade (pontos e resgates), trocas de óleo, clientes, métricas/relatórios.
- **Estado e hooks**: autenticação de usuários do posto, filtros globais (período, posto, tipo de cliente), carregamento e erros.

### 2.2 Páginas e conteúdo
- **Login**: autentica dono/gerente.
- **Dashboard**: mostra total de clientes cadastrados, clientes ativos no mês, pontos concedidos vs. resgatados, número de trocas realizadas e ranking dos 5 clientes mais recorrentes.
- **Fidelidade**: lista clientes (CPF, nome, pontos, visitas no mês, última visita), ajustes de pontos, histórico e configurações (QR Code fixo, regras de pontos por visita, prêmios e limitações).
- **Troca de Óleo**: lista registros (CPF, placa, km, data, tipo de óleo, próxima troca), filtros “Próximas trocas”, “Atrasados” e ordenação por data.
- **Clientes Recorrentes**: visitas nos últimos 30/60/90 dias, ticket médio, pontos, última visita, gráficos de recorrência e alertas (“VIPs que sumiram”, “Clientes que vieram 1 vez”).
- **Configurações**: regras de pontos (pontos por visita, limites), prêmios (nome, custo em pontos, status), regras de trocas (km padrão, mensagens) e usuários do posto.

## 3. Estrutura do Banco (Supabase)

### 3.1 Entidades principais
Postos, Usuários do posto, Clientes, Veículos (opcional), Programa de fidelidade, Pontos, Recompensas, Resgates, Trocas de óleo, Campanhas/Promoções e Logs/Eventos (auditoria).

### 3.2 Campos principais
- **Postos**: id, nome fantasia, razão social, CNPJ, endereço, status.
- **Usuários**: id, posto vinculado, nome, e-mail, função (dono/gerente/atendente), nível de acesso.
- **Clientes**: id, CPF, nome, telefone/WhatsApp, e-mail, data de cadastro, observações.
- **Veículos**: id, cliente, placa, modelo/marca, ano, tipo de combustível.
- **Programa de fidelidade**: id, posto, nome, pontos por visita, limite diário por CPF, regras extras.
- **Pontos (movimentações)**: id, cliente, posto, tipo (crédito/débito), quantidade, origem (visita/campanha/ajuste), data/hora, usuário que confirmou.
- **Recompensas**: id, posto, nome, descrição, pontos necessários, status.
- **Resgates**: id, cliente, posto, recompensa, pontos gastos, data/hora, status, usuário que aprovou.
- **Trocas de óleo**: id, cliente, veículo, posto, data, km, tipo/marca do óleo, próxima troca sugerida, observações.
- **Campanhas**: id, posto, nome, período, regra (multiplicador/bônus), status.
- **Logs/Eventos**: id, posto, tipo (login, geração de pontos, resgate, alteração de configuração, erro), usuário envolvido, payload adicional, data/hora.

### 3.3 Consultas/visões úteis
- Clientes mais recorrentes por período.
- Clientes que não voltam há X dias.
- Próximas trocas previstas e trocas atrasadas.
- Pontos concedidos vs. resgatados no mês.
- Uso de campanhas e impacto nos pontos.

Essas consultas alimentam o dashboard, o painel de recorrência, alertas de clientes VIP inativos e a agenda de trocas para o mês.

## 4. Fluxos principais
1. **Cliente usa o QR Code**: app captura CPF/posto → cria/encontra cliente → grava crédito respeitando limite diário → atualiza saldo e ranking.
2. **Troca de Óleo**: atendente busca CPF/placa → seleciona ou cria veículo → registra km/data/óleo/observações → calcula próxima troca → alimenta lembretes e painéis.
3. **Painel de Clientes Recorrentes**: front consulta visitas, últimas trocas e pontos → monta ranking por frequência, identifica VIPs e mostra filtros (30/60/90 dias) para ações de retenção.

Esses fluxos conectam as camadas de dados, serviços e UI descritas acima, formando uma narrativa única para vender a solução como plataforma.
