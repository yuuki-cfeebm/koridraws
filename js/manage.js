import { API_BASE_URL } from './config.js';

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
    'EmEnvio': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
    'Concluido': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
    'Cancelado': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
};

let todosPedidosCache = [];
let paginaAtual = 1;
const pedidosPorPagina = 6;

async function initManage() {
    const token = localStorage.getItem('koridraws_token');
    const role = localStorage.getItem('koridraws_user_role');

    if (!token || role !== 'Gerente') {
        window.location.href = '/index.html';
        return;
    }

    const loading = document.getElementById('loading-manage');

    try {
        const response = await fetch(`${API_BASE_URL}/Pedidos`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Admin-Key': 'SUA_CHAVE_AQUI'
            }
        });

        if (!response.ok) {
            throw new Error('Falha de permissão ou conexão.');
        }

        const pedidos = await response.json();
        loading.style.display = 'none';

        todosPedidosCache = pedidos.sort((a, b) => new Date(b.dataEmissao) - new Date(a.dataEmissao));
        renderizarPaginaAtual();

    } catch (error) {
        console.error(error);
        loading.textContent = 'Erro ao carregar os pedidos. Verifique o servidor ou a sua permissão.';
        loading.style.color = '#c0392b';
    }
}

function renderizarPaginaAtual() {
    const listContainer = document.getElementById('manage-pedidos-list');
    
    const indiceInicio = (paginaAtual - 1) * pedidosPorPagina;
    const indiceFim = indiceInicio + pedidosPorPagina;
    const pedidosPaginados = todosPedidosCache.slice(indiceInicio, indiceFim);

    renderPedidos(pedidosPaginados, listContainer);
    renderizarControlesPaginacao();
}

function renderizarControlesPaginacao() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    const totalPaginas = Math.ceil(todosPedidosCache.length / pedidosPorPagina);

    if (totalPaginas <= 1) return;

    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.className = 'page-btn';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarPaginaAtual();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(btnAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('button');
        btnPagina.textContent = i;
        btnPagina.className = `page-btn ${i === paginaAtual ? 'active' : ''}`;
        btnPagina.addEventListener('click', () => {
            paginaAtual = i;
            renderizarPaginaAtual();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(btnPagina);
    }

    const btnProximo = document.createElement('button');
    btnProximo.textContent = 'Próxima';
    btnProximo.className = 'page-btn';
    btnProximo.disabled = paginaAtual === totalPaginas;
    btnProximo.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarPaginaAtual();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(btnProximo);
}

function renderPedidos(pedidos, container) {
    if (!pedidos || pedidos.length === 0) {
        container.innerHTML = '<p style="text-align: center; font-family: var(--font-body); color: #666;">Ainda não existem pedidos registados no sistema.</p>';
        return;
    }

    container.innerHTML = '';

    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card-admin';

        const dataFormatada = new Date(pedido.dataEmissao).toLocaleString('pt-BR');
        const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valorTotal);
        
        const pagamentoUI = metodoPagamentoMap[pedido.pagamento] || pedido.pagamento;
        const iconeStatus = statusIconMap[pedido.status] || '';

        let itensHtml = '';
        if (pedido.itens && pedido.itens.length > 0) {
            pedido.itens.forEach(itemData => {
                const nomeItem = itemData.nomeProduto || 'Produto Indisponível';
                const precoUnit = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemData.precoUnitario);
                itensHtml += `<li style="margin-bottom: 6px;"><strong>${itemData.quantidade}x</strong> ${nomeItem} - ${precoUnit}</li>`;
            });
        } else {
            itensHtml = '<li>Nenhum item detalhado neste pedido</li>';
        }

        let freteHtml = '';
        if (pedido.freteServico) {
            const freteValor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.freteValor || 0);
            freteHtml = `<strong>Frete:</strong> ${pedido.freteServico} (${freteValor})`;
            if (pedido.codigoRastreio) {
                freteHtml += `<br><strong>Rastreio:</strong> ${pedido.codigoRastreio}`;
            }
        } else {
            freteHtml = '<em>Nenhuma informação de frete disponível.</em>';
        }

        // Criar as opções de status
        let optionsHtml = '';
        for (const [key, value] of Object.entries(statusPedidoMap)) {
            const isSelected = pedido.status === key ? 'selected' : '';
            optionsHtml += `<option value="${key}" ${isSelected}>${value}</option>`;
        }

        card.innerHTML = `
            <div class="pedido-header-admin">
                <div>
                    <h3 style="margin: 0 0 4px 0; font-family: var(--font-display); font-size: 1.4rem; color: var(--text-title);">Pedido #${pedido.id}</h3>
                    <span style="color: #666; font-size: 0.9rem;">Criado em: ${dataFormatada}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; background: #f0f0f0; padding: 6px 12px; border-radius: 6px;">
                    ${iconeStatus}
                    <select class="select-status-pedido" data-id="${pedido.id}" data-original="${pedido.status}" style="background: transparent; border: 1px solid #ccc; padding: 4px; border-radius: 4px; font-weight: bold; font-family: inherit; font-size: 0.95rem; cursor: pointer; outline: none;">
                        ${optionsHtml}
                    </select>
                </div>
            </div>
            <div class="pedido-body-admin">
                <div class="pedido-grid">
                    <div>
                        <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${pedido.clienteNome}</p>
                        <p style="margin: 0 0 8px 0;"><strong>E-mail:</strong> ${pedido.clienteEmail}</p>
                        <p style="margin: 0 0 8px 0;"><strong>Pagamento:</strong> ${pagamentoUI}</p>
                        <p style="margin: 0; line-height: 1.4;"><strong>Endereço de Entrega:</strong><br>${pedido.enderecoCompleto}</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #eaeaea;">
                        <strong style="display:block; margin-bottom: 12px; font-size: 1.05rem;">Itens (${pedido.totalItens || 0}):</strong>
                        <ul style="margin: 0; padding-left: 20px; max-height: 96px; overflow-y: auto;">
                            ${itensHtml}
                        </ul>
                    </div>
                </div>
                <div style="border-top: 1px dashed #ccc; padding-top: 16px; margin-top: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <span style="font-size: 0.95rem; color: #555; line-height: 1.5;">${freteHtml}</span>
                    <strong style="font-size: 1.5rem; color: var(--text-title);">Total: ${valorFormatado}</strong>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Anexar eventos aos novos selects de status
    const statusSelects = container.querySelectorAll('.select-status-pedido');
    statusSelects.forEach(select => {
        select.addEventListener('change', async (e) => {
            const pedidoId = e.target.dataset.id;
            const novoStatus = e.target.value;
            const statusOriginal = e.target.dataset.original;
            const token = localStorage.getItem('koridraws_token');

            e.target.disabled = true;

            const formData = new FormData();
            formData.append('id', parseInt(pedidoId, 10));
            formData.append('novoStatus', novoStatus);

            try {
                const response = await fetch(`${API_BASE_URL}/Pedidos/status`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Admin-Key': 'SUA_CHAVE_AQUI'
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar');
                }

                // Atualiza o estado da memória cache
                const pedidoCache = todosPedidosCache.find(p => p.id === parseInt(pedidoId, 10));
                if (pedidoCache) {
                    pedidoCache.status = novoStatus;
                }

                // Recarrega a página atual para atualizar o ícone também
                renderizarPaginaAtual();

            } catch (error) {
                alert('Erro ao atualizar o status do pedido.');
                e.target.value = statusOriginal;
                e.target.disabled = false;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initManage);