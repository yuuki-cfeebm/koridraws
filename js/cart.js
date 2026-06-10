export function initCartElements() {
  let overlay = document.querySelector('.overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
  }

  let modalCart = document.querySelector('.cart-modal');
  if (!modalCart) {
    modalCart = document.createElement('div');
    modalCart.className = 'cart-modal';
    document.body.appendChild(modalCart);
  }
}

export function handleCartModal() {
  document.addEventListener('click', (event) => {
    const btnCartOpen = event.target.closest('.cart-btn');
    const btnCartClose = event.target.closest('.cart-btn-close');
    const overlayClick = event.target.matches('.overlay');
    const modalCart = document.querySelector('.cart-modal');
    const overlay = document.querySelector('.overlay');

    if (btnCartOpen) {
      event.preventDefault(); 
      if (modalCart) {
        modalCart.style.transform = "translateX(0%)";
        if (overlay) overlay.classList.add('overlay-active');
        renderCartModal();
      }
    }

    if (btnCartClose || overlayClick) {
      if (modalCart) {
        modalCart.style.transform = "translateX(100%)";
        if (overlay) overlay.classList.remove('overlay-active');
      }
    }
  });
}

export function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem('koridraws_cart')) || [];
  
  const existingItemIndex = cart.findIndex(cartItem => (cartItem.id || cartItem.Id).toString() === (item.id || item.Id).toString());
  const quantidadePedida = item.quantidade ? parseInt(item.quantidade) : 1;
  let quantidadePossivel = quantidadePedida;
  let estoqueInsuficiente = false;

  if (existingItemIndex > -1) {
    const quantidadeAtualNoCarrinho = cart[existingItemIndex].quantidade;
    const espacoDisponivel = item.estoque - quantidadeAtualNoCarrinho;

    if (espacoDisponivel <= 0) {
      showToast(`Estoque insuficiente.`, "#c0392b");
      return;
    }

    if (quantidadePedida > espacoDisponivel) {
      quantidadePossivel = espacoDisponivel;
      estoqueInsuficiente = true;
    }

    cart[existingItemIndex].quantidade += quantidadePossivel;
    cart[existingItemIndex].estoque = item.estoque; 
  } else {
    if (quantidadePedida > item.estoque) {
      quantidadePossivel = item.estoque;
      estoqueInsuficiente = true;
    }

    cart.push({
      id: item.id || item.Id,
      nome: item.nome || item.Nome,
      preco: item.preco || item.Preco,
      imagem: item.imagem || item.Imagem,
      quantidade: quantidadePossivel,
      estoque: item.estoque 
    });
  }
  
  localStorage.setItem('koridraws_cart', JSON.stringify(cart));

  const nomeItem = item.nome || item.Nome;

  if (estoqueInsuficiente) {
    if(quantidadePossivel > 1)
    showToast(`Estoque parcialmente insuficiente. ${quantidadePossivel} ${nomeItem} foram adicionados ao carrinho.`, "#e7c738");
  else
    showToast(`Estoque parcialmente insuficiente. 1 ${nomeItem} foi adicionados ao carrinho.`, "#e7c738");
  } else {

    showToast(`${quantidadePossivel}x ${nomeItem} adicionado(s)!`, "#27ae60");
  }
  
  if (typeof renderCartModal === 'function') {
    renderCartModal();
  }
}

export function updateQuantity(id, delta) {
  let cart = getCart();
  const index = cart.findIndex(item => item.id.toString() === id.toString());
  
  if (index > -1) {
    const novaQuantidade = cart[index].quantidade + delta;

    // Validação ao clicar no botão "+" dentro do carrinho
    if (delta > 0 && novaQuantidade > cart[index].estoque) {
      showToast(`Você atingiu o limite de estoque deste item.`, "#c0392b");
      return;
    }

    cart[index].quantidade = novaQuantidade;
    
    if (cart[index].quantidade <= 0) {
      cart.splice(index, 1);
    }
    
    localStorage.setItem('koridraws_cart', JSON.stringify(cart));
    renderCartModal();
  }
}

export function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id.toString() !== id.toString());
  localStorage.setItem('koridraws_cart', JSON.stringify(cart));
  renderCartModal();
}

function showToast(message, color = "#c0392b") {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  
    toast.style.backgroundColor = color;
    toast.style.color = "#fff";

  
  toast.classList.remove('show');
  void toast.offsetWidth; 
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

export function getCart() {
  return JSON.parse(localStorage.getItem('koridraws_cart')) || [];
}

export function clearCart() {
  localStorage.removeItem('koridraws_cart');
  renderCartModal();
}

export function renderCartModal() {
  const modalCart = document.querySelector('.cart-modal');
  if (!modalCart) return;

  let cartContainer = modalCart.querySelector('.cart-items-list');
  let totalContainer = modalCart.querySelector('.cart-total-info');

  if (!cartContainer) {
    modalCart.innerHTML = `
      <div class="cart-header" style="display:flex; justify-content:space-between; align-items:center; padding: 24px; border-bottom: 2px solid #000;">
        <h2 style="font-family: var(--font-display); font-size: 24px; color: var(--text-title);">Meu Carrinho</h2>
        <button class="cart-btn-close" style="background:none; border:none; font-size: 24px; font-weight:bold; cursor:pointer; color: var(--text-title);">&times;</button>
      </div>
      <div class="cart-items-list" style="display:flex; flex-direction:column; gap: 16px; padding: 24px; flex-grow: 1; overflow-y: auto;"></div>
      <div class="cart-footer" style="padding: 24px; border-top: 2px solid #000; background: #fff;">
        <div class="cart-total-info" style="display:flex; justify-content:space-between; font-family: var(--font-display); font-weight:900; font-size: 20px; margin-bottom: 24px; color: var(--text-title);"></div>
        <a href="/assets/pages/checkout.html" class="buy-btn" style="text-align:center; display:block; width: 100%; text-decoration: none;">Finalizar Compra</a>
      </div>
    `;
    cartContainer = modalCart.querySelector('.cart-items-list');
    totalContainer = modalCart.querySelector('.cart-total-info');
  }

  const cart = getCart();
  cartContainer.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="font-family: var(--font-body); color: var(--text-primary); text-align: center; margin-top: 40px;">O seu carrinho está vazio.</p>';
    totalContainer.innerHTML = '';
    updateCartBadge();
    return;
  }

  cart.forEach(item => {
    total += item.preco * item.quantidade;
    const formatPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco);
    
    cartContainer.innerHTML += `
      <div class="cart-item" style="display:flex; gap: 16px; border: 2px solid #e0e0e0; padding: 12px; border-radius: 8px;">
        <img src="${item.imagem || '/assets/images/image.png'}" alt="${item.nome}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #000;">
        
        <div style="flex:1; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display:flex; justify-content:space-between; align-items: flex-start;">
            <p style="font-weight:700; font-size: 14px; font-family: var(--font-body); color: var(--text-primary); margin-bottom: 4px;">${item.nome}</p>
            <button class="remove-item-btn" data-id="${item.id}" style="color: #c0392b; background:none; border:none; font-size:18px; font-weight:bold; cursor:pointer; padding:0; line-height: 1;">&times;</button>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items: center; margin-top: 8px;">
            <p style="font-weight:700; font-family: var(--font-body); color: var(--text-title);">${formatPrice}</p>
            
            <div style="display:flex; align-items: center; border: 1px solid #000; border-radius: 4px; overflow: hidden;">
              <button class="qtd-btn minus" data-id="${item.id}" style="background:#f0f0f0; border:none; border-right:1px solid #000; padding: 4px 10px; cursor:pointer; font-weight:bold;">-</button>
              <span style="padding: 0 12px; font-family: var(--font-body); font-size: 14px; font-weight: 700;">${item.quantidade}</span>
              <button class="qtd-btn plus" data-id="${item.id}" style="background:#f0f0f0; border:none; border-left:1px solid #000; padding: 4px 10px; cursor:pointer; font-weight:bold;">+</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  totalContainer.innerHTML = `
    <span>Total:</span>
    <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
  `;

  modalCart.querySelectorAll('.qtd-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const delta = e.target.classList.contains('plus') ? 1 : -1;
      updateQuantity(id, delta);
    });
  });

  modalCart.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeFromCart(e.target.dataset.id);
    });
  });

  updateCartBadge();
}

export function getCartItemHTML(item) {
  const formatPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco);
  
  return `
    <div class="cart-item" style="display:flex; gap: 16px; border: 2px solid #e0e0e0; padding: 12px; border-radius: 8px;">
      <img src="${item.imagem || '/assets/images/image.png'}" alt="${item.nome}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid #000;">
      
      <div style="flex:1; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="display:flex; justify-content:space-between; align-items: flex-start;">
          <p style="font-weight:700; font-size: 14px; font-family: var(--font-body); color: var(--text-primary); margin-bottom: 4px;">${item.nome}</p>
          <button class="remove-item-btn" data-id="${item.id}" style="color: #c0392b; background:none; border:none; font-size:18px; font-weight:bold; cursor:pointer; padding:0; line-height: 1;">&times;</button>
        </div>
        
        <div style="display:flex; justify-content:space-between; align-items: center; margin-top: 8px;">
          <p style="font-weight:700; font-family: var(--font-body); color: var(--text-title);">${formatPrice}</p>
          
          <div style="display:flex; align-items: center; border: 1px solid #000; border-radius: 4px; overflow: hidden;">
            <button class="qtd-btn minus" data-id="${item.id}" style="background:#f0f0f0; border:none; border-right:1px solid #000; padding: 4px 10px; cursor:pointer; font-weight:bold;">-</button>
            <span style="padding: 0 12px; font-family: var(--font-body); font-size: 14px; font-weight: 700;">${item.quantidade}</span>
            <button class="qtd-btn plus" data-id="${item.id}" style="background:#f0f0f0; border:none; border-left:1px solid #000; padding: 4px 10px; cursor:pointer; font-weight:bold;">+</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  if (badges.length === 0) return;

  const cart = getCart();
  
  const totalItens = cart.reduce((total, item) => total + (item.quantidade || 1), 0);

  badges.forEach(badge => {
    badge.textContent = totalItens;
    
    badge.style.display = totalItens > 0 ? 'flex' : 'none';
  });
}

export function initCartGlobal() {
  initCartElements();
  handleCartModal();
  renderCartModal();
}