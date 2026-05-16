export function handleNavbarItem() {
  const navbarItems = document.querySelectorAll('.nav-item');

  // 1. Correção: Só para a função se a lista estiver VAZIA
  if (navbarItems.length === 0) return;
  
  // 2. Pega o nome do arquivo atual (ex: "agenda.html")
  let currentPage = window.location.pathname.split('/').pop();
  console.log("Página atual lida pelo JS:", currentPage);

  // 3. Ajuste da Home: Se a URL estiver vazia (ex: localhost:5500/pages/), 
  // forçamos o JS a entender que estamos na home.html
  if (currentPage === '' || currentPage === '/') {
    currentPage = 'home.html';
  }

  navbarItems.forEach(item => {
    // Tira o active de todo mundo
    item.classList.remove('active');

    // 4. Correção: Usa "item." em vez de "document." para olhar só dentro desta <li>
    const linkElement = item.querySelector('a');

    if (linkElement) {
      // Pega o que está escrito no href (ex: "home.html", "agenda.html")
      const linkHref = linkElement.getAttribute('href');
      
      if (linkHref) {
        // Se bater com a página, brilha!
        if (linkHref === currentPage) {
          item.classList.add('active');
        } 
      }
    }
  });
}