function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatStatus(status) {
  const map = {
    proxima: 'Próxima',
    atrasada: 'Atrasada',
    regular: 'Em dia',
    concluido: 'Concluído',
  };
  return map[status] || status;
}

function renderMetrics(dashboard) {
  const metrics = [
    { label: 'Clientes cadastrados', value: dashboard.totalClientes },
    { label: 'Clientes ativos (30d)', value: dashboard.clientesAtivos },
    { label: 'Pontos concedidos', value: dashboard.pontosConcedidos },
    { label: 'Pontos resgatados', value: dashboard.pontosResgatados },
    { label: 'Trocas realizadas', value: dashboard.trocasRealizadas },
  ];

  const container = document.getElementById('dashboard-metrics');
  container.innerHTML = metrics
    .map(
      (metric) => `
        <div class="metric-card">
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
        </div>
      `
    )
    .join('');
}

function renderRanking(ranking) {
  const list = document.getElementById('ranking-list');
  if (!ranking.length) {
    list.innerHTML = '<li class="empty-state">Sem clientes suficientes ainda.</li>';
    return;
  }
  list.innerHTML = ranking
    .map(
      (cliente, index) => `
        <li>
          <div>
            <strong>${index + 1}. ${cliente.nome}</strong>
            <p class="muted">CPF ${cliente.cpf}</p>
          </div>
          <span class="badge">${cliente.totalPontos} pts</span>
        </li>
      `
    )
    .join('');
}

function renderClientesFidelidade(clientes) {
  const tbody = document.getElementById('clientes-table');
  if (!clientes.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum cliente encontrado.</td></tr>';
    return;
  }
  tbody.innerHTML = clientes
    .slice(0, 5)
    .map(
      (cliente) => `
        <tr>
          <td>
            <strong>${cliente.nome}</strong>
            <div class="muted">${cliente.cpf}</div>
          </td>
          <td>${cliente.pontos}</td>
          <td>${cliente.visitasPeriodo}</td>
          <td>${cliente.ultimaVisita ? formatDate(cliente.ultimaVisita) : '—'}</td>
        </tr>
      `
    )
    .join('');
}

function renderTrocas(trocas) {
  const tbody = document.getElementById('trocas-table');
  if (!trocas.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma troca programada.</td></tr>';
    return;
  }
  tbody.innerHTML = trocas
    .map(
      (troca) => `
        <tr>
          <td>${troca.clienteNome || troca.clienteCpf}</td>
          <td>${troca.veiculo?.modelo || '—'}</td>
          <td>${troca.veiculoPlaca}</td>
          <td>${troca.proximaTroca?.data ? formatDate(troca.proximaTroca.data) : formatDate(troca.data)}</td>
          <td><span class="badge">${formatStatus(troca.status)}</span></td>
        </tr>
      `
    )
    .join('');
}

function renderResgates(historico) {
  const list = document.getElementById('resgates-list');
  if (!historico.length) {
    list.innerHTML = '<li class="empty-state">Sem resgates recentes.</li>';
    return;
  }
  list.innerHTML = historico
    .map(
      (item) => `
        <li class="alert-box">
          <h4>${item.clienteNome} - ${item.recompensa?.nome}</h4>
          <p>${item.pontosGastos} pontos • ${formatDate(item.data)}</p>
        </li>
      `
    )
    .join('');
}

function renderAlertas(alertas) {
  const container = document.getElementById('alertas-list');
  const parts = [];
  if (alertas.clientesInativos?.length) {
    parts.push(`
      <div class="alert-box">
        <h4>Clientes inativos</h4>
        <p>${alertas.clientesInativos.map((c) => c.nome).join(', ')}</p>
      </div>
    `);
  }
  if (alertas.trocasProximas?.length) {
    const list = alertas.trocasProximas
      .map((troca) => `${troca.clienteCpf} • ${troca.dataTrocaFormatada}`)
      .join('<br />');
    parts.push(`
      <div class="alert-box">
        <h4>Trocas para acompanhar</h4>
        <p>${list}</p>
      </div>
    `);
  }
  container.innerHTML = parts.length ? parts.join('') : '<p class="empty-state">Nenhum alerta pendente.</p>';
}

function renderConfiguracoes(config) {
  const container = document.getElementById('configuracoes');
  const regras = `
    <p><strong>Programa:</strong> ${config.programa.nome}</p>
    <p><strong>Pontos por visita:</strong> ${config.regrasPontos.pontosPorVisita}</p>
    <p><strong>Limite diário:</strong> ${config.regrasPontos.limiteDiarioPorCpf} visitas</p>
    <p><strong>Regras extras:</strong> ${config.regrasPontos.extras || '—'}</p>
  `;
  const recompensas = config.recompensas
    .map((rec) => `<li>${rec.nome} • ${rec.pontosNecessarios} pts</li>`)
    .join('');
  const campanhas = config.campanhas.map((camp) => `<li>${camp.nome} (${camp.status})</li>`).join('');
  container.innerHTML = `
    ${regras}
    <p><strong>Recompensas ativas</strong></p>
    <ul class="list">${recompensas || '<li class="empty-state">Nenhuma recompensa.</li>'}</ul>
    <p><strong>Campanhas</strong></p>
    <ul class="list">${campanhas || '<li class="empty-state">Sem campanhas.</li>'}</ul>
  `;
}

async function loadOverview() {
  const status = document.getElementById('status-message');
  status.classList.remove('error');
  status.textContent = 'Carregando dados...';
  try {
    const response = await fetch('/api/overview');
    if (!response.ok) {
      throw new Error('Não foi possível obter os dados.');
    }
    const data = await response.json();
    status.textContent = `Última atualização: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`;
    document.getElementById('dashboard-period').textContent = `${data.dashboard.periodoDias} dias`;
    renderMetrics(data.dashboard);
    renderRanking(data.dashboard.rankingTop5 || []);
    renderClientesFidelidade(data.fidelidade.clientes || []);
    renderTrocas(data.trocas.trocas || []);
    renderResgates(data.fidelidade.historicoResgates || []);
    renderAlertas(data.recorrentes.alertas || {});
    renderConfiguracoes(data.configuracoes);
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('error');
  }
}

document.getElementById('refresh-button').addEventListener('click', loadOverview);

loadOverview();
