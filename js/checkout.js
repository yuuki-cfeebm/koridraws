import { API_BASE_URL } from './config.js';
import { getCart, updateQuantity, removeFromCart, getCartItemHTML } from './cart.js'; // Importamos as funções lógicas

const token = localStorage.getItem('koridraws_token');

if (!token) {
  alert('Faça login para finalizar a sua compra.');
  window.location.href = '/assets/pages/auth.html';
}

const cartItemsContainer = document.getElementById('cart-items-container');
const checkoutTotalPrice = document.getElementById('checkout-total-price');
const selectEndereco = document.getElementById('checkout-endereco');
const formCheckout = document.getElementById('form-checkout');
const noAddressWarning = document.getElementById('no-address-warning');
const btnSubmitOrder = document.getElementById('btn-submit-order');

let cart = JSON.parse(localStorage.getItem('koridraws_cart')) || [];

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function renderCheckoutCart() {
  if (!cartItemsContainer || !checkoutTotalPrice) return;
  
  const cart = getCart(); 
  cartItemsContainer.innerHTML = '';
  let total = 0;

  // Verifica se o carrinho está vazio
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">O seu carrinho está vazio.</p>';
    if (checkoutTotalPrice) checkoutTotalPrice.textContent = 'R$ 0,00';
    if (document.getElementById('form-checkout')) document.getElementById('form-checkout').style.display = 'none';
    return;
  }

  // Renderiza usando o HTML compartilhado do cart.js
  cart.forEach(item => {
    total += item.preco * item.quantidade;
    
    // Injeta o HTML vindo do cart.js
    cartItemsContainer.insertAdjacentHTML('beforeend', getCartItemHTML(item));
  });

  // Atualiza o total
  checkoutTotalPrice.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

  // Re-atribui os eventos de clique aos botões que acabaram de ser injetados
  cartItemsContainer.querySelectorAll('.qtd-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // O botão plus ou minus dentro do cart-item
      const id = e.target.dataset.id;
      const delta = e.target.classList.contains('plus') ? 1 : -1;
      updateQuantity(id, delta); 
      renderCheckoutCart(); // Re-renderiza para atualizar quantidades e preços
    });
  });

  cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      removeFromCart(e.target.dataset.id); 
      renderCheckoutCart(); // Re-renderiza para remover o item da tela
    });
  });
}

async function loadEnderecos() {
  if (!selectEndereco || !formCheckout || !noAddressWarning) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/Perfil/GetProfile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('koridraws_token');
        window.location.href = '/assets/pages/auth.html';
      }
      throw new Error('Falha ao carregar o perfil');
    }

    const perfilText = await response.text();
    const perfil = perfilText ? JSON.parse(perfilText) : {};
    const enderecosData = perfil.dados?.enderecos || perfil.dados?.Enderecos || [];

    if (enderecosData.length === 0) {
      formCheckout.style.display = 'none';
      noAddressWarning.style.display = 'block';
    } else {
      selectEndereco.innerHTML = '<option value="" disabled selected>Selecione um endereço</option>';
      enderecosData.forEach(end => {
        const opt = document.createElement('option');
        opt.value = end.id || end.Id;
        opt.textContent = `${end.rua || end.Rua}, ${end.numero || end.Numero} - ${end.bairro || end.Bairro}`;
        selectEndereco.appendChild(opt);
      });
      formCheckout.style.display = 'grid';
      noAddressWarning.style.display = 'none';
    }

  } catch (error) {
    console.error(error);
  }
}

if (formCheckout) {
  formCheckout.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.length === 0) return;

    if (btnSubmitOrder) {
        btnSubmitOrder.disabled = true;
        btnSubmitOrder.textContent = 'A processar...';
    }

    const enderecoId = selectEndereco.value;
    const pagamento = document.getElementById('checkout-pagamento').value;

    const formData = new FormData();
    formData.append('EnderecoId', enderecoId);
    formData.append('Pagamento', pagamento);

    cart.forEach((item, index) => {
      formData.append(`Itens[${index}].itemId`, item.id);
      formData.append(`Itens[${index}].quantidade`, item.quantidade);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/Pedidos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao processar o pedido.');
      }

      localStorage.removeItem('koridraws_cart');
      alert('Pedido efetuado com sucesso!');
      window.location.href = '/assets/pages/perfil.html';

    } catch (error) {
      console.error(error);
      alert('Não foi possível finalizar a compra no momento. Tente novamente.');
      if (btnSubmitOrder) {
          btnSubmitOrder.disabled = false;
          btnSubmitOrder.textContent = 'Confirmar e Pagar';
      }
    }
  });
}

function initCheckout() {
  renderCheckoutCart();
  if (cart.length > 0) {
    loadEnderecos();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCheckout);
} else {
  initCheckout();
}