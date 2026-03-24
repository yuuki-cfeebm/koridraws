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
  clone.querySelector('.container-img img').src = item.img
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