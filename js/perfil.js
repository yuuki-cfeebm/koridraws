import { API_BASE_URL } from './config.js';

let perfilNome, perfilEmail, enderecosList, pedidosList, btnNovoEndereco, formEnderecoContainer, formEndereco, btnCancelarEndereco, selectEstado, selectCidade, formTitle, btnLogoff;
let cacheEstados = [];

const statusPedidoMap = {
  'Criado': 'Criado',
  'AguardandoPagamento': 'Aguardando Pagamento',
  'PagamentoConfirmado': 'Pagamento Confirmado',
  'EmPreparacao': 'Em Preparação',
  'EmEnvio': 'Em Envio',
  'Concluido': 'Concluído',
  'Cancelado': 'Cancelado'
};

const metodoPagamentoMap = {
  'CartaoCredito': 'Cartão de Crédito',
  'CartaoDebito': 'Cartão de Débito',
  'Boleto': 'Boleto Bancário',
  'Pix': 'PIX'
};

const statusIconMap = {
  'Criado': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
  'AguardandoPagamento': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  'PagamentoConfirmado': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  'EmPreparacao': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
  'EmEnvio': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
  'Concluido': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
  'Cancelado': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
};

function bindElements() {
  perfilNome = document.getElementById('perfil-nome');
  perfilEmail = document.getElementById('perfil-email');
  enderecosList = document.getElementById('enderecos-list');
  pedidosList = document.getElementById('pedidos-list');
  btnNovoEndereco = document.getElementById('btn-novo-endereco');
  formEnderecoContainer = document.getElementById('endereco-form-container');
  formEndereco = document.getElementById('form-endereco');
  btnCancelarEndereco = document.getElementById('btn-cancelar-endereco');
  selectEstado = document.getElementById('end-estado');
  selectCidade = document.getElementById('end-cidadeId');
  formTitle = document.getElementById('form-endereco-title');
  btnLogoff = document.getElementById('btn-logoff');
}

async function loadProfile() {
  const token = localStorage.getItem('koridraws_token');
  
  if (!token) {
    window.location.href = '/assets/pages/auth.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/Perfil`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('koridraws_token');
        localStorage.removeItem('koridraws_user_name');
        window.location.href = '/assets/pages/auth.html';
      }
      throw new Error();
    }

    const perfilText = await response.text();
    const data = perfilText ? JSON.parse(perfilText) : {};
    
    if (perfilNome) perfilNome.textContent = data.perfil?.nome || 'Utilizador';
    if (perfilEmail) perfilEmail.textContent = data.perfil?.email || 'Não informado';

    renderEnderecos(data.enderecos || []);
    renderPedidos(data.pedidos || []);
    checkNovoPedidoPopup(data.pedidos || []);
  } catch (error) {
    if (perfilNome) perfilNome.textContent = "Erro ao carregar dados";
  }
}

function exibirModalQRCode(pedido, tituloModal, textoModal) {
  let overlay = document.getElementById('modal-qrcode-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-qrcode-overlay';
    overlay.className = 'modal-qrcode-overlay';

    overlay.innerHTML = `
      <div class="modal-qrcode-content">
        <h3 id="modal-qr-titulo"></h3>
        <p id="modal-qr-msg"></p>
        <div id="qrcode-popup-container"></div>
        <button id="btn-fechar-modal-qrcode">
          Fechar
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);

    document.getElementById('btn-fechar-modal-qrcode').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  }

  document.getElementById('modal-qr-titulo').textContent = tituloModal;
  document.getElementById('modal-qr-msg').textContent = textoModal;

  overlay.style.display = 'flex';
  const container = document.getElementById('qrcode-popup-container');
  container.innerHTML = '';

  let texto = `PEDIDO #${pedido.id}\n`;
  texto += `Data: ${new Date(pedido.dataEmissao).toLocaleString('pt-BR')}\n`;
  texto += `Valor Total: R$ ${pedido.valorTotal.toFixed(2)}\n`;
  texto += `Itens:\n`;

  if (pedido.itens) {
    pedido.itens.forEach(item => {
      texto += `- ${item.quantidade}x ${item.nomeProduto} (R$ ${item.precoUnitario.toFixed(2)})\n`;
    });
  }

  new QRCode(container, {
    text: texto,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

function checkNovoPedidoPopup(pedidos) {
  const novoPedidoId = localStorage.getItem('koridraws_novo_pedido_id');
  
  if (!novoPedidoId) return;

  const pedido = pedidos.find(p => p.id.toString() === novoPedidoId.toString());
  
  if (!pedido) return;

  localStorage.removeItem('koridraws_novo_pedido_id');

  exibirModalQRCode(
    pedido, 
    "Pedido Confirmado!", 
    "O seu pedido foi recebido com sucesso. Escaneie o QR Code abaixo para visualizar os detalhes e proceder com o pagamento."
  );
}

function renderEnderecos(enderecos) {
  if (!enderecosList) return;
  enderecosList.innerHTML = '';

  if (!enderecos || enderecos.length === 0) {
    enderecosList.innerHTML = '<p class="empty-state">Não possui nenhum endereço.</p>';
    return;
  }

  enderecos.forEach(end => {
    const card = document.createElement('div');
    card.className = 'endereco-card';

    const cidadeNome = end.cidade?.descricao || '';
    const estadoSigla = end.cidade?.estado?.sigla || '';
    const formatCidadeEstado = cidadeNome && estadoSigla ? `${cidadeNome} / ${estadoSigla}` : 'Cidade não identificada';
    const complementoStr = end.complemento ? ` - ${end.complemento}` : '';

    card.innerHTML = `
      <div class="endereco-info">
        <p><strong>${end.rua}, ${end.numero}${complementoStr}</strong></p>
        <p>${end.bairro} - CEP: ${end.cep}</p>
        <p>${formatCidadeEstado}</p>
      </div>
      <div class="endereco-actions-container">
        <button class="btn-edit" data-id="${end.id}">Editar</button>
        <button class="btn-delete" data-id="${end.id}">Remover</button>
      </div>
    `;

    enderecosList.appendChild(card);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => editEndereco(e.target.dataset.id, enderecos));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteEndereco(e.target.dataset.id));
  });
}

function renderPedidos(pedidos) {
  if (!pedidosList) return;
  pedidosList.innerHTML = '';

  if (!pedidos || pedidos.length === 0) {
    pedidosList.innerHTML = '<p class="empty-state">Nenhum pedido realizado.</p>';
    return;
  }

  pedidos.forEach(pedido => {
    const card = document.createElement('div');
    card.className = 'pedido-card';

    const dataFormatada = new Date(pedido.dataEmissao).toLocaleDateString('pt-BR');
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valorTotal);

    const statusUI = statusPedidoMap[pedido.status] || pedido.status;
    const pagamentoUI = metodoPagamentoMap[pedido.pagamento] || pedido.pagamento;
    const iconeStatus = statusIconMap[pedido.status] || '';

    let itensHtml = '';
    if (pedido.itens && pedido.itens.length > 0) {
      pedido.itens.forEach(item => {
        const precoItem = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario);
        itensHtml += `<li class="pedido-item-li">${item.quantidade}x ${item.nomeProduto} - ${precoItem}</li>`;
      });
    }

    let freteHtml = '';
    if (pedido.frete && pedido.frete.valor !== undefined) {
      const valorFrete = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.frete.valor);
      freteHtml = `
        <div class="pedido-frete-container">
          <p class="pedido-frete-text">
            <strong>Frete (${pedido.frete.servico}):</strong> ${valorFrete} <span class="pedido-frete-obs">(Até ${pedido.frete.prazoDias || ''} dias úteis)</span>
          </p>
        </div>
      `;
    }

    const btnVerDetalhes = pedido.status === 'AguardandoPagamento' 
      ? `<button class="btn-detalhes-pedido" data-id="${pedido.id}">Realizar Pagamento</button>` 
      : '';

    card.innerHTML = `
      <div class="pedido-header">
        <div class="pedido-header-top">
          <h4 class="pedido-header-title">Pedido #${pedido.id}</h4>
          ${btnVerDetalhes}
        </div>
        <div class="pedido-header-bottom">
          <span class="pedido-status-badge"><strong>Status:</strong> ${iconeStatus} ${statusUI}</span>
          <span><strong>Data:</strong> ${dataFormatada}</span>
          <span><strong>Pagamento:</strong> ${pagamentoUI}</span>
        </div>
      </div>
      <div class="pedido-body">
        <p class="pedido-entrega-text"><strong>Entrega:</strong> ${pedido.enderecoEntregaResumido || pedido.enderecoCompleto || 'Endereço não informado'}</p>
        <ul class="pedido-items-list">
          ${itensHtml}
        </ul>
        ${freteHtml}
        <p class="pedido-total-text"><strong>Total: ${valorFormatado}</strong></p>
      </div>
    `;
    pedidosList.appendChild(card);
  });

  document.querySelectorAll('.btn-detalhes-pedido').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pedidoId = e.target.dataset.id;
      const pedido = pedidos.find(p => p.id.toString() === pedidoId.toString());

      if (pedido) {
        exibirModalQRCode(
          pedido, 
          `Pedido #${pedido.id}`, 
          "Escaneie o QR Code abaixo para visualizar os detalhes deste pedido e prosseguir com o pagamento."
        );
      }
    });
  });
}

async function loadEstados() {
  if (selectEstado && selectEstado.options.length > 1 && cacheEstados.length > 0) return cacheEstados;
  try {
    const res = await fetch(`${API_BASE_URL}/Enderecos/estados`);
    if (res.ok) {
      const estados = await res.json();
      cacheEstados = estados;
      if (selectEstado) {
        selectEstado.innerHTML = '<option value="" disabled selected>Selecione um estado</option>';
        estados.forEach(est => {
          const opt = document.createElement('option');
          opt.value = est.id;
          opt.textContent = est.descricao || est.nome;
          selectEstado.appendChild(opt);
        });
      }
      return estados;
    }
  } catch (error) {
  }
  return [];
}

async function loadCidades(estadoId, cidadeSelecionadaId = null) {
  if (!selectCidade) return;
  selectCidade.innerHTML = '<option value="" disabled selected>A carregar...</option>';
  selectCidade.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/Enderecos/estados/${estadoId}/cidades`);
    if (res.ok) {
      const cidades = await res.json();
      selectCidade.innerHTML = '<option value="" disabled selected>Selecione uma cidade</option>';
      
      cidades.forEach(cid => {
        const opt = document.createElement('option');
        opt.value = cid.id;
        opt.textContent = cid.descricao || cid.nome;
        selectCidade.appendChild(opt);
      });
      selectCidade.disabled = false;

      if (cidadeSelecionadaId) {
        selectCidade.value = cidadeSelecionadaId;
      }
    }
  } catch (error) {
    selectCidade.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

async function editEndereco(id, enderecos) {
  const endereco = enderecos.find(e => e.id.toString() === id.toString());
  if (!endereco) return;

  await loadEstados();

  document.getElementById('end-id').value = endereco.id;
  document.getElementById('end-rua').value = endereco.rua || '';
  document.getElementById('end-numero').value = endereco.numero || '';
  document.getElementById('end-bairro').value = endereco.bairro || '';
  document.getElementById('end-cep').value = endereco.cep || '';
  document.getElementById('end-complemento').value = endereco.complemento || '';

  const estadoId = endereco.cidade?.estadoId;
  const cidadeId = endereco.cidade?.id;

  if (estadoId) {
    selectEstado.value = estadoId;
    await loadCidades(estadoId, cidadeId);
  } else {
    selectCidade.innerHTML = '<option value="" disabled selected>Selecione um estado primeiro</option>';
    selectCidade.disabled = true;
  }

  formTitle.textContent = 'Editar Endereço';
  formEnderecoContainer.style.display = 'block';
  
  formEnderecoContainer.scrollIntoView({ behavior: 'smooth' });
}

async function deleteEndereco(id) {
  const token = localStorage.getItem('koridraws_token');

  try {
    const response = await fetch(`${API_BASE_URL}/Enderecos/Delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error();

    await loadProfile();
  } catch (error) {
    alert('Erro ao remover endereço.');
  }
}

function initProfile() {
  bindElements();
  
  if (perfilNome) {
    loadProfile();
  }

  if (btnLogoff) {
    btnLogoff.addEventListener('click', () => {
      const confirmar = confirm('Tem a certeza que deseja sair da sua conta?');
      if (confirmar) {
        localStorage.removeItem('koridraws_token');
        localStorage.removeItem('koridraws_user_name');
        window.location.href = '/assets/pages/home.html';
      }
    });
  }

  if (selectEstado) {
    selectEstado.addEventListener('change', (e) => loadCidades(e.target.value));
  }

  if (btnNovoEndereco) {
    btnNovoEndereco.addEventListener('click', () => {
      formEndereco.reset();
      document.getElementById('end-id').value = '';
      formTitle.textContent = 'Adicionar Novo Endereço';
      selectCidade.innerHTML = '<option value="" disabled selected>Selecione um estado primeiro</option>';
      selectCidade.disabled = true;
      formEnderecoContainer.style.display = 'block';
      loadEstados();
      formEnderecoContainer.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnCancelarEndereco) {
    btnCancelarEndereco.addEventListener('click', () => {
      formEnderecoContainer.style.display = 'none';
      formEndereco.reset();
    });
  }

  if (formEndereco) {
    formEndereco.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('koridraws_token');
      const id = document.getElementById('end-id').value;
      const isUpdate = !!id;

      const formData = new FormData();
      formData.append('Rua', document.getElementById('end-rua').value.trim());
      formData.append('Numero', document.getElementById('end-numero').value.trim());
      formData.append('Bairro', document.getElementById('end-bairro').value.trim());
      formData.append('Cep', document.getElementById('end-cep').value.trim());
      formData.append('Complemento', document.getElementById('end-complemento').value.trim());
      formData.append('CidadeId', document.getElementById('end-cidadeId').value);

      const url = isUpdate 
        ? `${API_BASE_URL}/Enderecos/Put/${id}` 
        : `${API_BASE_URL}/Enderecos/Post`;
      
      const method = isUpdate ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) throw new Error();

        formEnderecoContainer.style.display = 'none';
        formEndereco.reset();
        await loadProfile();
      } catch (error) {
        alert('Erro ao salvar endereço.');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfile);
} else {
  initProfile();
}