import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let todosProdutos = [];
let produtosFiltradosAtuais = [];
let paginaAtual = 1;

let categoriaAtual = 'Todos';
let ordenacaoAtual = 'default';

const corteBaixoEstoque = 5;
const produtosPorPagina = 9;

// ==========================================
// HANDLERS NOMEADOS PARA EVENT LISTENERS
// ==========================================

function handleSortChange(e) {
    ordenacaoAtual = e.target.value;
    aplicarFiltrosEOrdenacao();
}

function handleFilterClick(e) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    categoriaAtual = e.target.dataset.category;
    aplicarFiltrosEOrdenacao();
}

function handleBtnAnteriorClick() {
    if (paginaAtual > 1) {
        paginaAtual--;
        renderizarPaginaAtual();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleBtnProximoClick() {
    const totalPaginas = Math.ceil(produtosFiltradosAtuais.length / produtosPorPagina);
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        renderizarPaginaAtual();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleBtnPaginaClick(e) {
    const page = parseInt(e.currentTarget.dataset.page, 10);
    paginaAtual = page;
    renderizarPaginaAtual();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleBtnComprarClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const btn = e.currentTarget;

    addToCart({
        id: btn.dataset.id,
        nome: btn.dataset.nome,
        preco: parseFloat(btn.dataset.preco),
        imagem: btn.dataset.imagem,
        estoque: parseInt(btn.dataset.estoque, 10),
        quantidade: 1
    });
}

function handleImagensChange(e) {
    const msgContainer = document.getElementById('msg-novo-produto');
    if (e.target.files.length > 4) {
        if (msgContainer) {
            msgContainer.textContent = "Por favor, selecione no máximo 4 imagens.";
            msgContainer.classList.remove('msg-success');
            msgContainer.classList.add('msg-error');
        }
        e.target.value = '';
    } else {
        if (msgContainer) {
            msgContainer.textContent = "";
            msgContainer.classList.remove('msg-error', 'msg-success');
        }
    }
}

async function handleNovoProdutoSubmit(e) {
    e.preventDefault();
    const formNovoProduto = e.currentTarget;
    const inputImagens = document.getElementById('novo-item-imagens');
    const msgContainer = document.getElementById('msg-novo-produto');

    if (inputImagens && inputImagens.files.length > 4) {
        if (msgContainer) {
            msgContainer.textContent = "Por favor, selecione no máximo 4 imagens.";
            msgContainer.classList.remove('msg-success');
            msgContainer.classList.add('msg-error');
        }
        return;
    }

    const btnSubmit = formNovoProduto.querySelector('button[type="submit"]');
    const token = localStorage.getItem('koridraws_token');

    const nome = document.getElementById('novo-item-nome').value.trim();
    const preco = document.getElementById('novo-item-preco').value;
    const estoque = document.getElementById('novo-item-estoque').value;

    btnSubmit.disabled = true;
    btnSubmit.textContent = "A salvar...";
    
    if (msgContainer) {
        msgContainer.textContent = "";
        msgContainer.classList.remove('msg-error', 'msg-success');
    }

    const formData = new FormData();
    formData.append('Nome', nome);
    formData.append('Preco', parseFloat(preco).toString().replace('.', ','));
    formData.append('Estoque', parseInt(estoque, 10));

    if (inputImagens) {
        for (let i = 0; i < inputImagens.files.length; i++) {
            formData.append('Imagens', inputImagens.files[i]);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Itens/Post`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        if (response.ok) {
            if (msgContainer) {
                msgContainer.textContent = "Produto cadastrado com sucesso!";
                msgContainer.classList.remove('msg-error');
                msgContainer.classList.add('msg-success');
            }
            formNovoProduto.reset();
            loadProducts();
        } else {
            throw new Error("Erro na resposta do servidor.");
        }
    } catch (error) {
        if (msgContainer) {
            msgContainer.textContent = "Erro ao cadastrar o produto. Verifique os dados ou as suas permissões.";
            msgContainer.classList.remove('msg-success');
            msgContainer.classList.add('msg-error');
        }
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Salvar Novo Produto";
    }
}

function handleDOMContentLoaded() {
    loadProducts();
    inicializarPainelGerente();
}

// ==========================================
// FUNÇÕES PRINCIPAIS
// ==========================================

async function loadProducts() {
    const spinner = document.getElementById('loading-spinner');

    try {
        const response = await fetch(`${API_BASE_URL}/Itens`);
        if (!response.ok) {
            throw new Error();
        }

        todosProdutos = await response.json();

        if (spinner) {
            spinner.classList.add('d-none');
        }

        setupFilters();
        setupSorting();
        aplicarFiltrosEOrdenacao();

    } catch (error) {
        if (spinner) {
            spinner.textContent = "Não foi possível carregar os produtos no momento.";
            spinner.classList.add('msg-error');
        }
    }
}

function aplicarFiltrosEOrdenacao() {
    if (categoriaAtual === 'Todos') {
        produtosFiltradosAtuais = [...todosProdutos];
    } else {
        produtosFiltradosAtuais = todosProdutos.filter(produto => {
            const nomeStr = produto.nome.toLowerCase();
            const catStr = categoriaAtual.toLowerCase();

            if (catStr === 'adesivos' || catStr === 'adesivo' || catStr === 'cartela' || catStr === 'cartelas') {
                return nomeStr.includes('adesivo') || nomeStr.includes('cartela');
            }
            if (catStr === 'bottons' || catStr === 'botton') {
                return nomeStr.includes('botton');
            }
            if (catStr === 'prints' || catStr === 'print') {
                return nomeStr.includes('print');
            }
            if (catStr === 'chaveiros' || catStr === 'chaveiro') {
                return nomeStr.includes('chaveiro') || nomeStr.includes('phonecharm');
            }

            return nomeStr.includes(catStr);
        });
    }

    produtosFiltradosAtuais.sort((a, b) => {
        switch (ordenacaoAtual) {
            case 'preco_asc':
                return a.preco - b.preco;
            case 'preco_desc':
                return b.preco - a.preco;
            case 'alfa_asc':
                return a.nome.localeCompare(b.nome);
            case 'alfa_desc':
                return b.nome.localeCompare(a.nome);
            case 'id_desc':
                return b.id - a.id;
            case 'id_asc':
                return a.id - b.id;
            default:
                const getPrioridade = (p) => {
                    if (p.estoque === 0) return 3;
                    if (p.estoque > 0 && p.estoque <= corteBaixoEstoque) return 1;
                    return 2;
                };

                const prioA = getPrioridade(a);
                const prioB = getPrioridade(b);

                if (prioA !== prioB) return prioA - prioB;
                if (prioA === 1 && a.estoque !== b.estoque) return a.estoque - b.estoque;
                
                return a.nome.localeCompare(b.nome);
        }
    });

    paginaAtual = 1;
    renderizarPaginaAtual();
}

function setupSorting() {
    const filtersContainer = document.querySelector('.filters-container');
    if (!filtersContainer) return;

    let sortContainer = document.querySelector('.sort-container');
    if (!sortContainer) {
        sortContainer = document.createElement('div');
        sortContainer.className = 'sort-container';

        const sortSelect = document.createElement('select');
        sortSelect.id = 'sort-select';

        const options = [
            { val: 'default', text: 'Ordenar' },
            { val: 'id_desc', text: 'Lançamentos' },
            { val: 'preco_asc', text: 'Menor Preço' },
            { val: 'preco_desc', text: 'Maior Preço' },
            { val: 'alfa_asc', text: 'A - Z' },
            { val: 'alfa_desc', text: 'Z - A' },
            { val: 'id_asc', text: 'Mais Antigos' }
        ];

        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.val;
            optionEl.textContent = opt.text;
            sortSelect.appendChild(optionEl);
        });

        sortSelect.removeEventListener('change', handleSortChange);
        sortSelect.addEventListener('change', handleSortChange);

        sortContainer.appendChild(sortSelect);
        filtersContainer.appendChild(sortContainer);
    }
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.removeEventListener('click', handleFilterClick);
        btn.addEventListener('click', handleFilterClick);
    });
}

function renderizarPaginaAtual() {
    const indiceInicio = (paginaAtual - 1) * produtosPorPagina;
    const indiceFim = indiceInicio + produtosPorPagina;
    const produtosPaginados = produtosFiltradosAtuais.slice(indiceInicio, indiceFim);

    renderProducts(produtosPaginados);
    renderizarControlesPaginacao();
}

function renderizarControlesPaginacao() {
    let paginationContainer = document.getElementById('pagination-controls-products');

    if (!paginationContainer) {
        const grid = document.getElementById('products-grid');
        if (grid && grid.parentNode) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'pagination-controls-products';
            paginationContainer.className = 'pagination-container';
            grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);
        } else {
            return;
        }
    }

    paginationContainer.innerHTML = '';
    const totalPaginas = Math.ceil(produtosFiltradosAtuais.length / produtosPorPagina);

    if (totalPaginas <= 1) return;

    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = 'Anterior';
    btnAnterior.className = 'page-btn';
    btnAnterior.disabled = paginaAtual === 1;
    btnAnterior.removeEventListener('click', handleBtnAnteriorClick);
    btnAnterior.addEventListener('click', handleBtnAnteriorClick);
    paginationContainer.appendChild(btnAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('button');
        btnPagina.textContent = i;
        btnPagina.className = `page-btn ${i === paginaAtual ? 'active' : ''}`;
        
        btnPagina.dataset.page = i;
        btnPagina.removeEventListener('click', handleBtnPaginaClick);
        btnPagina.addEventListener('click', handleBtnPaginaClick);
        
        paginationContainer.appendChild(btnPagina);
    }

    const btnProximo = document.createElement('button');
    btnProximo.textContent = 'Próxima';
    btnProximo.className = 'page-btn';
    btnProximo.disabled = paginaAtual === totalPaginas;
    btnProximo.removeEventListener('click', handleBtnProximoClick);
    btnProximo.addEventListener('click', handleBtnProximoClick);
    paginationContainer.appendChild(btnProximo);
}

function renderProducts(listaParaRenderizar) {
    const grid = document.getElementById('products-grid');
    const template = document.getElementById('product-card-template');

    if (!grid || !template) return;

    grid.innerHTML = '';

    if (listaParaRenderizar.length === 0) {
        grid.innerHTML = '<p class="empty-products-msg">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    listaParaRenderizar.forEach(produto => {
        const clone = template.content.cloneNode(true);

        clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`;

        const titleEl = clone.querySelector('.product-title') || clone.querySelector('.card-text h2');
        if (titleEl) titleEl.textContent = produto.nome;

        const priceEl = clone.querySelector('.currently-price');
        if (priceEl) priceEl.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

        const imgEl = clone.querySelector('.img-card');
        let imageUrl = '/assets/images/image.png';

        if (produto.imagem) {
            const fileId = produto.imagem.caminhoCloud || produto.imagem.url;
            imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        }
        if (imgEl) imgEl.src = imageUrl;

        const imgContainer = imgEl.parentElement;
        
        const semEstoque = produto.estoque === 0;
        const poucasUnidades = produto.estoque > 0 && produto.estoque <= corteBaixoEstoque;

        if (poucasUnidades) {
            const badge = document.createElement('span');
            badge.className = 'badge-estoque badge-ultimas';
            badge.textContent = 'Últimas unidades';
            imgContainer.appendChild(badge);
        }
        else if (semEstoque) {
            const badge = document.createElement('span');
            badge.className = 'badge-estoque badge-esgotado';
            badge.textContent = 'Esgotado';
            imgContainer.appendChild(badge);
        }

        const btnComprar = clone.querySelector('.buy-btn');
        if (btnComprar) {
            if (semEstoque) {
                btnComprar.disabled = true;
                btnComprar.textContent = "Indisponível";
                btnComprar.classList.add('buy-btn-disabled');
            } else {
                btnComprar.dataset.id = produto.id;
                btnComprar.dataset.nome = produto.nome;
                btnComprar.dataset.preco = produto.preco;
                btnComprar.dataset.imagem = imageUrl;
                btnComprar.dataset.estoque = produto.estoque;

                btnComprar.removeEventListener('click', handleBtnComprarClick);
                btnComprar.addEventListener('click', handleBtnComprarClick);
            }
        }

        grid.appendChild(clone);
    });
}

function inicializarPainelGerente() {
    const papelUsuario = localStorage.getItem('koridraws_user_role');
    const painelGerente = document.getElementById('gerente-panel');

    if (papelUsuario === 'Gerente' && painelGerente) {
        painelGerente.classList.remove('d-none');
        painelGerente.style.display = 'block'; // Fallback visual
    }

    const inputImagens = document.getElementById('novo-item-imagens');
    if (inputImagens) {
        inputImagens.removeEventListener('change', handleImagensChange);
        inputImagens.addEventListener('change', handleImagensChange);
    }

    const formNovoProduto = document.getElementById('form-novo-produto');
    if (formNovoProduto) {
        formNovoProduto.removeEventListener('submit', handleNovoProdutoSubmit);
        formNovoProduto.addEventListener('submit', handleNovoProdutoSubmit);
    }
}

document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);