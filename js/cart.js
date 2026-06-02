export function handleAddtoCart(produto) {
  let carrinho = lerCarrinho();
  let index = carrinho.findIndex(item => item.id === produto.id);

  if (index !== -1) {
      carrinho[index].quantidade += 1;
  } else {
      produto.quantidade = 1;
      carrinho.push(produto); 
  }
  salvarCarrinho(carrinho); 

  const template = document.querySelector('#template-cart');
  const cartContainer = document.querySelector('.cart-content');

  const cloneCartItem = template.content.cloneNode(true);

  const btnMinus = cloneCartItem.querySelector('.btn-minus');
  const btnPlus = cloneCartItem.querySelector('.btn-plus');
  const spanQtd = cloneCartItem.querySelector('.item-qtd');

  spanQtd.textContent = produto.quantidade || 1; 

  btnPlus.addEventListener('click', () => {
      let carrinhoAtual = lerCarrinho();
      let idx = carrinhoAtual.findIndex(item => item.id === produto.id);
      if (idx !== -1) {
          carrinhoAtual[idx].quantidade += 1;
          spanQtd.textContent = carrinhoAtual[idx].quantidade;
          salvarCarrinho(carrinhoAtual);
      }
  });

  btnMinus.addEventListener('click', () => {
      let carrinhoAtual = lerCarrinho();
      let idx = carrinhoAtual.findIndex(item => item.id === produto.id);
      if (idx !== -1 && carrinhoAtual[idx].quantidade > 1) {
          carrinhoAtual[idx].quantidade -= 1;
          spanQtd.textContent = carrinhoAtual[idx].quantidade;
          salvarCarrinho(carrinhoAtual);
      }
  });

  cloneCartItem.querySelector('.cart-item-title').textContent = produto.nome;
  cloneCartItem.querySelector('.cart-item-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
  
  const imgEl = cloneCartItem.querySelector('.cart-img-item');
  if (produto.imagens && produto.imagens.length > 0) {
      imgEl.src = `https://drive.google.com/thumbnail?id=${produto.imagens[0].caminhoCloud}&sz=w400`;
  }

  cartContainer.appendChild(cloneCartItem);
}

export function handleCartModal() {
  // Tiramos os querySelectors daqui de cima!

  document.addEventListener('click', (event) => {
    
    const btnCartOpen = event.target.closest('.cart-btn');
    const btnCartClose = event.target.closest('.cart-btn-close');
    const overlayClick = event.target.matches('.overlay');

    if (btnCartOpen || btnCartClose || overlayClick) {
      
      const modalCart = document.querySelector('.cart-modal');
      const overlay = document.querySelector('.overlay');
      
      if (!modalCart || !overlay) return;

      if (btnCartOpen) {
        modalCart.style.transform = "translateX(0%)";
        overlay.classList.add('overlay-active');
      }

      if (btnCartClose || overlayClick) {
        modalCart.style.transform = "translateX(100%)";
        overlay.classList.remove('overlay-active');
      }
    }
  });
}

// Cole isso no final do seu cart.js
export function lerCarrinho() {
  const carrinhoSalvo = localStorage.getItem('meuCarrinho');
  return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
}

export function salvarCarrinho(carrinho) {
  localStorage.setItem('meuCarrinho', JSON.stringify(carrinho));
  atualizarBadge();
}

export function atualizarBadge() {
  const badge = document.querySelector('.cart-badge');
  const carrinho = lerCarrinho();
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  if (badge) badge.textContent = totalItens;
}