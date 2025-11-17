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

function gerarDashboard(db, { periodoDias = 30 } = {}) {
  const totalClientes = db.clientes.size;
  const clientesAtivos = db.getClientesAtivos({ dias: periodoDias });
  const pontosResumo = db.getResumoPontos({ dias: periodoDias });
  const trocasPeriodo = db.getTrocasNoPeriodo({ dias: periodoDias });
  const ranking = db.getRankingClientes({ limite: 5 });

  return {
    periodoDias,
    totalClientes,
    clientesAtivos,
    pontosConcedidos: pontosResumo.creditos,
    pontosResgatados: pontosResumo.debitos,
    trocasRealizadas: trocasPeriodo.length,
    rankingTop5: ranking,
  };
}

function paginaFidelidade(db, { postoId, periodoDias = 30 } = {}) {
  const programa = db.programas.get(postoId);
  if (!programa) {
    throw new Error('Programa de fidelidade não encontrado.');
  }
  const limite = new Date();
  limite.setDate(limite.getDate() - periodoDias);

  const clientes = Array.from(db.clientes.values()).map((cliente) => {
    const visitasPeriodo = db
      .getMovimentacoesCliente(cliente.cpf, (mov) => mov.origem === 'visita' && new Date(mov.data) >= limite)
      .length;
    const ultimaVisitaMov = db
      .getMovimentacoesCliente(cliente.cpf, (mov) => mov.origem === 'visita')
      .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
    return {
      cpf: cliente.cpf,
      nome: cliente.nome,
      telefone: cliente.telefone,
      pontos: db.getSaldoCliente(cliente.cpf),
      visitasPeriodo,
      ultimaVisita: ultimaVisitaMov?.data || null,
    };
  });

  const recompensas = db.recompensas.filter((rec) => rec.postoId === postoId);
  const historicoResgates = db.resgates
    .filter((resg) => resg.postoId === postoId)
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 10)
    .map((resg) => ({
      ...resg,
      clienteNome: db.clientes.get(resg.clienteCpf)?.nome,
      recompensa: recompensas.find((rec) => rec.id === resg.recompensaId),
    }));

  return {
    periodoDias,
    programa,
    clientes,
    recompensas,
    historicoResgates,
  };
}

function paginaTrocaDeOleo(db, { postoId, filtro = 'todas', diasJanela = 30 } = {}) {
  const trocas = db
    .getTrocasComStatus({ diasJanela })
    .filter((troca) => troca.postoId === postoId)
    .filter((troca) => {
      if (filtro === 'proximas') return troca.status === 'proxima';
      if (filtro === 'atrasadas') return troca.status === 'atrasada';
      return true;
    })
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .map((troca) => ({
      ...troca,
      clienteNome: db.clientes.get(troca.clienteCpf)?.nome,
      veiculo: db.veiculos.get(troca.veiculoPlaca),
    }));

  const totais = db
    .getTrocasComStatus({ diasJanela })
    .filter((troca) => troca.postoId === postoId)
    .reduce(
      (acc, troca) => {
        acc[troca.status] = (acc[troca.status] || 0) + 1;
        return acc;
      },
      { proxima: 0, atrasada: 0, regular: 0 }
    );

  return {
    filtro,
    diasJanela,
    totais,
    trocas,
  };
}

function paginaClientesRecorrentes(db, options) {
  return fluxoPainelClientesRecorrentes(db, options);
}

function paginaConfiguracoes(db, { postoId }) {
  const programa = db.programas.get(postoId);
  if (!programa) {
    throw new Error('Programa não encontrado.');
  }
  const usuarios = db.getUsuariosPorPosto(postoId);
  const recompensas = db.recompensas.filter((rec) => rec.postoId === postoId);
  const campanhas = db.campanhas.filter((camp) => camp.postoId === postoId);

  return {
    programa,
    regrasPontos: {
      pontosPorVisita: programa.pontosPorVisita,
      limiteDiarioPorCpf: programa.limiteDiarioPorCpf,
      extras: programa.regrasExtras || null,
    },
    regrasTroca: programa.regrasTroca,
    recompensas,
    campanhas,
    usuarios,
  };
}

function fluxoResgateRecompensa(db, { clienteCpf, postoId, recompensaId, usuarioId }) {
  const cliente = db.clientes.get(clienteCpf);
  if (!cliente) {
    throw new Error('Cliente não encontrado para resgate.');
  }
  const resgate = db.registrarResgate({ clienteCpf, postoId, recompensaId, usuarioId });
  const saldo = db.getSaldoCliente(clienteCpf);
  return {
    cliente,
    resgate,
    saldo,
    mensagem: 'Resgate concluído com sucesso.',
  };
}

module.exports = {
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
};
