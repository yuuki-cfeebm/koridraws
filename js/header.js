import { initCartGlobal } from './cart.js';
import { API_BASE_URL } from './config.js';

export function handleNavbarItem() {
  const navbarItems = document.querySelectorAll('.nav-item');
  
  if (navbarItems.length === 0) return;
  
  let currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage === '' || currentPage === '/' || currentPage === 'index.html' || currentPage === '/assets/pages/home.html') {
    currentPage = '/assets/pages/home.html';
  }

  navbarItems.forEach(item => {
    item.classList.remove('active');

    const linkElement = item.querySelector('a');

    if (linkElement) {
      const linkHref = linkElement.getAttribute('href');
      
      if (linkHref && linkHref.endsWith(currentPage)) {
        item.classList.add('active');
      }
    }
  });
}

export function handleUserAuthMenu() {
  document.addEventListener('click', (event) => {
    const btnAccount = event.target.closest('.action-btn[aria-label="Minha Conta"]');
    const dropdown = document.getElementById('user-dropdown');
    const menuContainer = event.target.closest('.user-menu-container');

    if (!menuContainer && dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
      return;
    }

    if (btnAccount && dropdown) {
      event.preventDefault();
      const isShowing = dropdown.classList.contains('show');
      
      if (!isShowing) {
        const token = localStorage.getItem('koridraws_token');
        const userRole = localStorage.getItem('koridraws_user_role');
        
     if (!token) {
  dropdown.innerHTML = `
    <a href="/assets/pages/auth.html">Entrar</a>
    <a href="/assets/pages/auth.html">Criar Conta</a>
  `;
} else if (userRole === 'Gerente') {
  dropdown.innerHTML = `
    <a href="/assets/pages/manage.html">Gerir Pedidos</a>
    <button id="btn-logoff" style="width: 100%; text-align: left; background: none; border: none; padding: 10px 16px; cursor: pointer; font-family: inherit; font-size: inherit; color: #c0392b; font-weight: bold;">Sair</button>
  `;
} else {
  dropdown.innerHTML = `
    <a href="/assets/pages/perfil.html">Meu Perfil</a>
    <button id="btn-logoff" style="width: 100%; text-align: left; background: none; border: none; padding: 10px 16px; cursor: pointer; font-family: inherit; font-size: inherit;">Sair</button>
  `;
}

        if (token) {
          setTimeout(() => {
            const btnLogoff = document.getElementById('btn-logoff');
            if (btnLogoff) {
              btnLogoff.addEventListener('click', () => {
                localStorage.removeItem('koridraws_token');
                localStorage.removeItem('koridraws_user_name');
                localStorage.removeItem('koridraws_user_role');
                window.location.href = '/index.html';
              });
            }
          }, 0);
        }
      }
      
      dropdown.classList.toggle('show');
    }
  });
}

export async function updateHeaderGreeting() {
  const greetingElement = document.getElementById('header-user-greeting');
  
  if (!greetingElement) {
    return;
  }

  const token = localStorage.getItem('koridraws_token');

  if (!token) {
    greetingElement.innerHTML = '<a href="/assets/pages/auth.html" style="text-decoration: none; color: inherit;">Entre ou Cadastre-se</a>';
    return;
  }

  let userName = localStorage.getItem('koridraws_user_name');
  let userRole = localStorage.getItem('koridraws_user_role');

  if (!userName || userName === "undefined" || userName === "null" || !userRole) {
    try {
      const response = await fetch(`${API_BASE_URL}/Perfil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const fullName = data.perfil?.nome || '';
        userName = fullName.split(' ')[0];
        userRole = data.perfil?.papel || 'Cliente';
        
        if (userName) {
          localStorage.setItem('koridraws_user_name', userName);
          localStorage.setItem('koridraws_user_role', userRole);
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem('koridraws_token');
          localStorage.removeItem('koridraws_user_name');
          localStorage.removeItem('koridraws_user_role');
          greetingElement.innerHTML = '<a href="/assets/pages/auth.html" style="text-decoration: none; color: inherit;">Entre ou Cadastre-se</a>';
          return;
        }
      }
    } catch (error) {
      console.error("[Header] Erro de conexão ao buscar perfil:", error);
    }
  }

  if (userName && userName !== "undefined" && userName !== "null") {
    greetingElement.textContent = `Olá, ${userName}!`;
  } else {
    greetingElement.textContent = "Olá!";
  }

  ajustarInterfaceGerente();
}

export function ajustarInterfaceGerente() {
  const papel = localStorage.getItem('koridraws_user_role');

  if (papel === 'Gerente') {
    const carrinhoNavBtns = document.querySelectorAll('.cart-btn, [aria-label="Carrinho"]');
    carrinhoNavBtns.forEach(btn => {
        btn.style.display = 'none';
    });
  }
}

function initHeader() {
  handleNavbarItem();
  handleUserAuthMenu();
  updateHeaderGreeting();
  initCartGlobal();
  ajustarInterfaceGerente();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}