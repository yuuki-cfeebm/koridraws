import { handleNavbarItem } from './header.js';
import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';
import { updateCartBadge } from './cart.js';
import { updateHeaderGreeting } from './header.js'; 

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
        console.error(err);
      }
    }
  }
  
  handleNavbarItem();
  updateCartBadge();
  updateHeaderGreeting(); 
}
document.addEventListener('DOMContentLoaded', includeHTML);

async function loadBannerEvents() {
  const templateBanner = document.querySelector('.banner-template');
  const carousel = document.querySelector('.carousel');
  const divBullets = document.querySelector('.bullets');

  if (!templateBanner || !carousel) return;

  try {
    const response = await fetch(`${API_BASE_URL}/Eventos`);
    if (!response.ok) throw new Error();
    const eventos = await response.json();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextEvents = eventos
      .filter(e => new Date(e.data) >= today)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 3);

    if (nextEvents.length === 0) {
      const clone = templateBanner.content.cloneNode(true);
      clone.querySelector('.img-banner').src = '/assets/images/image.png'; 
      clone.querySelector('.img-banner').alt = 'Nenhum evento';
      clone.querySelector('.event-name-label').textContent = "Nenhum evento no momento";
      carousel.appendChild(clone);
      
      document.querySelector('.btn-carousel.next')?.style.setProperty('display', 'none');
      document.querySelector('.btn-carousel.back')?.style.setProperty('display', 'none');
      if (divBullets) divBullets.style.display = 'none';
      return;
    }

    nextEvents.forEach(event => {
      const clone = templateBanner.content.cloneNode(true);
      
      const imgUrl = event.imagens?.length > 0 
        ? `https://drive.google.com/thumbnail?id=${event.imagens[0].caminhoCloud}&sz=w800` 
        : '/assets/images/image.png';

      clone.querySelector('.img-banner').src = imgUrl;
      clone.querySelector('.img-banner').alt = event.nome;
      clone.querySelector('.event-name-label').textContent = event.nome;
      
      carousel.appendChild(clone);  
    });

    let currentIndex = 0;
    const totalImages = nextEvents.length;
    const dots = [];

    function updateCarousel() {
      const offset = -currentIndex * 100; 
      carousel.style.transform = `translateX(${offset}%)`;
      dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
    }

    function nextSlide() {
      currentIndex = (currentIndex < totalImages - 1) ? currentIndex + 1 : 0;
      updateCarousel();
    }

    let autoPlay = setInterval(nextSlide, 3000);

    const btnNextBanner = document.querySelector('.btn-carousel.next');
    const btnBackBanner = document.querySelector('.btn-carousel.back');

    btnNextBanner?.addEventListener('click', () => {
      currentIndex = (currentIndex < totalImages - 1) ? currentIndex + 1 : 0;
      updateCarousel();
      clearInterval(autoPlay);
      autoPlay = setInterval(nextSlide, 3000);
    });

    btnBackBanner?.addEventListener('click', () => {
      currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalImages - 1;
      updateCarousel();
      clearInterval(autoPlay);
      autoPlay = setInterval(nextSlide, 3000);
    });

    if(nextEvents.length > 0 && divBullets) {
      nextEvents.forEach((_, index) => {
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');
        bullet.addEventListener('click', () => {
          currentIndex = index;
          updateCarousel();
          clearInterval(autoPlay);
          autoPlay = setInterval(nextSlide, 3000);
        });
        divBullets.appendChild(bullet);
        dots.push(bullet);
      });
      updateCarousel();
    }
  } catch (err) {
    console.error(err);
  }
}

// const bannerText = [{ src: "/assets/images/image-teste1.png", text: "Bottons, Adesivos e Prints!", color: "000"}];
// const templateBannerText = document.querySelector('.section-template');
// const containerBannerText = document.querySelector('.banner-text');

// if (templateBannerText && containerBannerText) {
//   bannerText.forEach(item => {
//     const clone = templateBannerText.content.cloneNode(true);
//     clone.querySelector('.banner-content p').textContent = item.text;
//     clone.querySelector('.banner-text-img').src = item.src;
//     containerBannerText.appendChild(clone);
//   });
// }

async function loadHomeProductsAPI() {
  const templateCards = document.querySelector('.template-cards');
  const sectionNovidades = document.querySelector('#section-novidades');
  const sectionUltimas = document.querySelector('#section-ultimas');

  if (!templateCards) return;

  try {
    const response = await fetch(`${API_BASE_URL}/Itens`);
    if (!response.ok) throw new Error();

    const products = await response.json();
    const itensOrdenados = [...products].sort((a, b) => b.id - a.id);
    
    const novidades = itensOrdenados.slice(0, 4);
    const ultimas = itensOrdenados.filter(p => p.estoque > 0 && p.estoque < 5).slice(0, 4);
    
    if (novidades.length === 0) {
      sectionNovidades.style.display = 'none';
      const titleNovidades = sectionNovidades.previousElementSibling;
      if (titleNovidades && titleNovidades.tagName === 'H2') titleNovidades.style.display = 'none';
    } else {
      renderProductList(sectionNovidades, novidades, templateCards);
    }

    if (ultimas.length === 0) {
      sectionUltimas.style.display = 'none';
      const titleUltimas = sectionUltimas.previousElementSibling;
      if (titleUltimas && titleUltimas.tagName === 'H2') titleUltimas.style.display = 'none';
    } else {
      renderProductList(sectionUltimas, ultimas, templateCards);
    }

    // ... seu código do discountProducts.forEach(...) ...

    // --- NOVA LÓGICA DO CARROSSEL DE PRODUTOS ---
    const cardsContainer = document.querySelector('#section-discount'); 
    const productCarousel = document.querySelector('.container-product-carousel');
    const btnNextProduct = productCarousel.querySelector('.next.btn-product');
    const btnBackProduct = productCarousel.querySelector('.back.btn-product');

    // Define o quanto a tela vai rolar para o lado a cada clique (ex: 300 pixels)
    // Você pode ajustar esse valor para o tamanho exato do seu card!
    const scrollAmount = 377; 

    btnNextProduct?.addEventListener('click', () => {
      cardsContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    btnBackProduct?.addEventListener('click', () => {
      cardsContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

  } catch (error) {
    console.error(error);
  }
}

function renderProductList(container, productsList, template) {
  if (!container) return;
  container.innerHTML = '';

  productsList.forEach(produto => {
    const clone = template.content.cloneNode(true);

    clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`;
    clone.querySelector('.card-text h2').textContent = produto.nome;
    clone.querySelector('.currently-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
    
    const imgEl = clone.querySelector('.img-card');
    let imageUrl = '/assets/images/image.png';
    if (produto.imagens && produto.imagens.length > 0) {
      imageUrl = `https://drive.google.com/thumbnail?id=${produto.imagens[0].caminhoCloud}&sz=w800`;
    }
    imgEl.src = imageUrl;

    const imgContainer = imgEl.parentElement;
    imgContainer.style.position = 'relative';

    if (produto.estoque === 0) {
      const badge = document.createElement('span');
      badge.className = 'badge-estoque badge-esgotado';
      badge.textContent = 'Esgotado';
      imgContainer.appendChild(badge);
    } else if (produto.estoque < 5) {
      const badge = document.createElement('span');
      badge.className = 'badge-estoque badge-ultimas';
      badge.textContent = 'Últimas unidades';
      imgContainer.appendChild(badge);
    }

    const btnComprar = clone.querySelector('.buy-btn');
    if (btnComprar) {
      if (produto.estoque === 0) {
        btnComprar.disabled = true;
        btnComprar.textContent = "Indisponível";
        btnComprar.style.backgroundColor = "#ccc";
        btnComprar.style.cursor = "not-allowed";
        btnComprar.style.color = "#666";
      } else {
        btnComprar.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          addToCart({ 
            id: produto.id, 
            nome: produto.nome, 
            preco: produto.preco, 
            imagem: imageUrl,
            estoque: produto.estoque,
            quantidade: 1
          });
        });
      }
    }

    container.appendChild(clone);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadBannerEvents();
  loadHomeProductsAPI();
});