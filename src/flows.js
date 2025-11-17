const { InMemoryDatabase } = require('./database');
const { isSameDay, differenceInDays, formatDate } = require('./date-utils');

function fluxoClienteUsaQRCode(db, {
  cpf,
  nome,
  telefone,
  email,
  postoId,
  usuarioId,
}) {
  if (!db.postos.has(postoId)) {
    throw new Error(`Posto ${postoId} não encontrado`);
  }
  const programa = db.programas.get(postoId);
  if (!programa) {
    throw new Error(`Programa de fidelidade não configurado para o posto ${postoId}`);
  }

  const cliente = db.getOrCreateCliente({ cpf, nome, telefone, email });
  const visitasHoje = db
    .getMovimentacoesCliente(cpf, (mov) => mov.origem === 'visita' && isSameDay(mov.data, new Date()))
    .length;
  if (visitasHoje >= programa.limiteDiarioPorCpf) {
    return {
      cliente,
      saldo: db.getSaldoCliente(cpf),
      movimento: null,
      mensagem: 'Limite diário de pontos atingido.',
    };
  }

  const movimento = db.registrarMovimentacaoPontos({
    clienteCpf: cpf,
    postoId,
    quantidade: programa.pontosPorVisita,
    tipo: 'credito',
    origem: 'visita',
    usuarioId,
  });

  const saldo = db.getSaldoCliente(cpf);
  const ranking = db.getRankingClientes({ limite: 5 });

  return {
    cliente,
    saldo,
    movimento,
    ranking,
    mensagem: 'Visita registrada com sucesso.',
  };
}

function fluxoTrocaDeOleo(db, {
  cpf,
  nome,
  telefone,
  email,
  postoId,
  usuarioId,
  placa,
  modelo,
  marca,
  quilometragem,
  tipoOleo,
  observacoes,
  data,
}) {
  const cliente = db.getOrCreateCliente({ cpf, nome, telefone, email });
  const veiculo = db.registrarVeiculo({ clienteCpf: cpf, placa, modelo, marca });
  const troca = db.registrarTrocaOleo({
    clienteCpf: cpf,
    veiculoPlaca: placa,
    postoId,
    quilometragem,
    tipoOleo,
    observacoes,
    usuarioId,
    data,
  });

  const proxima = db.calcularProximaTroca(troca);
  return {
    cliente,
    veiculo,
    troca,
    proximaTroca: proxima,
  };
}

function fluxoPainelClientesRecorrentes(db, { diasFaixas = [30, 60, 90], diasInatividade = 45 } = {}) {
  const visitasPorPeriodo = diasFaixas.map((dias) => ({ dias, visitas: db.getVisitasPorPeriodo({ dias }) }));
  const clientesPainel = Array.from(db.clientes.values()).map((cliente) => {
    const visitasDetalhes = visitasPorPeriodo.map(({ dias, visitas }) => ({
      dias,
      quantidade: visitas.get(cliente.cpf)?.length || 0,
    }));
    const pontos = db.getSaldoCliente(cliente.cpf);
    const trocas = db.getTrocasPorCliente(cliente.cpf);
    const ultimaTroca = trocas.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
    const ultimaVisitaMov = db
      .getMovimentacoesCliente(cliente.cpf, (mov) => mov.origem === 'visita')
      .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
    const ultimaVisitaData = ultimaVisitaMov?.data || null;
    return {
      cpf: cliente.cpf,
      nome: cliente.nome,
      pontos,
      visitas: visitasDetalhes,
      ultimaVisita: ultimaVisitaData,
      diasDesdeUltimaVisita: ultimaVisitaData ? differenceInDays(new Date(), ultimaVisitaData) : null,
      ultimaTroca: ultimaTroca ? {
        data: ultimaTroca.data,
        dataFormatada: formatDate(ultimaTroca.data),
        veiculoPlaca: ultimaTroca.veiculoPlaca,
        proximaTroca: db.calcularProximaTroca(ultimaTroca),
      } : null,
    };
  });

  const inativos = db.getClientesInativos({ dias: diasInatividade });
  const rankingRecorrencia = clientesPainel
    .map((cliente) => ({
      ...cliente,
      totalUltimos90: cliente.visitas.find((v) => v.dias === 90)?.quantidade || 0,
    }))
    .sort((a, b) => b.totalUltimos90 - a.totalUltimos90)
    .slice(0, 5);

  return {
    clientesPainel,
    rankingRecorrencia,
    alertas: {
      clientesInativos: inativos.map((cliente) => ({
        cpf: cliente.cpf,
        nome: cliente.nome,
      })),
      trocasProximas: db.getProgramacaoTrocas({ diasLimite: 30 }).map((troca) => ({
        clienteCpf: troca.clienteCpf,
        veiculoPlaca: troca.veiculoPlaca,
        dataTroca: troca.data,
        dataTrocaFormatada: formatDate(troca.data),
        proximaTroca: troca.proximaTroca,
      })),
    },
  };
}

module.exports = {
  InMemoryDatabase,
  fluxoClienteUsaQRCode,
  fluxoTrocaDeOleo,
  fluxoPainelClientesRecorrentes,
};
