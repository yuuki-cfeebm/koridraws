import { handleNavbarItem } from './header.js';
import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

// --- CONFIGURAÇÃO DE COMPONENTES ---
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
  handleNavbarItem();
}
document.addEventListener('DOMContentLoaded', includeHTML);

async function loadBannerEvents() {
  const templateBanner = document.querySelector('.banner-template');
  const carousel = document.querySelector('.carousel');
  const divBullets = document.querySelector('.bullets');

  if (!templateBanner || !carousel) return;

  try {
    const response = await fetch(`${API_BASE_URL}/Eventos`);
    if (!response.ok) throw new Error("Erro ao buscar eventos");
    const eventos = await response.json();
    
    // 1. Filtrar apenas eventos futuros e ordenar por data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextEvents = eventos
      .filter(e => new Date(e.data) >= today)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 3);

    // 2. Fallback caso não existam eventos
    if (nextEvents.length === 0) {
      const clone = templateBanner.content.cloneNode(true);
      clone.querySelector('.img-banner').src = '/assets/images/image.png'; // Imagem padrão
      clone.querySelector('.img-banner').alt = 'Nenhum evento';
      // Texto alterado conforme solicitado:
      clone.querySelector('.event-name-label').textContent = "Nenhum evento no momento";
      carousel.appendChild(clone);
      
      // Esconder controles pois não há slides para deslizar
      document.querySelector('.btn-carousel.next')?.style.setProperty('display', 'none');
      document.querySelector('.btn-carousel.back')?.style.setProperty('display', 'none');
      if (divBullets) divBullets.style.display = 'none';
      return;
    }

    // 3. Renderização Normal
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

    // 4. Lógica do Slider
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

    // Criar bullets se houver eventos
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
    console.error("Erro no banner:", err);
  }
}

// --- BANNER DE TEXTO (Mantido estático) ---
const bannerText = [{ src: "/assets/images/image-teste1.png", text: "Produto muito daora novo ae galera uhuuuuu!" }];
const templateBannerText = document.querySelector('.section-template');
const containerBannerText = document.querySelector('.banner-text');

if (templateBannerText && containerBannerText) {
  bannerText.forEach(item => {
    const clone = templateBannerText.content.cloneNode(true);
    clone.querySelector('.banner-content p').textContent = item.text;
    clone.querySelector('.banner-text-img').src = item.src;
    containerBannerText.appendChild(clone);
  });
}

// --- CARREGAR PRODUTOS (Apenas Promoções) ---
async function loadHomeProductsAPI() {
  const templateCards = document.querySelector('.template-cards');
  const sectionDiscount = document.querySelector('#section-discount');

  if (!templateCards || !sectionDiscount) return;

  try {
    const response = await fetch(`${API_BASE_URL}/Itens`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const products = await response.json();
    
    // Pegar apenas os últimos 5 itens
    const discountProducts = products.slice(-5); 
    
    sectionDiscount.innerHTML = '';
    
    discountProducts.forEach(produto => {
      const clone = templateCards.content.cloneNode(true);

      clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`;
      clone.querySelector('.card-text h2').textContent = produto.nome;
      clone.querySelector('.currently-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
      
      let imageUrl = '/assets/images/image.png';
      if (produto.imagens && produto.imagens.length > 0) {
        imageUrl = `https://drive.google.com/thumbnail?id=${produto.imagens[0].caminhoCloud}&sz=w800`;
      }
      clone.querySelector('.img-card').src = imageUrl;

      clone.querySelector('.buy-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id: produto.id, nome: produto.nome, preco: produto.preco, imagem: imageUrl });
      });

      sectionDiscount.appendChild(clone);
    });

  } catch (error) {
    console.error("Erro nos produtos:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadBannerEvents();
  loadHomeProductsAPI();
});