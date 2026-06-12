import { API_BASE_URL } from './config.js';
import { getCart, clearCart } from './cart.js';

let selectEndereco, containerNovoEndereco, formNovoEndereco, btnCancelarEndereco;
let selectEstado, selectCidade, selectPagamento, freteContainer;
let cacheEstados = [];
let token = localStorage.getItem('koridraws_token') || '';

const CEP_ORIGEM_LOJA = "07260110";
let valorFreteSelecionado = 0;
let servicoFreteSelecionado = "";
let prazoFreteSelecionado = 0;

function bindElements() {
    selectEndereco = document.getElementById('select-endereco');
    containerNovoEndereco = document.getElementById('novo-endereco-container');
    formNovoEndereco = document.getElementById('form-novo-endereco');
    btnCancelarEndereco = document.getElementById('btn-cancelar-endereco');
    selectEstado = document.getElementById('end-estado');
    selectCidade = document.getElementById('end-cidadeId');
    selectPagamento = document.getElementById('select-pagamento');
    freteContainer = document.querySelector('.frete-container');
}

function renderizarResumo() {
    const cart = getCart();
    const listContainer = document.getElementById('checkout-items-list');
    const totalContainer = document.getElementById('checkout-total-price');

    if (!listContainer || !totalContainer) return;

    if (cart.length === 0) {
        listContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        totalContainer.textContent = '';
        document.querySelector('.btn-finish-order').disabled = true;
        return;
    }

    listContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.preco * item.quantidade;
        const formatPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco);
        
        listContainer.innerHTML += `
            <div class="checkout-item" style="display:flex; justify-content: space-between; margin-bottom: 8px;">
                <span>${item.quantidade}x ${item.nome}</span>
                <span>${formatPrice}</span>
            </div>
        `;
    });

    if (valorFreteSelecionado > 0) {
        const formatFrete = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFreteSelecionado);
        listContainer.innerHTML += `
            <div class="checkout-item" style="display:flex; justify-content: space-between; margin-bottom: 8px; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px;">
                <span>Frete</span>
                <span>${formatFrete}</span>
            </div>
        `;
    }

    total += valorFreteSelecionado;
    totalContainer.textContent = `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`;
}

async function carregarEnderecos() {
    if (!token) {
        window.location.href = '/assets/pages/auth.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const perfilText = await response.text();
            const data = perfilText ? JSON.parse(perfilText) : {};
            renderizarDropdownEnderecos(data.enderecos || []);
        } else if (response.status === 401) {
            localStorage.removeItem('koridraws_token');
            window.location.href = '/assets/pages/auth.html';
        }
    } catch (erro) {
        if (selectEndereco) selectEndereco.innerHTML = '<option value="" disabled>Erro ao carregar endereços</option>';
    }
}

function renderizarDropdownEnderecos(enderecos) {
    if (!selectEndereco) return;
    
    selectEndereco.innerHTML = '';

    if (enderecos.length === 0) {
        selectEndereco.style.display = 'none';
        mostrarFormularioNovoEndereco(false);
        return;
    }

    selectEndereco.style.display = 'block';
    containerNovoEndereco.style.display = 'none';
    if (freteContainer) freteContainer.style.display = 'none';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    defaultOpt.textContent = "Selecione um endereço salvo...";
    selectEndereco.appendChild(defaultOpt);

    enderecos.forEach(end => {
        const opt = document.createElement('option');
        opt.value = end.id;
        opt.dataset.cep = end.cep;
        const cidadeStr = end.cidade ? `${end.cidade.descricao}/${end.cidade.estado?.sigla}` : '';
        opt.textContent = `${end.rua}, ${end.numero} - ${end.bairro} (${cidadeStr})`;
        selectEndereco.appendChild(opt);
    });

    const newOpt = document.createElement('option');
    newOpt.value = "novo";
    newOpt.textContent = "➕ Criar novo endereço";
    selectEndereco.appendChild(newOpt);
}

function mostrarFormularioNovoEndereco(temEnderecosAnteriores) {
    if (!containerNovoEndereco) return;
    
    containerNovoEndereco.style.display = 'block';
    if (temEnderecosAnteriores && btnCancelarEndereco) {
        btnCancelarEndereco.style.display = 'block';
    } else if (btnCancelarEndereco) {
        btnCancelarEndereco.style.display = 'none';
    }
    loadEstados();
}

async function loadEstados() {
    if (!selectEstado) return;
    if (selectEstado.options.length > 1 && cacheEstados.length > 0) return cacheEstados;
    
    try {
        const res = await fetch(`${API_BASE_URL}/Enderecos/estados`);
        if (res.ok) {
            const estados = await res.json();
            cacheEstados = estados;
            selectEstado.innerHTML = '<option value="" disabled selected>Selecione um estado</option>';
            estados.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est.id;
                opt.textContent = est.descricao || est.nome;
                selectEstado.appendChild(opt);
            });
            return estados;
        }
    } catch (error) {
    }
    return [];
}

async function loadCidades(estadoId) {
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
        }
    } catch (error) {
        selectCidade.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
    }
}

async function criarEndereco(e) {
    e.preventDefault();
    const btnSubmitForm = formNovoEndereco.querySelector('button[type="submit"]');
    btnSubmitForm.disabled = true;
    btnSubmitForm.textContent = "A guardar...";

    const formData = new FormData();
    formData.append('Cep', document.getElementById('end-cep').value.trim());
    formData.append('Rua', document.getElementById('end-rua').value.trim());
    formData.append('Numero', document.getElementById('end-numero').value.trim());
    formData.append('Complemento', document.getElementById('end-complemento').value.trim());
    formData.append('Bairro', document.getElementById('end-bairro').value.trim());
    formData.append('CidadeId', document.getElementById('end-cidadeId').value);

    try {
        const response = await fetch(`${API_BASE_URL}/Enderecos/Post`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            formNovoEndereco.reset();
            await carregarEnderecos();
            mostrarMensagem("Endereço salvo com sucesso!", false);
        } else {
            mostrarMensagem("Erro ao salvar endereço.", true);
        }
    } catch (error) {
        mostrarMensagem("Erro de conexão ao salvar endereço.", true);
    } finally {
        btnSubmitForm.disabled = false;
        btnSubmitForm.textContent = "Salvar Endereço";
    }
}

function resetFrete() {
    valorFreteSelecionado = 0;
    servicoFreteSelecionado = "";
    prazoFreteSelecionado = 0;
    const containerResultados = document.getElementById('frete-results');
    if (containerResultados) containerResultados.innerHTML = '';
    renderizarResumo();
}

async function calcularFrete() {
    const containerResultados = document.getElementById('frete-results');
    if (!containerResultados) return;

    if (!selectEndereco || !selectEndereco.value || selectEndereco.value === "novo") {
        resetFrete();
        return;
    }

    const selectedOption = selectEndereco.options[selectEndereco.selectedIndex];
    const cepDestino = selectedOption.dataset.cep;

    if (!cepDestino) {
        mostrarMensagem("CEP do endereço selecionado é inválido.", true);
        return;
    }

    const cepLimpo = cepDestino.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
        mostrarMensagem("CEP do endereço selecionado é inválido.", true);
        return;
    }

    containerResultados.innerHTML = '<span style="font-family: var(--font-body); font-size: 14px;">Calculando opções de entrega...</span>';

    const formData = new FormData();
    formData.append('CepOrigem', CEP_ORIGEM_LOJA);
    formData.append('CepDestino', cepLimpo);

    try {
        const response = await fetch(`${API_BASE_URL}/Frete/calcular`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error();
        }

        const opcoesFrete = await response.json();
        renderizarOpcoesFrete(opcoesFrete);
    } catch (error) {
        containerResultados.innerHTML = '<span style="color: #c0392b; font-family: var(--font-body); font-size: 14px;">Erro ao calcular o frete. Tente novamente.</span>';
    }
}

function renderizarOpcoesFrete(opcoes) {
    const containerResultados = document.getElementById('frete-results');
    if (!containerResultados) return;
    
    containerResultados.innerHTML = '';

    if (!opcoes || opcoes.length === 0) {
        containerResultados.innerHTML = '<span style="font-family: var(--font-body); font-size: 14px;">Nenhuma opção de entrega encontrada para este CEP.</span>';
        valorFreteSelecionado = 0;
        servicoFreteSelecionado = "";
        prazoFreteSelecionado = 0;
        renderizarResumo();
        return;
    }

    opcoes.forEach((opcao, index) => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.padding = '12px';
        label.style.border = '1px solid #e0e0e0';
        label.style.borderRadius = '4px';
        label.style.cursor = 'pointer';
        label.style.transition = 'border-color 0.2s';
        label.style.flexShrink = '0';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'freteSelecionado';
        radio.value = opcao.valor;
        radio.dataset.servico = `${opcao.transportadora} - ${opcao.servico}`;
        radio.dataset.prazoDias = opcao.prazoDias;
        radio.style.marginRight = '12px';

        if (index === 0) {
            radio.checked = true;
            label.style.borderColor = '#000';
            valorFreteSelecionado = opcao.valor;
            servicoFreteSelecionado = `${opcao.transportadora} - ${opcao.servico}`;
            prazoFreteSelecionado = opcao.prazoDias;
        }

        radio.addEventListener('change', (e) => {
            document.querySelectorAll('input[name="freteSelecionado"]').forEach(r => {
                r.parentElement.style.borderColor = '#e0e0e0';
            });
            if (e.target.checked) {
                e.target.parentElement.style.borderColor = '#000';
                valorFreteSelecionado = parseFloat(e.target.value);
                servicoFreteSelecionado = e.target.dataset.servico;
                prazoFreteSelecionado = parseInt(e.target.dataset.prazoDias);
                renderizarResumo();
            }
        });

        const infoDiv = document.createElement('div');
        infoDiv.style.display = 'flex';
        infoDiv.style.flexDirection = 'column';
        infoDiv.style.flex = '1';

        const titulo = document.createElement('span');
        titulo.textContent = `${opcao.transportadora} - ${opcao.servico}`;
        titulo.style.fontFamily = 'var(--font-body)';
        titulo.style.fontWeight = 'bold';
        titulo.style.fontSize = '14px';

        const prazo = document.createElement('span');
        prazo.textContent = `Até ${opcao.prazoDias} dias úteis`;
        prazo.style.fontFamily = 'var(--font-body)';
        prazo.style.fontSize = '12px';
        prazo.style.color = '#666';

        infoDiv.appendChild(titulo);
        infoDiv.appendChild(prazo);

        const valorSpan = document.createElement('span');
        valorSpan.textContent = `R$ ${opcao.valor.toFixed(2).replace('.', ',')}`;
        valorSpan.style.fontFamily = 'var(--font-display)';
        valorSpan.style.fontWeight = 'bold';

        label.appendChild(radio);
        label.appendChild(infoDiv);
        label.appendChild(valorSpan);

        containerResultados.appendChild(label);
    });

    renderizarResumo();
}

async function finalizarPedido(event) {
    event.preventDefault();

    if (containerNovoEndereco && containerNovoEndereco.style.display === 'block') {
        mostrarMensagem("Por favor, salve o seu novo endereço antes de finalizar o pedido.", true);
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        mostrarMensagem("O carrinho está vazio.", true);
        return;
    }

    const enderecoId = selectEndereco ? selectEndereco.value : null;
    const pagamento = selectPagamento ? selectPagamento.value : null;

    if (!enderecoId || enderecoId === "novo" || !pagamento) {
        mostrarMensagem("Selecione um endereço e método de pagamento.", true);
        return;
    }

    if (!servicoFreteSelecionado) {
        mostrarMensagem("Por favor, calcule e selecione uma opção de frete.", true);
        return;
    }

    const btnSubmit = document.querySelector('.btn-finish-order');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Processando...";
    }

    const itensPedido = cart.map(item => ({
        itemId: parseInt(item.id),
        quantidade: parseInt(item.quantidade)
    }));

    const payload = {
        enderecoId: parseInt(enderecoId),
        pagamento: pagamento,
        itens: itensPedido,
        frete: {
            servico: servicoFreteSelecionado,
            valor: parseFloat(valorFreteSelecionado),
            prazoDias: parseInt(prazoFreteSelecionado)
        }
    };

    try {
        const resposta = await fetch(`${API_BASE_URL}/Pedidos`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        if (resposta.ok) {
            const dadosDoPedido = await resposta.json();
            localStorage.setItem('koridraws_novo_pedido_id', dadosDoPedido.id);
            mostrarMensagem("Pedido criado com sucesso! Redirecionando...", false);
            clearCart();
            setTimeout(() => {
                window.location.href = '/assets/pages/perfil.html';
            }, 2000);
        } else {
            mostrarMensagem("Erro ao criar o pedido. Tente novamente.", true);
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Confirmar Pedido";
            }
        }
    } catch (erro) {
        mostrarMensagem("Erro de conexão ao finalizar pedido.", true);
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Pedido";
        }
    }
}

function mostrarMensagem(texto, isError) {
    let msgEl = document.getElementById('checkout-message');
    if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.id = 'checkout-message';
        const summary = document.querySelector('.checkout-summary');
        if (summary) summary.appendChild(msgEl);
    }
    msgEl.textContent = texto;
    msgEl.style.color = isError ? '#c0392b' : '#27ae60';
    msgEl.style.marginTop = '10px';
    msgEl.style.fontWeight = 'bold';
}

function setupListeners() {
    if (selectEndereco) {
        selectEndereco.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === "novo") {
                mostrarFormularioNovoEndereco(true);
                if (freteContainer) freteContainer.style.display = 'none';
                resetFrete();
            } else if (value === "") {
                if (containerNovoEndereco) containerNovoEndereco.style.display = 'none';
                if (freteContainer) freteContainer.style.display = 'none';
                resetFrete();
            } else {
                if (containerNovoEndereco) containerNovoEndereco.style.display = 'none';
                if (freteContainer) freteContainer.style.display = 'block';
                calcularFrete();
            }
        });
    }

    if (btnCancelarEndereco) {
        btnCancelarEndereco.addEventListener('click', () => {
            if (containerNovoEndereco) containerNovoEndereco.style.display = 'none';
            if (formNovoEndereco) formNovoEndereco.reset();
            if (selectEndereco) selectEndereco.selectedIndex = 0;
            if (freteContainer) freteContainer.style.display = 'none';
            resetFrete();
        });
    }

    if (selectEstado) selectEstado.addEventListener('change', (e) => loadCidades(e.target.value));
    if (formNovoEndereco) formNovoEndereco.addEventListener('submit', criarEndereco);
    
    const formCheckout = document.getElementById('checkout-form');
    if (formCheckout) {
        formCheckout.addEventListener('submit', finalizarPedido);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    bindElements();
    renderizarResumo();
    carregarEnderecos();
    setupListeners();
});