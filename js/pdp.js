import { API_BASE_URL } from './config.js';

async function carregarDetalhesDoProduto() {
    const url = new URLSearchParams(window.location.search);
    const path = window.location.pathname
    console.log(path)

    const idProduct = url.get('id');
    console.log(idProduct)

    try {
        const resposta = await fetch(`${API_BASE_URL}/Itens/${idProduct}`);
        
        if (resposta.ok) {
            const produto = await resposta.json();
            preencherTela(produto);
        } else {
            console.error("Produto não encontrado!");
        }

    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

const imagesTeste = [
    "/assets/images/kori.jpg",
    "/assets/images/kori.jpg",
    "/assets/images/kori.jpg"
]

function preencherTela(produto) {
    document.querySelector('.pdp-title').textContent = produto.nome;
    document.querySelector('.pdp-price').textContent = `R$ ${produto.preco}`;
    const otherImgsContainer = document.querySelector('.container-imgs')
    otherImgsContainer.style.display = "none"

    const imgMain = document.querySelector('.img-main').src = imagesTeste[0];

    if(imagesTeste.length > 1) {
        otherImgsContainer.style.display = "flex"
        imagesTeste.slice(1).forEach(item => {
            const newImg = document.createElement('img')
            newImg.src = item

            newImg.classList.add('img-other')

            otherImgsContainer.appendChild(newImg)

        })

    }
    // document.querySelector('.pdp-descricao').textContent = produto.descricao;
}

window.addEventListener('DOMContentLoaded', carregarDetalhesDoProduto);