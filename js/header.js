import { initCartGlobal } from './cart.js';

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
