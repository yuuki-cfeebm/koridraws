import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let todosProdutos = [];
let produtosFiltradosAtuais = [];
let paginaAtual = 1;
const produtosPorPagina = 12;
async function loadProducts() {
    const spinner = document.getElementById('loading-spinner');
    
    try {
        const response = await fetch(`${API_BASE_URL}/Itens`);
        if (!response.ok) {
            throw new Error();
        }
        
        let produtosDaApi = await response.json();
        
        produtosDaApi.sort((a, b) => {
            const getPrioridade = (p) => {
                if (p.estoque === 0) return 3;
                if (p.estoque > 0 && p.estoque < 5) return 1;
                return 2;
            };

            const prioA = getPrioridade(a);
            const prioB = getPrioridade(b);

            if (prioA !== prioB) {
                return prioA - prioB;
            }

            if (prioA === 1) {
                if (a.estoque !== b.estoque) {
                    return a.estoque - b.estoque;
                }
            }

            return b.id - a.id;
        });

        todosProdutos = produtosDaApi;
        produtosFiltradosAtuais = [...todosProdutos];

        if (spinner) {
            spinner.style.display = 'none';
        }
        
        renderizarPaginaAtual();
        setupFilters();

    } catch (error) {
        if (spinner) {
            spinner.textContent = "Não foi possível carregar os produtos no momento.";
            spinner.style.color = "#c0392b";
        }
    }
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
            // Mantive os estilos do container pois são de layout, não visuais
            paginationContainer.style.display = 'flex';
            paginationContainer.style.justifyContent = 'center';
            paginationContainer.style.gap = '8px';
            paginationContainer.style.marginTop = '32px';
            paginationContainer.style.width = '100%';
            paginationContainer.style.gridColumn = '1 / -1';
            grid.parentNode.insertBefore(paginationContainer, grid.nextSibling);
        } else {
            return;
        }
    }

    paginationContainer.innerHTML = '';
    const totalPaginas = Math.ceil(produtosFiltradosAtuais.length / produtosPorPagina);

    if (totalPaginas <= 1) return;

    // Botão Anterior
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

    // Botões Numerados
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

    // Botão Próximo
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

function renderProducts(listaParaRenderizar) {
    const grid = document.getElementById('products-grid');
    const template = document.getElementById('product-card-template');

    if (!grid || !template) return;

    grid.innerHTML = '';

    if (listaParaRenderizar.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1 / -1; font-family: var(--font-body); margin-top: 40px;">Nenhum produto encontrado nesta categoria.</p>';
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
        
        if (produto.imagens && produto.imagens.length > 0) {
            const fileId = produto.imagens[0].caminhoCloud || produto.imagens[0].url;
            imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        }
        if (imgEl) imgEl.src = imageUrl;

        const imgContainer = imgEl.parentElement; 
        imgContainer.style.position = 'relative';

        if (produto.estoque === 0) {
            const badge = document.createElement('span');
            badge.className = 'badge-estoque badge-esgotado';
            badge.textContent = 'Esgotado';
            imgContainer.appendChild(badge);
        } else if (produto.estoque < 5) {
            const badge = document.createElement('span');
            badge.className = 'badge-estoque badge-ultimas';
            badge.textContent = 'Últimas unidades';
            imgContainer.appendChild(badge);
        }

        const btnComprar = clone.querySelector('.buy-btn');
        if (btnComprar) {
            if (produto.estoque === 0) {
                btnComprar.disabled = true;
                btnComprar.textContent = "Indisponível";
                btnComprar.style.backgroundColor = "#ccc";
                btnComprar.style.cursor = "not-allowed";
                btnComprar.style.color = "#666";
            } else {
                btnComprar.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    addToCart({
                        id: produto.id,
                        nome: produto.nome,
                        preco: produto.preco,
                        imagem: imageUrl,
                        estoque: produto.estoque,
                        quantidade: 1
                    });
                });
            }
        }

        grid.appendChild(clone);
    });
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            
            // Retorna à página 1 sempre que o filtro muda
            paginaAtual = 1; 
            
            if (category === 'Todos') {
                produtosFiltradosAtuais = [...todosProdutos];
            } else {
                produtosFiltradosAtuais = todosProdutos.filter(produto => 
                    produto.nome.toLowerCase().includes(category.toLowerCase())
                );
            }
            
            renderizarPaginaAtual();
        });
    });
}

function inicializarPainelGerente() {
    const papelUsuario = localStorage.getItem('koridraws_user_role');
    const painelGerente = document.getElementById('gerente-panel');

    if (papelUsuario === 'Gerente' && painelGerente) {
        painelGerente.style.display = 'block';
    }

    const formNovoProduto = document.getElementById('form-novo-produto');
    const inputImagens = document.getElementById('novo-item-imagens');
    const msgContainer = document.getElementById('msg-novo-produto');
    
    if (inputImagens) {
        inputImagens.addEventListener('change', (e) => {
            if (e.target.files.length > 4) {
                if (msgContainer) {
                    msgContainer.textContent = "Por favor, selecione no máximo 4 imagens.";
                    msgContainer.style.color = "#c0392b";
                }
                e.target.value = '';
            } else {
                if (msgContainer) {
                    msgContainer.textContent = "";
                }
            }
        });
    }
    
    if (formNovoProduto) {
        formNovoProduto.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (inputImagens && inputImagens.files.length > 4) {
                if (msgContainer) {
                    msgContainer.textContent = "Por favor, selecione no máximo 4 imagens.";
                    msgContainer.style.color = "#c0392b";
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
            if (msgContainer) msgContainer.textContent = "";

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
                        msgContainer.style.color = "#27ae60";
                    }
                    formNovoProduto.reset();
                    
                    loadProducts();
                } else {
                    throw new Error("Erro na resposta do servidor.");
                }
            } catch (error) {
                if (msgContainer) {
                    msgContainer.textContent = "Erro ao cadastrar o produto. Verifique os dados ou as suas permissões.";
                    msgContainer.style.color = "#c0392b";
                }
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Salvar Novo Produto";
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    inicializarPainelGerente();
});