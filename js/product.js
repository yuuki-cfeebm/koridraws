async function loadProducts() {
  console.log("[Produtos] Iniciando a função loadProducts...");
  
  const grid = document.getElementById('products-grid');
  const template = document.getElementById('product-card-template');
  const spinner = document.getElementById('loading-spinner');

  if (!grid || !template) {
    console.log("[Produtos] Elementos DOM necessários não encontrados. Execução interrompida.");
    return;
  }

  try {
    console.log("[Produtos] Disparando fetch para a API...");
    const fetchStart = performance.now();
    
    const response = await fetch('https://koridrawsbanco.onrender.com/api/Itens');
    
    const fetchEnd = performance.now();
    console.log(`[Produtos] Resposta da API recebida em ${(fetchEnd - fetchStart).toFixed(2)}ms. Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }

    console.log("[Produtos] Extraindo JSON da resposta...");
    const jsonStart = performance.now();
    
    const products = await response.json();
    
    const jsonEnd = performance.now();
    console.log(`[Produtos] JSON extraído em ${(jsonEnd - jsonStart).toFixed(2)}ms. Total de itens: ${products.length}`);
    
    spinner.style.display = 'none';

    console.log("[Produtos] Iniciando renderização dos cards...");
    const renderStart = performance.now();

    products.forEach(produto => {
      const clone = template.content.cloneNode(true);

      clone.querySelector('.card').href = `/assets/pages/pdp.html?id=${produto.id}`

      clone.querySelector('.product-title').textContent = produto.nome;
      


      const priceEl = clone.querySelector('.currently-price');
      priceEl.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

      const imgEl = clone.querySelector('.img-card');
      
   if (produto.imagens && produto.imagens.length > 0) {
        const fileId = produto.imagens[0].caminhoCloud;
        imgEl.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
      } else {
        imgEl.src = '/assets/images/image.png';
      }

      grid.appendChild(clone);
    });

    const renderEnd = performance.now();
    console.log(`[Produtos] Renderização concluída em ${(renderEnd - renderStart).toFixed(2)}ms.`);
    console.log("[Produtos] Processo finalizado com sucesso.");

  } catch (error) {
    console.error("[Produtos] Falha no processo:", error);
    if (spinner) {
      spinner.textContent = "Não foi possível carregar os produtos no momento.";
      spinner.style.color = "#c0392b";
    }
  }
}

document.addEventListener('DOMContentLoaded', loadProducts);