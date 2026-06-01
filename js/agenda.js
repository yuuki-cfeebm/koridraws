function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateBr(dateValue) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.valueOf())) return '';
  return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function createEventCard({ title, date, location, details, image, category }) {
  const article = document.createElement('article');
  article.className = `event-card ${category === 'past' ? 'event-card--past' : 'event-card--upcoming'}`;
  article.innerHTML = `
    <h3 class="event-card__name">${escapeHtml(title)}</h3>
    <div class="event-card__img-wrap">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" class="event-card__img">
    </div>
    <div class="event-card__info">
      <p><strong>Data:</strong> ${escapeHtml(date)}</p>
      <p><strong>Local:</strong> ${escapeHtml(location)}</p>
      <p><strong>Detalhes:</strong> ${escapeHtml(details)}</p>
    </div>
  `;
  return article;
}

function showMessage(message, isError = false) {
  const messageEl = document.getElementById('event-form-message');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.toggle('message-error', isError);
  messageEl.classList.toggle('message-success', !isError);
}

function initEventForm() {
  const form = document.getElementById('event-form');
  const upcomingGrid = document.querySelector('.upcoming-grid');
  const pastGrid = document.querySelector('.past-grid');
  const imageSelect = document.getElementById('event-image');
  const imagePreview = document.getElementById('image-preview');

  if (!form || !upcomingGrid || !pastGrid || !imageSelect || !imagePreview) return;

  imageSelect.addEventListener('change', () => {
    imagePreview.src = imageSelect.value;
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const title = formData.get('event-title')?.toString().trim();
    const dateValue = formData.get('event-date')?.toString().trim();
    const location = formData.get('event-location')?.toString().trim();
    const details = formData.get('event-details')?.toString().trim();
    const image = formData.get('event-image')?.toString().trim() || 'assets/images/image.png';

    if (!title || !dateValue || !location || !details) {
      showMessage('Preencha todos os campos obrigatórios antes de adicionar o evento.', true);
      return;
    }

    const dateObj = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(dateObj.valueOf())) {
      showMessage('Data inválida. Escolha uma data válida no campo Data.', true);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const category = dateObj < today ? 'past' : 'upcoming';
    const formattedDate = formatDateBr(dateValue);

    const newCard = createEventCard({ title, date: formattedDate, location, details, image, category });

    if (category === 'past') {
      pastGrid.prepend(newCard);
    } else {
      upcomingGrid.prepend(newCard);
    }

    form.reset();
    imagePreview.src = imageSelect.value;
    showMessage('Evento adicionado com sucesso!', false);
  });
}

async function loadEventsAPI() {
  const upcomingContainer = document.getElementById('upcoming-carousel');
  const pastContainer = document.getElementById('past-carousel');

  if (!upcomingContainer || !pastContainer) return;

  try {
    const response = await fetch('https://koridrawsbanco.onrender.com/api/Eventos');
    
    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }

    const eventos = await response.json();
    const today = new Date();

    eventos.forEach(evento => {
      const eventDate = new Date(evento.data);
      const isPast = eventDate < today;

      const article = document.createElement('article');
      article.className = `event-card ${isPast ? 'event-card--past' : 'event-card--upcoming'}`;

   let imgSrc = '/assets/images/image.png';
      if (evento.imagens && evento.imagens.length > 0) {
        imgSrc = `https://drive.google.com/thumbnail?id=${evento.imagens[0].caminhoCloud}&sz=w800`;
      }

      let localStr = 'Local a definir';
      if (evento.endereco) {
        localStr = `${evento.endereco.rua}, ${evento.endereco.numero} - ${evento.endereco.bairro}, ${evento.endereco.cidade.descricao}`;
      }

      const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
      const dateStr = eventDate.toLocaleDateString('pt-BR', dateOptions);

      article.innerHTML = `
        <h3 class="event-card__name">${evento.nome}</h3>
        <div class="event-card__img-wrap">
          <img src="${imgSrc}" alt="${evento.nome}" class="event-card__img">
        </div>
        <div class="event-card__info">
          <p><strong>Data:</strong> ${dateStr}</p>
          <p><strong>Local:</strong> ${localStr}</p>
          <p><strong>Detalhes:</strong> ${evento.descricao}</p>
        </div>
      `;

      if (isPast) {
        pastContainer.appendChild(article);
      } else {
        upcomingContainer.appendChild(article);
      }
    });

    setupEventCarousels();

  } catch (error) {
    console.error(error);
  }
}

function setupEventCarousels() {
  const carousels = [
    { 
      container: document.getElementById('upcoming-carousel'), 
      back: document.getElementById('btn-back-upcoming'), 
      next: document.getElementById('btn-next-upcoming') 
    },
    { 
      container: document.getElementById('past-carousel'), 
      back: document.getElementById('btn-back-past'), 
      next: document.getElementById('btn-next-past') 
    }
  ];

  const scrollAmount = 320;

  carousels.forEach(c => {
    if (c.container && c.back && c.next) {
      c.next.addEventListener('click', () => {
        c.container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
      c.back.addEventListener('click', () => {
        c.container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', loadEventsAPI);

document.addEventListener('DOMContentLoaded', initEventForm);
