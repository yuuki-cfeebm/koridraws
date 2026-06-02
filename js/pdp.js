// import { lerCarrinho, salvarCarrinho } from "./cart";

async function carregarDetalhesDoProduto() {
    const url = new URLSearchParams(window.location.search);
    const path = window.location.pathname

    const idProduct = url.get('id');

    try {
        const resposta = await fetch(`https://koridrawsbanco.onrender.com/api/Itens/${idProduct}`);
        
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

function formatDriveLink(url) {
    if (!url.includes('/d/')) return url;

    const idImg = url.split('/d/')[1].split('/')[0];
    
    return `https://drive.google.com/thumbnail?id=${idImg}&sz=w1000`;
}

function preencherTela(produto) {
    document.querySelector('.pdp-title').textContent = produto.nome;
    document.querySelector('.pdp-price').textContent = `R$ ${produto.preco}`;
    const otherImgsContainer = document.querySelector('.container-imgs')
    otherImgsContainer.style.display = "none"
    otherImgsContainer.innerHTML = ""

    const imgMain = document.querySelector('.img-main') 
    imgMain.src = formatDriveLink(produto.imagens[0].url)

    if(produto.imagens) {

        otherImgsContainer.style.display = "flex"
        
        produto.imagens.forEach((item, index) => {
            const newImg = document.createElement('img')
            newImg.src = formatDriveLink(item.url)
            newImg.classList.add('img-other')

            if (index === 0) {
                newImg.classList.add('active');
            }

            newImg.addEventListener('click', () => {
                imgMain.src = formatDriveLink(item.url)
                const allImgs = document.querySelectorAll('.img-other')
                allImgs.forEach(item => item.classList.remove('active'))

                newImg.classList.add('active')
            })

            otherImgsContainer.appendChild(newImg)
        })
    }
}

// function handleCartItens(produto) {
//     const num = document.querySelector('.add-itens span');
    
//     const carrinho = lerCarrinho();
//     const itemExistente = carrinho.find(item => item.id === produtoAtual.id);
    
//     let number = itemExistente ? itemExistente.quantidade : 1;
//     if (num) num.textContent = number;

//     const num = document.querySelector('.add-itens span')
//     const btnAdd = document.querySelector('.plus')
//     const btnRemove = document.querySelector('.minus')
//     let number = 0

//     btnAdd.addEventListener('click', () => {
//         number += 1
//         num.textContent = number
//     })

//     btnRemove.addEventListener('click', () => {
//         if(number > 0) {
//             number -= 1
//             num.textContent = number
//         } else {
//             number = 0
//             return
//         }
//     })
// }

function cepMask() {
    const inputCep = document.querySelector('.cep-mask');

    if (!inputCep) return; 

    inputCep.addEventListener('input', (evento) => {
        
        let valor = evento.target.value;
        valor = valor.replace(/\D/g, "");
        valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");

        evento.target.value = valor;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    carregarDetalhesDoProduto()
    // handleCartItens()
    cepMask()
});