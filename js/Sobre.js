/* sobre.js – carrega o footer dinamicamente (mesmo padrão do main.js) */

async function includeHTML() {
  const components = [
    { id: 'footer-placeholder', url: 'assets/components/footer.html' }
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
        console.error('Erro ao carregar componente:', err);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', includeHTML);
