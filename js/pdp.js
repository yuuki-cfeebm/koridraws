import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let produtoAtual = null;
let quantidadeSelecionada = 1;
let imagemPrincipal = '/assets/images/image.png';

async function carregarDetalhesDoProduto() {
    const url = new URLSearchParams(window.location.search);
    const idProduct = url.get('id');

    if (!idProduct) return;

    try {
        const resposta = await fetch(`${API_BASE_URL}/Itens/${idProduct}`);
        
        if (resposta.ok) {
            produtoAtual = await resposta.json();
            preencherTela(produtoAtual);
            configurarControlesQuantidade();
            configurarBotaoComprar();
        } else {
            console.error("Produto não encontrado!");
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

function formatDriveLink(url) {
    if (!url || !url.includes('/d/')) return url;
    const idImg = url.split('/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${idImg}&sz=w1000`;
}

function preencherTela(produto) {
    document.querySelector('.pdp-title').textContent = produto.nome;
    document.querySelector('.pdp-price').textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
    
    const otherImgsContainer = document.querySelector('.container-imgs');
    otherImgsContainer.style.display = "none";
    otherImgsContainer.innerHTML = "";

    const imgMain = document.querySelector('.img-main');
    
    if (produto.imagens && produto.imagens.length > 0) {
        imagemPrincipal = formatDriveLink(produto.imagens[0].url || produto.imagens[0].caminhoCloud);
        imgMain.src = imagemPrincipal;
        
        otherImgsContainer.style.display = "flex";
        
        produto.imagens.forEach((item, index) => {
            const newImg = document.createElement('img');
            const currentItemUrl = item.url || item.caminhoCloud;
            newImg.src = formatDriveLink(currentItemUrl);
            newImg.classList.add('img-other');

            if (index === 0) {
                newImg.classList.add('active');
            }

            newImg.addEventListener('click', () => {
                imgMain.src = formatDriveLink(currentItemUrl);
                const allImgs = document.querySelectorAll('.img-other');
                allImgs.forEach(img => img.classList.remove('active'));
                newImg.classList.add('active');
            });

            otherImgsContainer.appendChild(newImg);
        });
    } else {
        imgMain.src = imagemPrincipal;
    }
}

function configurarControlesQuantidade() {
    const spanQuantidade = document.querySelector('.add-itens span');
    const btnMinus = document.querySelector('.btn.minus');
    const btnPlus = document.querySelector('.btn.plus');

    if (!spanQuantidade || !btnMinus || !btnPlus) return;

    spanQuantidade.textContent = quantidadeSelecionada;

    btnPlus.addEventListener('click', () => {
        quantidadeSelecionada++;
        spanQuantidade.textContent = quantidadeSelecionada;
    });

    btnMinus.addEventListener('click', () => {
        if (quantidadeSelecionada > 1) {
            quantidadeSelecionada--;
            spanQuantidade.textContent = quantidadeSelecionada;
        }
    });
}

function configurarBotaoComprar() {
    const btnComprar = document.querySelector('.buy-btn');
    if (!btnComprar) return;

    btnComprar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!produtoAtual) return;

        addToCart({
            id: produtoAtual.id,
            nome: produtoAtual.nome,
            preco: produtoAtual.preco,
            imagem: imagemPrincipal,
            quantidade: quantidadeSelecionada
        });
    });
}

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
    carregarDetalhesDoProduto();
    cepMask();
});