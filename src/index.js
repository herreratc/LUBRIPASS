const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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

const PORT = process.env.PORT || 3000;
const DEFAULT_POSTO_ID = 'posto-01';
const publicDir = path.join(__dirname, '..', 'public');

const db = new InMemoryDatabase();

function seedDatabase() {
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
}

seedDatabase();

function buildOverview() {
  return {
    postoId: DEFAULT_POSTO_ID,
    generatedAt: new Date().toISOString(),
    dashboard: gerarDashboard(db, { periodoDias: 30 }),
    fidelidade: paginaFidelidade(db, { postoId: DEFAULT_POSTO_ID, periodoDias: 30 }),
    trocas: paginaTrocaDeOleo(db, { postoId: DEFAULT_POSTO_ID, filtro: 'proximas', diasJanela: 90 }),
    recorrentes: paginaClientesRecorrentes(db, { diasFaixas: [30, 60, 90], diasInatividade: 45 }),
    configuracoes: paginaConfiguracoes(db, { postoId: DEFAULT_POSTO_ID }),
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  return map[ext] || 'text/plain; charset=utf-8';
}

function serveStatic(pathname, res) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filePath = path.join(publicDir, relativePath);
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso negado');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Arquivo não encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro interno do servidor');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(data);
  });
}

function handleApiRequest(urlObj, res) {
  if (urlObj.pathname === '/api/overview' && urlObj.searchParams.get('raw') === 'true') {
    // Endpoint de depuração para executar fluxos individuais se necessário
    const payload = {
      fluxoQRCode: fluxoClienteUsaQRCode(db, {
        cpf: '00011122255',
        nome: 'Carlos Mendes',
        telefone: '41977776666',
        email: 'carlos@email.com',
        postoId: DEFAULT_POSTO_ID,
        usuarioId: 'usr-1',
      }),
      fluxoTroca: fluxoTrocaDeOleo(db, {
        cpf: '00011122233',
        nome: 'Ana Souza',
        postoId: DEFAULT_POSTO_ID,
        usuarioId: 'usr-2',
        placa: 'XYZ2E45',
        modelo: 'Onix',
        marca: 'GM',
        quilometragem: 36000,
        tipoOleo: '5W30',
        observacoes: 'Cliente pediu lembrete via WhatsApp',
      }),
      fluxoResgate: fluxoResgateRecompensa(db, {
        clienteCpf: '00011122233',
        postoId: DEFAULT_POSTO_ID,
        recompensaId: 'recomp-2',
        usuarioId: 'usr-3',
      }),
      overview: buildOverview(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (urlObj.pathname === '/api/overview') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(buildOverview()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ message: 'Endpoint não encontrado' }));
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname.startsWith('/api/')) {
    handleApiRequest(urlObj, res);
    return;
  }

  serveStatic(urlObj.pathname, res);
});

server.listen(PORT, () => {
  console.log(`Servidor LUBRIPASS disponível em http://localhost:${PORT}`);
});
