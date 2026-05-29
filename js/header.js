export function handleNavbarItem() {
  const navbarItems = document.querySelectorAll('.nav-item');

  if (navbarItems.length === 0) return;
  
  let currentPage = window.location.pathname.split('/').pop();
  console.log("Página atual lida pelo JS:", currentPage);
  
  // console.log(document.querySelector('.cart-btn'))

  if (currentPage === '' || currentPage === '/') {
    currentPage = 'index.html';
  }


  navbarItems.forEach(item => {
    item.classList.remove('active');

    const linkElement = item.querySelector('a');

    if (linkElement) {
      const linkHref = linkElement.getAttribute('href');
      
      if (linkHref) {
        if (linkHref === currentPage) {
          item.classList.add('active');
        } 
      }
    }
  });
}



window.addEventListener('DOMContentLoaded', () => {
  handleNavbarItem()
})