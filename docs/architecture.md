# Plataforma LUBRIPASS – Visão Conceitual

## 1. Módulos de Negócio

1. **Fidelidade** – controle de pontos, regras e resgates.
2. **Troca de Óleo** – registro de serviços, previsões e alertas.
3. **Painel de Clientes Recorrentes** – análise de frequência e ticket médio.
4. **Administração / Usuários / Configurações** – gestão de postos, acessos e parâmetros.

## 2. Front-end (Vite + React)

### 2.1 Camadas
- **Layout**: cabeçalho do posto, menu lateral (Dashboard, Fidelidade, Troca de Óleo, Clientes), conteúdo central.
- **Rotas / Páginas**: Login, Dashboard, Fidelidade, Troca de Óleo, Clientes & Recorrência, Configurações.
- **Componentes Reutilizáveis**: cards de resumo, tabelas com filtros/paginação, gráficos, modais e formulários.
- **Serviços de Dados**: fidelidade (pontos), trocas de óleo, clientes, métricas/relatórios.
- **Estado & Hooks**: autenticação, filtros (período/posto/tipo), carregamento e erros.

### 2.2 Páginas
- **Dashboard**: KPIs gerais, pontos concedidos vs. resgatados, ranking dos top 5 clientes.
- **Fidelidade**: lista de clientes, pontos atuais, visitas, última visita, ações (ajustar/ver histórico) e configuração de regras/QR.
- **Troca de Óleo**: listagem com CPF, placa, km, datas, tipo de óleo, próxima troca; filtros (próximas, atrasadas, por data).
- **Clientes Recorrentes**: visitas em 30/60/90 dias, ticket médio, gráficos de recorrência e alertas.
- **Configurações**: regras de pontos, prêmios, parâmetros de troca de óleo, usuários.

## 3. Back-end / Banco (Supabase)

### 3.1 Tabelas
1. Postos
2. Usuários do posto
3. Clientes
4. Veículos (opcional)
5. Programas de fidelidade
6. Pontos (movimentações)
7. Recompensas
8. Resgates
9. Trocas de óleo
10. Campanhas
11. Logs/Eventos (opcional)

### 3.2 Descrição por tabela
- **Postos**: identificação (ID, nome, CNPJ, endereço, status).
- **Usuários do Posto**: relação com posto, nome, e-mail, função, nível de acesso.
- **Clientes**: CPF, nome, contatos, data de cadastro, observações.
- **Veículos**: placa, modelo, ano, combustível, vínculo com cliente.
- **Programa de Fidelidade**: pontos por visita, limites, regras.
- **Pontos**: créditos/débitos, quantidade, origem, data, usuário responsável.
- **Recompensas**: catálogo de prêmios, custo em pontos, ativo/inativo.
- **Resgates**: histórico, status, aprovador.
- **Trocas de Óleo**: cliente, veículo, posto, km, óleo, próxima troca, observações.
- **Campanhas**: nome, período, regra, status.
- **Logs/Eventos**: auditoria de logins, geração de pontos, resgates, alterações.

### 3.3 Visões/Consultas
- Clientes mais recorrentes.
- Clientes ausentes por X dias.
- Próximas trocas previstas e atrasadas.
- Pontos concedidos vs. resgatados.
- Uso de campanhas e impacto.

## 4. Fluxos Principais

### 4.1 Cliente usa o QR Code
1. Escaneia QR.
2. Front registra CPF/posto, cria/acha cliente.
3. Grava movimentação de pontos com limite diário.
4. Atualiza saldo, alimenta fidelidade/recorrência/ranking.

### 4.2 Troca de Óleo
1. Atendente busca CPF ou placa.
2. Seleciona/cadastra veículo.
3. Registra km, data, óleo, observações.
4. Calcula próxima troca, grava registro, alimenta lembretes/painel.

### 4.3 Painel de Clientes Recorrentes
1. Consulta visitas, últimas visitas e trocas.
2. Exibe ranking, VIPs, filtros por período.
3. Orienta decisões de campanhas/ações.

---

Próximos passos sugeridos:
- Diagramar o banco (ER).
- Criar resumo executivo para apresentação comercial.
