import { API_BASE_URL } from './config.js';
import { addToCart } from './cart.js';

let produtoAtual = null;
let quantidadeSelecionada = 1;
let imagemPrincipal = '/assets/images/pinguim.jpg';

const corteBaixoEstoque = 5;

function handleImgClick(e) {
    const imgMain = document.querySelector('.img-main');
    const url = e.target.dataset.url;
    imgMain.src = formatDriveLink(url);
    
    const allImgs = document.querySelectorAll('.img-other');
    allImgs.forEach(img => img.classList.remove('active'));
    e.target.classList.add('active');
}

function handleBtnPlus() {
    const spanQuantidade = document.querySelector('.add-itens span');
    quantidadeSelecionada++;
    if (spanQuantidade) spanQuantidade.textContent = quantidadeSelecionada;
}

function handleBtnMinus() {
    const spanQuantidade = document.querySelector('.add-itens span');
    if (quantidadeSelecionada > 1) {
        quantidadeSelecionada--;
        if (spanQuantidade) spanQuantidade.textContent = quantidadeSelecionada;
    }
}

function handleBtnComprar(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!produtoAtual) return;

    addToCart({
        id: produtoAtual.id,
        nome: produtoAtual.nome,
        preco: produtoAtual.preco,
        imagem: imagemPrincipal,
        quantidade: quantidadeSelecionada,
        estoque: produtoAtual.estoque 
    });
}

function handleCepInput(evento) {
    let valor = evento.target.value;
    valor = valor.replace(/\D/g, "");
    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    evento.target.value = valor;
}

async function handleEditarProdutoSubmit(e) {
    e.preventDefault();

    if (!produtoAtual) return;

    const formEditarProduto = document.getElementById('form-editar-produto');
    const inputNome = document.getElementById('edit-item-nome');
    const inputPreco = document.getElementById('edit-item-preco');
    const inputNovasImagens = document.getElementById('edit-item-novas-imagens');
    const msgContainer = document.getElementById('msg-editar-produto');
    const token = localStorage.getItem('koridraws_token');

    const checkboxesRemover = document.querySelectorAll('.checkbox-remover-img:checked');
    const qtdImagensAtuais = produtoAtual.imagens ? produtoAtual.imagens.length : 0;
    const qtdRemover = checkboxesRemover.length;
    const qtdNovas = inputNovasImagens.files ? inputNovasImagens.files.length : 0;

    const totalFinal = qtdImagensAtuais - qtdRemover + qtdNovas;

    if (totalFinal > 4) {
        if (msgContainer) {
            msgContainer.textContent = `Erro: O produto pode ter no máximo 4 imagens. Vai ficar com um total de ${totalFinal} imagens. Por favor, remova imagens antigas ou adicione menos ficheiros novos.`;
            msgContainer.style.color = "#c0392b";
        }
        return;
    }

    const btnSubmit = formEditarProduto.querySelector('button[type="submit"]');

    btnSubmit.disabled = true;
    btnSubmit.textContent = "A salvar...";
    if (msgContainer) msgContainer.textContent = "";

    const formData = new FormData();
    formData.append('Nome', inputNome.value.trim());
    formData.append('Preco', parseFloat(inputPreco.value).toString().replace('.', ','));

    checkboxesRemover.forEach(checkbox => {
        formData.append('ImagensParaRemover', parseInt(checkbox.value, 10));
    });

    if (inputNovasImagens && inputNovasImagens.files.length > 0) {
        for (let i = 0; i < inputNovasImagens.files.length; i++) {
            formData.append('NovasImagens', inputNovasImagens.files[i]);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Itens/Put/${produtoAtual.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        if (response.ok) {
            if (msgContainer) {
                msgContainer.textContent = "Produto atualizado com sucesso!";
                msgContainer.style.color = "#27ae60";
            }
            formEditarProduto.reset();
            carregarDetalhesDoProduto();
        } else {
            throw new Error("Erro ao atualizar.");
        }
    } catch (error) {
        if (msgContainer) {
            msgContainer.textContent = "Erro ao atualizar o produto. Verifique os dados.";
            msgContainer.style.color = "#c0392b";
        }
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Salvar Alterações Gerais";
    }
}

async function handleEditarEstoqueSubmit(e) {
    e.preventDefault();

    if (!produtoAtual) return;

    const formEditarEstoque = document.getElementById('form-editar-estoque');
    const inputEstoque = document.getElementById('edit-item-estoque');
    const msgEstoque = document.getElementById('msg-editar-estoque');
    const btnSubmit = formEditarEstoque.querySelector('button[type="submit"]');
    const token = localStorage.getItem('koridraws_token');
    
    btnSubmit.disabled = true;
    btnSubmit.textContent = "A atualizar...";
    if (msgEstoque) msgEstoque.textContent = "";

    const formData = new FormData();
    formData.append('novoEstoque', parseInt(inputEstoque.value, 10));

    try {
        const response = await fetch(`${API_BASE_URL}/Itens/${produtoAtual.id}/estoque`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        if (response.ok) {
            if (msgEstoque) {
                msgEstoque.textContent = "Estoque atualizado com sucesso!";
                msgEstoque.style.color = "#27ae60";
            }
            formEditarEstoque.reset();
            carregarDetalhesDoProduto();
        } else {
            throw new Error("Erro ao atualizar estoque.");
        }
    } catch (error) {
        if (msgEstoque) {
            msgEstoque.textContent = "Erro ao atualizar estoque.";
            msgEstoque.style.color = "#c0392b";
        }
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Atualizar Estoque";
    }
}

async function handleDeletarProdutoClick(e) {
    e.preventDefault();

    if (!produtoAtual) return;

    const confirmar = confirm(`Tem certeza que deseja excluir permanentemente o produto "${produtoAtual.nome}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmar) return;

    const btnDeletarProduto = document.getElementById('btn-deletar-produto');
    const msgDeletar = document.getElementById('msg-deletar-produto');
    const token = localStorage.getItem('koridraws_token');

    btnDeletarProduto.disabled = true;
    btnDeletarProduto.textContent = "A excluir...";
    if (msgDeletar) msgDeletar.textContent = "";

    try {
        const response = await fetch(`${API_BASE_URL}/Itens/Delete/${produtoAtual.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (response.ok) {
            if (msgDeletar) {
                msgDeletar.textContent = "Produto excluído com sucesso. Redirecionando...";
                msgDeletar.style.color = "#27ae60";
            }
            setTimeout(() => {
                window.location.href = '/assets/pages/product.html';
            }, 1500);
        } else {
            throw new Error("Erro ao excluir.");
        }
    } catch (error) {
        if (msgDeletar) {
            msgDeletar.textContent = "Erro ao excluir o produto.";
            msgDeletar.style.color = "#c0392b";
        }
        btnDeletarProduto.disabled = false;
        btnDeletarProduto.textContent = "Excluir Produto";
    }
}

function iniciarPagina() {
    carregarDetalhesDoProduto();
    cepMask();
}

// ==========================================
// FUNÇÕES PRINCIPAIS E CONSTRUÇÃO DE TELA
// ==========================================

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
            inicializarEdicaoGerente(produtoAtual);
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
    const pdpTitle = document.querySelector('.pdp-title');
    pdpTitle.textContent = produto.nome;
    
    const pdpPrice = document.querySelector('.pdp-price');
    pdpPrice.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
    
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
            newImg.dataset.url = currentItemUrl;

            if (index === 0) {
                newImg.classList.add('active');
            }

            newImg.removeEventListener('click', handleImgClick);
            newImg.addEventListener('click', handleImgClick);

            otherImgsContainer.appendChild(newImg);
        });
    } else {
        imgMain.src = imagemPrincipal;
    }

    const existingBadge = document.querySelector('.badge-pdp');
    if (existingBadge) {
        existingBadge.remove();
    }

    const semEstoque = produto.estoque === 0;
    const poucasUnidades = produto.estoque > 0 && produto.estoque <= corteBaixoEstoque;

    if (poucasUnidades) {
        const badge = document.createElement('span');
        badge.className = 'badge-estoque badge-ultimas badge-pdp';
        badge.textContent = 'Últimas unidades';
        badge.style.position = 'static';
        badge.style.display = 'inline-block';
        badge.style.width = 'max-content';
        badge.style.marginLeft = '12px';
        badge.style.verticalAlign = 'middle';
        pdpPrice.appendChild(badge);
    }
    else if (semEstoque) {
        const badge = document.createElement('span');
        badge.className = 'badge-estoque badge-esgotado badge-pdp';
        badge.textContent = 'Esgotado';
        badge.style.position = 'static';
        badge.style.display = 'inline-block';
        badge.style.width = 'max-content';
        badge.style.marginLeft = '12px';
        badge.style.verticalAlign = 'middle';
        pdpPrice.appendChild(badge);
    } 
}

function configurarControlesQuantidade() {
    const spanQuantidade = document.querySelector('.add-itens span');
    const btnMinus = document.querySelector('.btn.minus');
    const btnPlus = document.querySelector('.btn.plus');

    if (!spanQuantidade || !btnMinus || !btnPlus || !produtoAtual) return;

    const controlesContainer = spanQuantidade.parentElement;

    if (produtoAtual.estoque === 0) {
        controlesContainer.style.display = 'none';
        return;
    }

    controlesContainer.style.display = 'flex';
    spanQuantidade.textContent = quantidadeSelecionada;

    btnPlus.removeEventListener('click', handleBtnPlus);
    btnPlus.addEventListener('click', handleBtnPlus);

    btnMinus.removeEventListener('click', handleBtnMinus);
    btnMinus.addEventListener('click', handleBtnMinus);
}

function configurarBotaoComprar() {
    const btnComprar = document.querySelector('.buy-btn');
    if (!btnComprar || !produtoAtual) return;

    btnComprar.removeEventListener('click', handleBtnComprar);

    if (produtoAtual.estoque === 0) {
        btnComprar.disabled = true;
        btnComprar.textContent = "Indisponível";
        btnComprar.style.backgroundColor = "#ccc";
        btnComprar.style.cursor = "not-allowed";
        btnComprar.style.color = "#666";
        return;
    }

    btnComprar.addEventListener('click', handleBtnComprar);
}

function cepMask() {
    const inputCep = document.querySelector('.cep-mask');
    if (!inputCep) return; 

    inputCep.removeEventListener('input', handleCepInput);
    inputCep.addEventListener('input', handleCepInput);
}

function inicializarEdicaoGerente(produtoEditavel) {
    const token = localStorage.getItem('koridraws_token');
    const papelUsuario = localStorage.getItem('koridraws_user_role');
    const painelEdicao = document.getElementById('gerente-edit-panel');

    if (!token || papelUsuario !== 'Gerente' || !painelEdicao) {
        return;
    }

    painelEdicao.style.display = 'block';

    const formEditarProduto = document.getElementById('form-editar-produto');
    const inputNome = document.getElementById('edit-item-nome');
    const inputPreco = document.getElementById('edit-item-preco');
    const containerImagensAtuais = document.getElementById('edit-imagens-atuais');
    
    const formEditarEstoque = document.getElementById('form-editar-estoque');
    const inputEstoque = document.getElementById('edit-item-estoque');
    const btnDeletarProduto = document.getElementById('btn-deletar-produto');

    inputNome.value = produtoEditavel.nome;
    inputPreco.value = produtoEditavel.preco;
    inputEstoque.value = produtoEditavel.estoque || 0;

    containerImagensAtuais.innerHTML = '';
    
    if (produtoEditavel.imagens && produtoEditavel.imagens.length > 0) {
        produtoEditavel.imagens.forEach(img => {
            const fileId = img.caminhoCloud || img.url;
            const imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;

            const imgWrapper = document.createElement('div');
            imgWrapper.style.position = 'relative';
            imgWrapper.style.border = '1px solid #ccc';
            imgWrapper.style.padding = '4px';
            imgWrapper.style.borderRadius = '4px';
            imgWrapper.style.display = 'flex';
            imgWrapper.style.flexDirection = 'column';
            imgWrapper.style.alignItems = 'center';

            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            imageElement.style.width = '80px';
            imageElement.style.height = '80px';
            imageElement.style.objectFit = 'cover';
            imageElement.style.marginBottom = '8px';

            const labelRemover = document.createElement('label');
            labelRemover.style.fontSize = '12px';
            labelRemover.style.cursor = 'pointer';
            labelRemover.style.display = 'flex';
            labelRemover.style.gap = '4px';

            const checkboxRemover = document.createElement('input');
            checkboxRemover.type = 'checkbox';
            checkboxRemover.value = img.id;
            checkboxRemover.className = 'checkbox-remover-img';

            labelRemover.appendChild(checkboxRemover);
            labelRemover.appendChild(document.createTextNode('Remover'));

            imgWrapper.appendChild(imageElement);
            imgWrapper.appendChild(labelRemover);
            containerImagensAtuais.appendChild(imgWrapper);
        });
    } else {
        containerImagensAtuais.textContent = 'Nenhuma imagem cadastrada.';
    }

    if (formEditarProduto) {
        formEditarProduto.removeEventListener('submit', handleEditarProdutoSubmit);
        formEditarProduto.addEventListener('submit', handleEditarProdutoSubmit);
    }

    if (formEditarEstoque) {
        formEditarEstoque.removeEventListener('submit', handleEditarEstoqueSubmit);
        formEditarEstoque.addEventListener('submit', handleEditarEstoqueSubmit);
    }

    if (btnDeletarProduto) {
        btnDeletarProduto.removeEventListener('click', handleDeletarProdutoClick);
        btnDeletarProduto.addEventListener('click', handleDeletarProdutoClick);
    }
}

window.removeEventListener('DOMContentLoaded', iniciarPagina);
window.addEventListener('DOMContentLoaded', iniciarPagina);