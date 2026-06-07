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
        
        if (!token) {
          dropdown.innerHTML = `
            <a href="/assets/pages/auth.html">Entrar</a>
            <a href="/assets/pages/auth.html">Criar Conta</a>
          `;
        } else {
          dropdown.innerHTML = `
            <a href="/assets/pages/perfil.html">Meu Perfil</a>
            <button id="btn-logoff">Sair</button>
          `;
          
          setTimeout(() => {
            const btnLogoff = document.getElementById('btn-logoff');
            if (btnLogoff) {
              btnLogoff.addEventListener('click', () => {
                localStorage.removeItem('koridraws_token');
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
  
  // Se o elemento não existir na tela, aborta a função (evita erros invisíveis)
  if (!greetingElement) {
    console.warn("[Header] Elemento #header-user-greeting não foi encontrado.");
    return;
  }

  const token = localStorage.getItem('koridraws_token');

  // Se não houver token, mostra o link para login
  if (!token) {
    greetingElement.innerHTML = '<a href="/assets/pages/auth.html" style="text-decoration: none; color: inherit;">Entre ou Cadastre-se</a>';
    return;
  }

  let userName = localStorage.getItem('koridraws_user_name');

  // Verifica se o nome não existe ou se foi salvo incorretamente como a string "undefined"
  if (!userName || userName === "undefined" || userName === "null") {
    try {
      console.log("[Header] Buscando dados do perfil na API...");
      const response = await fetch(`${API_BASE_URL}/Perfil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Header] Dados recebidos da API:", data);
        
        // Navega até o nome dentro do objeto perfil retornado pelo seu JSON
        const fullName = data.perfil?.nome || '';
        userName = fullName.split(' ')[0]; // Pega apenas o primeiro nome
        
        if (userName) {
          localStorage.setItem('koridraws_user_name', userName);
        }
      } else {
        console.warn("[Header] Token inválido ou expirado. Status:", response.status);
        if (response.status === 401) {
          localStorage.removeItem('koridraws_token');
          localStorage.removeItem('koridraws_user_name');
          greetingElement.innerHTML = '<a href="/assets/pages/auth.html" style="text-decoration: none; color: inherit;">Entre ou Cadastre-se</a>';
          return;
        }
      }
    } catch (error) {
      console.error("[Header] Erro de conexão ao buscar perfil:", error);
    }
  }

  // Define a mensagem final
  if (userName && userName !== "undefined" && userName !== "null") {
    greetingElement.textContent = `Olá, ${userName}!`;
  } else {
    greetingElement.textContent = "Olá!";
  }
}
function initHeader() {
  handleNavbarItem();
  handleUserAuthMenu();
  initCartGlobal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}
