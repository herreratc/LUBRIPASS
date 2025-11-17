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
  }

  seed({ postos = [], programas = [], clientes = [], veiculos = [], pontos = [], trocas = [] }) {
    postos.forEach((posto) => this.postos.set(posto.id, posto));
    programas.forEach((programa) => this.programas.set(programa.postoId, programa));
    clientes.forEach((cliente) => this.clientes.set(cliente.cpf, { ...cliente }));
    veiculos.forEach((veiculo) => this.veiculos.set(veiculo.placa, { ...veiculo }));
    this.pontos.push(...pontos);
    this.trocas.push(...trocas);
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

  registrarMovimentacaoPontos({ clienteCpf, postoId, quantidade, tipo, origem, usuarioId }) {
    const movimento = {
      id: generateId('mov'),
      clienteCpf,
      postoId,
      quantidade,
      tipo,
      origem,
      usuarioId,
      data: new Date().toISOString(),
    };
    this.pontos.push(movimento);
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
    return troca;
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
}

module.exports = {
  InMemoryDatabase,
};
