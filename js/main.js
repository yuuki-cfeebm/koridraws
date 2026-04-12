const data = [
  {
    img: './assets/images/Rectangle.svg',
    title: 'Banco 1',
    description: 'descrição banco 1...',
    price: 500.00,
    new: true,
    discount: 50,
  },
  {
    img: './assets/images/Rectangle.svg',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    new: false,
    discount: 10,
  },
  {
    img: './assets/images/image.png',
    title: 'Banco 2',
    description: 'descrição banco 2...',
    price: 200.00,
    new: false,
    discount: 10,
  }
]

const template = document.querySelector('#card-template')
const container = document.querySelector('.cards-container')

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

  // tags
  if(item.new) {
    clone.querySelector('.tag-new p').textContent = "novo"
  } else {
    clone.querySelector('.tag-new').style.display = "none"
  }

  if(item.discount) {
    clone.querySelector('.tag-offer p').textContent = "oferta"
    clone.querySelector('.tag-discount p').textContent = `-${item.discount}%`
  } else {
    clone.querySelector('.tag-offer').style.display = "none"
    clone.querySelector('.tag-discount').style.display = "none"
  }

  container.appendChild(clone)
})

//banner

const imagesBanner = [
  { src: "/assets/images/image-teste1.png", alt: "teste1"},
  { src: "/assets/images/image-teste2.png", alt: "teste2"}
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
}

document.querySelector('.btn-carousel.next').addEventListener('click', () => {
  if (currentIndex < totalImages - 1) {
    currentIndex++;
  } else {
    currentIndex = 0;
  }
  updateCarousel();
});

document.querySelector('.btn-carousel.back').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = totalImages - 1;
  }
  updateCarousel();
});

if(imagesBanner.length > 0) {
  const divBullets = document.querySelector('.bullets')
  imagesBanner.forEach(() => {
    const bullet = document.createElement('div')
    bullet.style.padding = '4px'
    bullet.style.background = '#cbcbcb'
    bullet.style.borderRadius = '50%'

    divBullets.appendChild(bullet)
  })
}
