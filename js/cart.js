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
        // overlay.style.display = "none"

      }

    // })
  });
}

window.addEventListener('DOMContentLoaded', () => {
  handleCartModal();
});