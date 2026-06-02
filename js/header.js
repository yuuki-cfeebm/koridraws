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

function handleCartModal() {
  const modalCart = document.querySelector('.cart-modal');
  const overlay = document.querySelector('.overlay')
  
  document.addEventListener('click', (event) => {
    
    const btnCartOpen = event.target.closest('.cart-btn');
    const btnCartClose = event.target.closest('.cart-btn-close');
    const overlayClick = event.target.matches('.overlay')
    if (btnCartOpen) {
      if (!modalCart) return;
      
      modalCart.style.transform = "translateX(0%)";
      overlay.classList.add('overlay-active')
      // overlay.style.display = "block"
    }

    if(!btnCartClose) return

      if(btnCartClose || overlayClick) {

        modalCart.style.transform = "translateX(100%)"
        overlay.classList.remove('overlay-active')
      }

    // })
  });
}

window.addEventListener('DOMContentLoaded', () => {
  handleCartModal();
  handleNavbarItem()
});