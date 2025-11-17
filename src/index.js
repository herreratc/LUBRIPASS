const {
  InMemoryDatabase,
  fluxoClienteUsaQRCode,
  fluxoTrocaDeOleo,
  fluxoPainelClientesRecorrentes,
} = require('./flows');

const db = new InMemoryDatabase();

db.seed({
  postos: [
    { id: 'posto-01', nome: 'Posto Avenida', cidade: 'Curitiba' },
  ],
  programas: [
    {
      postoId: 'posto-01',
      pontosPorVisita: 10,
      limiteDiarioPorCpf: 2,
      regrasTroca: {
        quilometragemPadrao: 5000,
        diasPadrao: 150,
      },
    },
  ],
  clientes: [
    { cpf: '00011122233', nome: 'Ana Souza', telefone: '41999990000', email: 'ana@email.com' },
    { cpf: '00011122244', nome: 'Bruno Lima', telefone: '41999991111', email: 'bruno@email.com' },
  ],
  veiculos: [
    { clienteCpf: '00011122233', placa: 'ABC1D23', modelo: 'HB20', marca: 'Hyundai' },
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
      data: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-2',
      clienteCpf: '00011122233',
      postoId: 'posto-01',
      quantidade: 10,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-1',
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mov-3',
      clienteCpf: '00011122244',
      postoId: 'posto-01',
      quantidade: 10,
      tipo: 'credito',
      origem: 'visita',
      usuarioId: 'usr-2',
      data: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
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
  ],
});

console.log('--- Fluxo 1: Cliente usa QR Code ---');
const fluxo1 = fluxoClienteUsaQRCode(db, {
  cpf: '00011122255',
  nome: 'Carlos Mendes',
  telefone: '41988887777',
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
  quilometragem: 35000,
  tipoOleo: '5W30',
  observacoes: 'Cliente pediu lembrete via WhatsApp',
});
console.dir(fluxo2, { depth: null });

console.log('\n--- Fluxo 3: Painel de clientes recorrentes ---');
const fluxo3 = fluxoPainelClientesRecorrentes(db, {});
console.dir(fluxo3, { depth: null });
