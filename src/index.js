const {
  InMemoryDatabase,
  fluxoClienteUsaQRCode,
  fluxoTrocaDeOleo,
  fluxoPainelClientesRecorrentes,
  gerarDashboard,
  paginaFidelidade,
  paginaTrocaDeOleo,
  paginaClientesRecorrentes,
  paginaConfiguracoes,
  fluxoResgateRecompensa,
} = require('./flows');

const db = new InMemoryDatabase();

db.seed({
  postos: [
    { id: 'posto-01', nome: 'Posto Avenida', cidade: 'Curitiba' },
  ],
  programas: [
    {
      postoId: 'posto-01',
      nome: 'Clube Avenida',
      pontosPorVisita: 10,
      limiteDiarioPorCpf: 2,
      regrasTroca: {
        quilometragemPadrao: 5000,
        diasPadrao: 150,
      },
      regrasExtras: 'Bônus de 2 pontos por abastecimento acima de R$200.',
    },
  ],
  clientes: [
    { cpf: '00011122233', nome: 'Ana Souza', telefone: '41999990000', email: 'ana@email.com' },
    { cpf: '00011122244', nome: 'Bruno Lima', telefone: '41999991111', email: 'bruno@email.com' },
    { cpf: '99988877766', nome: 'Carla Mendes', telefone: '41988887777', email: 'carla@email.com' },
  ],
  usuarios: [
    { id: 'usr-1', postoId: 'posto-01', nome: 'Dono do Posto', email: 'dono@posto.com', funcao: 'dono' },
    { id: 'usr-2', postoId: 'posto-01', nome: 'Gerente', email: 'gerente@posto.com', funcao: 'gerente' },
    { id: 'usr-3', postoId: 'posto-01', nome: 'Atendente', email: 'atendente@posto.com', funcao: 'atendente' },
  ],
  veiculos: [
    { clienteCpf: '00011122233', placa: 'ABC1D23', modelo: 'HB20', marca: 'Hyundai' },
    { clienteCpf: '00011122233', placa: 'XYZ2E45', modelo: 'Onix', marca: 'GM' },
    { clienteCpf: '99988877766', placa: 'JKL9M87', modelo: 'Corolla', marca: 'Toyota' },
  ],
  pontos: [
    {
      id: 'mov-1',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      quantidade: 10,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-1',
      data: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-2',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      quantidade: 20,
      tipo: 'credito',
      origem: 'campanha',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-3',
      clienteCpf: '00011122244',
      postoId: 'posto-01',
      quantidade: 10,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-4',
      clienteCpf: '99988877766',
      postoId: 'posto-01',
      quantidade: 10,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-3',
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-5',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      quantidade: 30,
      tipo: 'debito',
      origem: 'resgate',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-6',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      quantidade: 50,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-3',
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  trocas: [
    {
      id: 'troca-1',
      clienteCpf: '00011122233',
      veiculoPlaca: 'ABC1D23',
      postoId: 'posto-01',
      quilometragem: 30000,
      tipoOleo: '5W30',
      observacoes: 'Filtro trocado',
      usuarioId: 'usr-1',
      data: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'troca-2',
      clienteCpf: '99988877766',
      veiculoPlaca: 'JKL9M87',
      postoId: 'posto-01',
      quilometragem: 45000,
      tipoOleo: '5W30',
      observacoes: 'Sem observações',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  recompensas: [
    {
      id: 'recomp-1',
      postoId: 'posto-01',
      nome: 'Troca de óleo com desconto',
      descricao: '20% de desconto na próxima troca.',
      pontosNecessarios: 30,
      status: 'ativo',
    },
    {
      id: 'recomp-2',
      postoId: 'posto-01',
      nome: 'Lavagem premium',
      descricao: 'Lavagem completa com enceramento.',
      pontosNecessarios: 40,
      status: 'ativo',
    },
  ],
  resgates: [
    {
      id: 'resg-1',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      recompensaId: 'recomp-1',
      pontosGastos: 30,
      status: 'concluido',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  campanhas: [
    {
      id: 'camp-1',
      postoId: 'posto-01',
      nome: 'Outubro em Dobro',
      periodo: {
        inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        fim: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      regra: '2x pontos nas visitas de sábado',
      status: 'ativo',
    },
  ],
});

console.log('--- Fluxo 1: Cliente usa QR Code ---');
const fluxo1 = fluxoClienteUsaQRCode(db, {
  cpf: '00011122255',
  nome: 'Carlos Mendes',
  telefone: '41977776666',
  email: 'carlos@email.com',
  postoId: 'posto-01',
  usuarioId: 'usr-1',
});
console.dir(fluxo1, { depth: null });

console.log('\n--- Fluxo 2: Registro de troca de óleo ---');
const fluxo2 = fluxoTrocaDeOleo(db, {
  cpf: '00011122233',
  nome: 'Ana Souza',
  postoId: 'posto-01',
  usuarioId: 'usr-2',
  placa: 'XYZ2E45',
  modelo: 'Onix',
  marca: 'GM',
  quilometragem: 36000,
  tipoOleo: '5W30',
  observacoes: 'Cliente pediu lembrete via WhatsApp',
});
console.dir(fluxo2, { depth: null });

console.log('\n--- Fluxo 3: Painel de clientes recorrentes ---');
const fluxo3 = fluxoPainelClientesRecorrentes(db, {});
console.dir(fluxo3, { depth: null });

console.log('\n--- Fluxo 4: Resgate de recompensa ---');
const recompensaLavagem = db.recompensas.find((rec) => rec.id === 'recomp-2');
const fluxo4 = fluxoResgateRecompensa(db, {
  clienteCpf: '00011122233',
  postoId: 'posto-01',
  recompensaId: recompensaLavagem.id,
  usuarioId: 'usr-3',
});
console.dir(fluxo4, { depth: null });

console.log('\n--- Dashboard (simulação da página inicial) ---');
const dashboard = gerarDashboard(db, { periodoDias: 30 });
console.dir(dashboard, { depth: null });

console.log('\n--- Página de Fidelidade ---');
const fidelidade = paginaFidelidade(db, { postoId: 'posto-01', periodoDias: 30 });
console.dir(fidelidade, { depth: null });

console.log('\n--- Página de Troca de Óleo (Próximas) ---');
const trocas = paginaTrocaDeOleo(db, { postoId: 'posto-01', filtro: 'proximas' });
console.dir(trocas, { depth: null });

console.log('\n--- Página de Clientes Recorrentes ---');
const recorrentes = paginaClientesRecorrentes(db, { diasFaixas: [30, 60, 90] });
console.dir(recorrentes, { depth: null });

console.log('\n--- Página de Configurações ---');
const configuracoes = paginaConfiguracoes(db, { postoId: 'posto-01' });
console.dir(configuracoes, { depth: null });
