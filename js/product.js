import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let todosProdutos = [];

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

    if (spinner) {
      spinner.style.display = 'none';
    }
    
    renderProducts(todosProdutos);
    setupFilters();

  } catch (error) {
    if (spinner) {
      spinner.textContent = "Não foi possível carregar os produtos no momento.";
      spinner.style.color = "#c0392b";
    }
  }
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
      
      if (category === 'Todos') {
        renderProducts(todosProdutos);
      } else {
        const produtosFiltrados = todosProdutos.filter(produto => 
          produto.nome.toLowerCase().includes(category.toLowerCase())
        );
        renderProducts(produtosFiltrados);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', loadProducts);