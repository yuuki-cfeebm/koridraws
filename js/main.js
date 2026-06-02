import { handleNavbarItem } from './header.js';

const imagesBanner = [
  { src: "/assets/images/image-teste2.png", alt: "teste2"},
  { src: "/assets/images/image-teste1.png", alt: "teste1"},
  { src: "/assets/images/pinguim.png", alt: "bbb"}
];

const bannerText = [
  { src: "/assets/images/image-teste1.png", text: "Produto muito daora novo ae galera uhuuuuu!"}
];

const rulerData = [
  {img: "/assets/images/pinguim.png", description: "frete gratis"},
  {img: "/assets/images/pinguim.png", description: "Desconto"},
  {img: "/assets/images/pinguim.png", description: "CashBack"},
];

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
  handleNavbarItem()
}
document.addEventListener('DOMContentLoaded', includeHTML);

// --- Renderização dos Cards ---
const templateCards = document.querySelector('.template-cards');
const sectionNew = document.querySelector('#section-new');
const sectionDiscount = document.querySelector('#section-discount');


// --- lógica do Banner Principal (Carrossel) ---
const templateBanner = document.querySelector('.banner-template');
const carousel = document.querySelector('.carousel');

//validar se existe
if (templateBanner && carousel) {
  imagesBanner.forEach(item => {
    const clone = templateBanner.content.cloneNode(true);
    clone.querySelector('.img-banner').src = item.src;
    clone.querySelector('.img-banner').alt = item.alt;
    carousel.appendChild(clone);  
  });

  let currentIndex = 0;
  const totalImages = imagesBanner.length;
  const dots = [];
  const divBullets = document.querySelector('.bullets');

  function updateCarousel() {
    const offset = -currentIndex * 100; 
    carousel.style.transform = `translateX(${offset}%)`;

    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex < totalImages - 1) ? currentIndex + 1 : 0;
    updateCarousel();
  }

  let autoPlay = setInterval(nextSlide, 3000);

  function resetAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(nextSlide, 3000);
  }

  // Setas do Carrossel (Garantimos que existem antes de adicionar o evento)
  const btnNextBanner = document.querySelector('.btn-carousel.next');
  const btnBackBanner = document.querySelector('.btn-carousel.back');

  if (btnNextBanner) {
    btnNextBanner.addEventListener('click', () => {
      currentIndex = (currentIndex < totalImages - 1) ? currentIndex + 1 : 0;
      updateCarousel();
      resetAutoPlay();
    });
  }

  if (btnBackBanner) {
    btnBackBanner.addEventListener('click', () => {
      currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalImages - 1;
      updateCarousel();
      resetAutoPlay();
    });
  }

  // Bullets do Carrossel
  if(imagesBanner.length > 0 && divBullets) {
    imagesBanner.forEach((_, index) => {
      const bullet = document.createElement('div');
      bullet.classList.add('bullet');
      
      bullet.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
        resetAutoPlay();
      });

      divBullets.appendChild(bullet);
      dots.push(bullet);
    });
    updateCarousel();
  }
}


// --- C. Banner Personalizável (Banner Texto) ---
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


// --- D. Ruler Benefícios ---
const templateRuler = document.querySelector('.template-ruler');
const containerRuler = document.querySelector('.ruler-container');

if (templateRuler && containerRuler) {
  //  add logica do ruler
}

const btnBackProduct = document.querySelector('.back.btn-product');
const btnNextProduct = document.querySelector('.next.btn-product');

if (btnBackProduct) {
   // btnBackProduct.addEventListener('click', ...);
}

if (btnNextProduct) {
  // btnNextProduct.addEventListener('click', ...);
}

async function loadHomeProductsAPI() {
  const templateCards = document.querySelector('.template-cards');
  const sectionNew = document.querySelector('#section-new');
  const sectionDiscount = document.querySelector('#section-discount');

  if (!templateCards) return;

  try {
    const response = await fetch('https://koridrawsbanco.onrender.com/api/Itens');
    
    if (!response.ok) {
      throw new Error(`Status: ${response.status}`);
    }

    const products = await response.json();

    if (sectionNew) {
      sectionNew.innerHTML = '';
      const newProducts = products.slice(0, 3);
      
      newProducts.forEach(produto => {
        const clone = templateCards.content.cloneNode(true);

        clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`
        
        clone.querySelector('.card-text h2').textContent = produto.nome;
        clone.querySelector('.currently-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
        
        const imgEl = clone.querySelector('.img-card');
        if (produto.imagens && produto.imagens.length > 0) {
          imgEl.src = `https://drive.google.com/thumbnail?id=${produto.imagens[0].caminhoCloud}&sz=w800`;
        } else {
          imgEl.src = '/assets/images/image.png';
        }

        // clone.querySelector('.tag-new img').src = '/assets/icons/fita.png';
        // clone.querySelector('.tag-discount').style.display = 'none';

        sectionNew.appendChild(clone);
      });
    }

    if (sectionDiscount) {
      sectionDiscount.innerHTML = '';
      const discountProducts = products.slice(0, 10);
      
      discountProducts.forEach(produto => {
        const clone = templateCards.content.cloneNode(true);
        
        clone.querySelector('.card-text h2').textContent = produto.nome;
        clone.querySelector('.currently-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

        const imgEl = clone.querySelector('.img-card');
        if (produto.imagens && produto.imagens.length > 0) {
          imgEl.src = `https://drive.google.com/thumbnail?id=${produto.imagens[0].caminhoCloud}&sz=w800`;
        } else {
          imgEl.src = '/assets/images/image.png';
        }

        // clone.querySelector('.tag-discount img').src = '/assets/icons/bola.png';
        // clone.querySelector('.tag-new').style.display = 'none';

        sectionDiscount.appendChild(clone);
      });
    }

  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', loadHomeProductsAPI);

