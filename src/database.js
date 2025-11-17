const generateId = (() => {
  let counter = 0;
  return (prefix) => `${prefix}-${++counter}`;
})();

class InMemoryDatabase {
  constructor() {
    this.postos = new Map();
    this.programas = new Map();
    this.clientes = new Map(); // cpf => cliente
    this.veiculos = new Map(); // placa => veiculo
    this.pontos = []; // movimentações
    this.trocas = [];
    this.usuarios = new Map(); // id => usuario
    this.recompensas = [];
    this.resgates = [];
    this.campanhas = [];
    this.logs = [];
  }

  seed({
    postos = [],
    programas = [],
    clientes = [],
    veiculos = [],
    pontos = [],
    trocas = [],
    usuarios = [],
    recompensas = [],
    resgates = [],
    campanhas = [],
    logs = [],
  }) {
    postos.forEach((posto) => this.postos.set(posto.id, posto));
    programas.forEach((programa) => this.programas.set(programa.postoId, programa));
    clientes.forEach((cliente) => this.clientes.set(cliente.cpf, { ...cliente }));
    veiculos.forEach((veiculo) => this.veiculos.set(veiculo.placa, { ...veiculo }));
    this.pontos.push(...pontos);
    this.trocas.push(...trocas);
    usuarios.forEach((usuario) => this.usuarios.set(usuario.id, { ...usuario }));
    this.recompensas.push(...recompensas);
    this.resgates.push(...resgates);
    this.campanhas.push(...campanhas);
    this.logs.push(...logs);
  }

  getOrCreateCliente({ cpf, nome, telefone, email }) {
    const existente = this.clientes.get(cpf);
    if (existente) {
      if (nome && !existente.nome) existente.nome = nome;
      if (telefone && !existente.telefone) existente.telefone = telefone;
      if (email && !existente.email) existente.email = email;
      return existente;
    }
    const novo = {
      cpf,
      nome,
      telefone,
      email,
      dataCadastro: new Date().toISOString(),
    };
    this.clientes.set(cpf, novo);
    return novo;
  }

  registrarMovimentacaoPontos({ clienteCpf, postoId, quantidade, tipo, origem, usuarioId, data }) {
    const movimento = {
      id: generateId('mov'),
      clienteCpf,
      postoId,
      quantidade,
      tipo,
      origem,
      usuarioId,
      data: data || new Date().toISOString(),
    };
    this.pontos.push(movimento);
    this.registrarLog({
      postoId,
      tipo: origem === 'visita' ? 'geracao-pontos' : 'ajuste-pontos',
      usuarioId,
      payload: { clienteCpf, quantidade, origem, movimentoId: movimento.id },
    });
    return movimento;
  }

  getSaldoCliente(clienteCpf) {
    return this.pontos
      .filter((mov) => mov.clienteCpf === clienteCpf)
      .reduce((saldo, mov) => saldo + (mov.tipo === 'credito' ? mov.quantidade : -mov.quantidade), 0);
  }

  getMovimentacoesCliente(clienteCpf, predicate = () => true) {
    return this.pontos.filter((mov) => mov.clienteCpf === clienteCpf && predicate(mov));
  }

  registrarVeiculo({ clienteCpf, placa, modelo, marca, ano, combustivel }) {
    const existente = this.veiculos.get(placa);
    if (existente) {
      return existente;
    }
    const veiculo = {
      id: generateId('veic'),
      clienteCpf,
      placa,
      modelo,
      marca,
      ano,
      combustivel,
    };
    this.veiculos.set(placa, veiculo);
    return veiculo;
  }

  registrarTrocaOleo({ clienteCpf, veiculoPlaca, postoId, quilometragem, tipoOleo, observacoes, usuarioId, data }) {
    const troca = {
      id: generateId('troca'),
      clienteCpf,
      veiculoPlaca,
      postoId,
      quilometragem,
      tipoOleo,
      observacoes,
      usuarioId,
      data: data || new Date().toISOString(),
    };
    this.trocas.push(troca);
    this.registrarLog({
      postoId,
      tipo: 'troca-oleo',
      usuarioId,
      payload: { clienteCpf, veiculoPlaca, trocaId: troca.id },
    });
    return troca;
  }

  registrarRecompensa({ postoId, nome, descricao, pontosNecessarios, status = 'ativo' }) {
    const recompensa = {
      id: generateId('recomp'),
      postoId,
      nome,
      descricao,
      pontosNecessarios,
      status,
    };
    this.recompensas.push(recompensa);
    return recompensa;
  }

  registrarResgate({ clienteCpf, postoId, recompensaId, usuarioId, data }) {
    const recompensa = this.recompensas.find((rec) => rec.id === recompensaId && rec.postoId === postoId);
    if (!recompensa) {
      throw new Error('Recompensa não encontrada para o posto informado.');
    }
    const saldo = this.getSaldoCliente(clienteCpf);
    if (saldo < recompensa.pontosNecessarios) {
      throw new Error('Cliente não possui pontos suficientes para o resgate.');
    }
    const movimento = this.registrarMovimentacaoPontos({
      clienteCpf,
      postoId,
      quantidade: recompensa.pontosNecessarios,
      tipo: 'debito',
      origem: 'resgate',
      usuarioId,
      data,
    });
    const resgate = {
      id: generateId('resg'),
      clienteCpf,
      postoId,
      recompensaId,
      pontosGastos: recompensa.pontosNecessarios,
      status: 'concluido',
      usuarioId,
      data: movimento.data,
    };
    this.resgates.push(resgate);
    this.registrarLog({
      postoId,
      tipo: 'resgate',
      usuarioId,
      payload: { clienteCpf, recompensaId, resgateId: resgate.id },
    });
    return resgate;
  }

  registrarLog({ postoId, tipo, usuarioId, payload }) {
    const log = {
      id: generateId('log'),
      postoId,
      tipo,
      usuarioId,
      payload,
      data: new Date().toISOString(),
    };
    this.logs.push(log);
    return log;
  }

  getTrocasPorCliente(clienteCpf) {
    return this.trocas.filter((troca) => troca.clienteCpf === clienteCpf);
  }

  getTrocasPorVeiculo(placa) {
    return this.trocas.filter((troca) => troca.veiculoPlaca === placa);
  }

  getRankingClientes({ limite = 5 } = {}) {
    const pontosPorCliente = new Map();
    this.pontos.forEach((mov) => {
      if (mov.tipo === 'credito') {
        const acumulado = pontosPorCliente.get(mov.clienteCpf) || 0;
        pontosPorCliente.set(mov.clienteCpf, acumulado + mov.quantidade);
      }
    });
    const ranking = Array.from(pontosPorCliente.entries())
      .map(([cpf, pontos]) => ({
        cpf,
        nome: this.clientes.get(cpf)?.nome || 'Cliente sem nome',
        pontos,
      }))
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, limite);
    return ranking;
  }

  getVisitasPorPeriodo({ dias }) {
    const agora = new Date();
    const limite = new Date(agora);
    limite.setDate(limite.getDate() - dias);
    const visitas = new Map();
    this.pontos.forEach((mov) => {
      if (mov.origem !== 'visita') return;
      const dataMov = new Date(mov.data);
      if (dataMov >= limite) {
        const lista = visitas.get(mov.clienteCpf) || [];
        lista.push(dataMov);
        visitas.set(mov.clienteCpf, lista);
      }
    });
    return visitas;
  }

  getClientesInativos({ dias }) {
    const agora = new Date();
    const limite = new Date(agora);
    limite.setDate(limite.getDate() - dias);
    return Array.from(this.clientes.values()).filter((cliente) => {
      const visitas = this.getMovimentacoesCliente(cliente.cpf, (mov) => mov.origem === 'visita');
      if (!visitas.length) return true;
      const ultimaVisita = visitas.reduce((maisRecente, mov) => {
        const dataMov = new Date(mov.data);
        return dataMov > maisRecente ? dataMov : maisRecente;
      }, new Date(0));
      return ultimaVisita < limite;
    });
  }

  getProgramacaoTrocas({ diasLimite }) {
    const agora = new Date();
    const limite = new Date(agora);
    limite.setDate(limite.getDate() + diasLimite);
    return this.trocas
      .map((troca) => {
        const proxTroca = this.calcularProximaTroca(troca);
        return {
          ...troca,
          proximaTroca: proxTroca,
        };
      })
      .filter((troca) => new Date(troca.proximaTroca.dataSugerida) <= limite);
  }

  calcularProximaTroca(troca) {
    const programa = this.programas.get(troca.postoId);
    const kmIntervalo = programa?.regrasTroca?.quilometragemPadrao || 5000;
    const diasIntervalo = programa?.regrasTroca?.diasPadrao || 180;
    const proximaKm = troca.quilometragem + kmIntervalo;
    const dataSugerida = new Date(troca.data);
    dataSugerida.setDate(dataSugerida.getDate() + diasIntervalo);
    return {
      proximaKm,
      dataSugerida: dataSugerida.toISOString(),
    };
  }

  getClientesAtivos({ dias }) {
    const visitas = this.getVisitasPorPeriodo({ dias });
    return visitas.size;
  }

  getResumoPontos({ dias }) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const dentroPeriodo = this.pontos.filter((mov) => new Date(mov.data) >= limite);
    return dentroPeriodo.reduce(
      (acc, mov) => {
        if (mov.tipo === 'credito') {
          acc.creditos += mov.quantidade;
        } else {
          acc.debitos += mov.quantidade;
        }
        return acc;
      },
      { creditos: 0, debitos: 0 }
    );
  }

  getTrocasNoPeriodo({ dias }) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    return this.trocas.filter((troca) => new Date(troca.data) >= limite);
  }

  getTrocasComStatus({ diasJanela = 30 }) {
    const agora = new Date();
    const limiteProximas = new Date(agora);
    limiteProximas.setDate(limiteProximas.getDate() + diasJanela);
    return this.trocas.map((troca) => {
      const proxima = this.calcularProximaTroca(troca);
      const dataProxima = new Date(proxima.dataSugerida);
      let status = 'regular';
      if (dataProxima < agora) {
        status = 'atrasada';
      } else if (dataProxima <= limiteProximas) {
        status = 'proxima';
      }
      return {
        ...troca,
        proximaTroca: proxima,
        status,
      };
    });
  }

  getUsuariosPorPosto(postoId) {
    return Array.from(this.usuarios.values()).filter((usuario) => usuario.postoId === postoId);
  }
}

module.exports = {
  InMemoryDatabase,
};
