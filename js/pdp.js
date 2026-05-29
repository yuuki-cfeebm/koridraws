async function carregarDetalhesDoProduto() {
    const url = new URLSearchParams(window.location.search);
    const path = window.location.pathname
    console.log(path)

    const idProduct = url.get('id');
    console.log(idProduct)

    // if (!idProduct) {
    //     window.location.href = 'index.html';
    //     return;
    // }

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

function preencherTela(produto) {
    document.querySelector('.pdp-title').textContent = produto.nome;
    document.querySelector('.pdp-price').textContent = `R$ ${produto.preco}`;
    document.querySelector('.pdp-image').src = produto.imagem[0];
    // document.querySelector('.pdp-descricao').textContent = produto.descricao;
}

window.addEventListener('DOMContentLoaded', carregarDetalhesDoProduto);