//funções


//seções dinamicas

//adicionando ccards
const data = [
  {
    img: './assets/images/Rectangle.svg',
    title: 'Banco 1',
    description: 'descrição banco 1...',
    price: 500.00,
    tags: {
      discount: true,
      new: false,
      discountValue: 50
    } 
  },
  {
    img: './assets/images/Rectangle.svg',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    tags: {
      discount: true,
      new: false,
      discountValue: 20
    } 
  },
  {
    img: './assets/images/image.png',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    tags: {
      discount: true,
      new: false,
      discountValue: 10
    } 
  },
  {
    img: './assets/images/Rectangle.svg',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    tags: {
      discount: false,
      new: true,
      discountValue: 0
    } 
  },
  {
    img: './assets/images/image.png',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    tags: {
      discount: false,
      new: true,
      discountValue: 0
    } 
  }
]

const template = document.querySelector('.template-cards') //tempalte dos cards
const sectionNew = document.querySelector('#section-new')
const sectionDiscount = document.querySelector('#section-discount')


data.forEach(item => {
  const clone = template.content.cloneNode(true)

  // cálculo do preço final
  let finalPrice = item.price
  if(item.discount) {
    finalPrice -= item.price * (item.discount / 100)
  }

  // preencher card
  clone.querySelector('.img-card').src = item.img
  clone.querySelector('.card-text h2').textContent = item.title
  clone.querySelector('.card-text p').textContent = item.description
  clone.querySelector('.full-price').textContent = `R$ ${item.price.toFixed(2)}`
  clone.querySelector('.currently-price').textContent = `R$ ${finalPrice.toFixed(2)}`

  //bola = desconto || fita = novidade
  if(item.tags.discount) {
    clone.querySelector('.tag-discount img').src = '/assets/icons/bola.png'
  }

  if(item.tags.new) {
    clone.querySelector('.tag-new img').src = '/assets/icons/fita.png'
  }

  // if(item.tags.discountValue) {
  //   clone.querySelector('.tag-offer p').textContent = "oferta"
  //   clone.querySelector('.tag-discount p').textContent = `-${item.discount}%`
  // } else {
  //   clone.querySelector('.tag-offer').style.display = "none"
  //   clone.querySelector('.tag-discount').style.display = "none"
  // }

  if(item.tags.discount) {
    sectionDiscount.appendChild(clone)
  } else if(item.tags.new) {
    sectionNew.appendChild(clone)
  } else {
    console.log("algo de erardo")
  }
})

//banner
const imagesBanner = [
  { src: "/assets/images/image-teste1.png", alt: "teste1"},
  { src: "/assets/images/image-teste2.png", alt: "teste2"},
  // { src: "/assets/images/Rectangle.svg", alt: "aaa"},
  // { src: "/assets/images/pinguim.png", alt: "bbb"}

]

const templateBanner = document.querySelector('.banner-template')
const carousel = document.querySelector('.carousel')

imagesBanner.forEach(item => {
  const clone = templateBanner.content.cloneNode(true)

  clone.querySelector('.img-banner').src = item.src
  clone.querySelector('.img-banner').alt = item.alt

  carousel.appendChild(clone)  
})

let currentIndex = 0;
const totalImages = imagesBanner.length;

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
  if (currentIndex < totalImages - 1) {
    currentIndex++;
  } else {
    currentIndex = 0;
  }
  updateCarousel();
}

let autoPlay = setInterval(nextSlide, 3000)

function resetAutoPlay() {
  clearInterval(autoPlay)
  autoPlay = setInterval(nextSlide, 3000)
}

document.querySelector('.btn-carousel.next').addEventListener('click', () => {
  if (currentIndex < totalImages - 1) {
    currentIndex++;
  } else {
    currentIndex = 0;
  }
  updateCarousel();
  resetAutoPlay()
});

document.querySelector('.btn-carousel.back').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = totalImages - 1;
  }
  updateCarousel();
  resetAutoPlay()
});

const dots = [];

if(imagesBanner.length > 0) {
  const divBullets = document.querySelector('.bullets');
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
  })
  updateCarousel()
}


//carousel-produto
const btnBack = document.querySelector('.back .btn-product')
const btnNext = document.querySelector('.next .btn-product')


//banner personalizavel
const bannerText = [
  { src: "/assets/images/image-teste1.png", text: "vai tomando gatos e gatos vai tomando gatos e gatos vai tomando gatos e gatos"},
  // { src: "", text: ""},
]

const templateBannerText = document.querySelector('.section-template')
const containerBannerText = document.querySelector('.banner-text')

bannerText.forEach(item => {
  const clone = templateBannerText.content.cloneNode(true)
  console.log(item.text)
  clone.querySelector('.banner-content p').textContent = item.text
  clone.querySelector('.banner-text-img').src = item.src

  containerBannerText.appendChild(clone)
})