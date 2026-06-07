import { API_BASE_URL } from './config.js';
import { getCart, clearCart } from './cart.js';

let selectEndereco, containerNovoEndereco, formNovoEndereco, btnCancelarEndereco;
let selectEstado, selectCidade, selectPagamento;
let cacheEstados = [];
let token = localStorage.getItem('koridraws_token') || '';

function bindElements() {
    selectEndereco = document.getElementById('select-endereco');
    containerNovoEndereco = document.getElementById('novo-endereco-container');
    formNovoEndereco = document.getElementById('form-novo-endereco');
    btnCancelarEndereco = document.getElementById('btn-cancelar-endereco');
    selectEstado = document.getElementById('end-estado');
    selectCidade = document.getElementById('end-cidadeId');
    selectPagamento = document.getElementById('select-pagamento');
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
        selectEndereco.innerHTML = '<option value="" disabled>Erro ao carregar endereços</option>';
    }
}

function renderizarDropdownEnderecos(enderecos) {
    selectEndereco.innerHTML = '';

    if (enderecos.length === 0) {
        selectEndereco.style.display = 'none';
        mostrarFormularioNovoEndereco(false);
        return;
    }

    selectEndereco.style.display = 'block';
    containerNovoEndereco.style.display = 'none';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    defaultOpt.textContent = "Selecione um endereço salvo...";
    selectEndereco.appendChild(defaultOpt);

    enderecos.forEach(end => {
        const opt = document.createElement('option');
        opt.value = end.id;
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
    containerNovoEndereco.style.display = 'block';
    if (temEnderecosAnteriores) {
        btnCancelarEndereco.style.display = 'block';
    } else {
        btnCancelarEndereco.style.display = 'none';
    }
    loadEstados();
}

async function loadEstados() {
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

async function finalizarPedido(event) {
    event.preventDefault();

    if (containerNovoEndereco.style.display === 'block') {
        mostrarMensagem("Por favor, salve o seu novo endereço antes de finalizar o pedido.", true);
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        mostrarMensagem("O carrinho está vazio.", true);
        return;
    }

    const enderecoId = selectEndereco.value;
    const pagamento = selectPagamento.value;

    if (!enderecoId || enderecoId === "novo" || !pagamento) {
        mostrarMensagem("Selecione um endereço e método de pagamento.", true);
        return;
    }

    const btnSubmit = document.querySelector('.btn-finish-order');
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Processando...";

    const formData = new FormData();
    formData.append('EnderecoId', parseInt(enderecoId));
    formData.append('Pagamento', pagamento);

    cart.forEach((item, index) => {
        formData.append(`Itens[${index}].itemId`, item.id);
        formData.append(`Itens[${index}].quantidade`, item.quantidade);
    });

    try {
        const resposta = await fetch(`${API_BASE_URL}/Pedidos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (resposta.ok) {
            mostrarMensagem("Pedido criado com sucesso! Redirecionando...", false);
            clearCart();
            setTimeout(() => {
                window.location.href = '/assets/pages/perfil.html';
            }, 2000);
        } else {
            mostrarMensagem("Erro ao criar o pedido. Tente novamente.", true);
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Confirmar Pedido";
        }
    } catch (erro) {
        mostrarMensagem("Erro de conexão ao finalizar pedido.", true);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Confirmar Pedido";
    }
}

function mostrarMensagem(texto, isError) {
    let msgEl = document.getElementById('checkout-message');
    if (!msgEl) {
        msgEl = document.createElement('p');
        msgEl.id = 'checkout-message';
        document.querySelector('.checkout-summary').appendChild(msgEl);
    }
    msgEl.textContent = texto;
    msgEl.style.color = isError ? '#c0392b' : '#27ae60';
    msgEl.style.marginTop = '10px';
    msgEl.style.fontWeight = 'bold';
}

function setupListeners() {
    selectEndereco.addEventListener('change', (e) => {
        if (e.target.value === "novo") {
            mostrarFormularioNovoEndereco(true);
        } else {
            containerNovoEndereco.style.display = 'none';
        }
    });

    btnCancelarEndereco.addEventListener('click', () => {
        containerNovoEndereco.style.display = 'none';
        formNovoEndereco.reset();
        selectEndereco.selectedIndex = 0;
    });

    selectEstado.addEventListener('change', (e) => loadCidades(e.target.value));
    formNovoEndereco.addEventListener('submit', criarEndereco);
    
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