import { handleNavbarItem, handleUserAuthMenu } from './header.js';
import { initCartGlobal } from './cart.js';

async function includeHTML() {
  const components = [
    { id: 'header-placeholder', url: '/assets/components/header.html' },
    { id: 'footer-placeholder', url: '/assets/components/footer.html'},
    { id: 'navbar-placeholder', url: '/assets/components/navbar.html'} 
  ];

  for (const comp of components) {
    const placeholder = document.getElementById(comp.id);
    if (placeholder) {
      try {
        const response = await fetch(comp.url);
        if (response.ok) {
          const html = await response.text();
          placeholder.innerHTML = html;
        }
      } catch (err) {
        console.error("Erro ao carregar componente:", err);
      }
    }
  }
  
  // Só inicializa o cabeçalho e o carrinho DEPOIS de o HTML ser injetado
  if (typeof handleNavbarItem === 'function') handleNavbarItem();
  if (typeof handleUserAuthMenu === 'function') handleUserAuthMenu();
  if (typeof initCartGlobal === 'function') initCartGlobal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', includeHTML);
} else {
  includeHTML();
}