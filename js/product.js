import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let todosProdutos = [];

async function loadProducts() {
  const spinner = document.getElementById('loading-spinner');
  try {
    const response = await fetch(`${API_BASE_URL}/Itens`);
    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }
    todosProdutos = await response.json();
    if (spinner) {
      spinner.style.display = 'none';
    }
    renderProducts(todosProdutos);
    setupFilters();
  } catch (error) {
    console.error(error);
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

  listaParaRenderizar.forEach(produto => {
    const clone = template.content.cloneNode(true);

    clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`;
    clone.querySelector('.product-title').textContent = produto.nome;

    const priceEl = clone.querySelector('.currently-price');
    priceEl.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

    const imgEl = clone.querySelector('.img-card');
    let imageUrl = '/assets/images/image.png';

    if (produto.imagens && produto.imagens.length > 0) {
      const fileId = produto.imagens[0].caminhoCloud;
      imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }

    imgEl.src = imageUrl;

    const btnComprar = clone.querySelector('.buy-btn');
    if (btnComprar) {
      btnComprar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          imagem: imageUrl
        });
      });
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