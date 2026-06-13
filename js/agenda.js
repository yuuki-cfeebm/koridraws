import { API_BASE_URL } from './config.js';

let cacheEstados = [];

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

function showMessage(message, isError = false) {
  const messageEl = document.getElementById('event-form-message');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.classList.toggle('message-error', isError);
  messageEl.classList.toggle('message-success', !isError);
  
  if (isError) {
      messageEl.style.color = "#c0392b";
  } else {
      messageEl.style.color = "#27ae60";
  }
}

async function loadEstados() {
  const selectEstado = document.getElementById('event-estado');
  if (selectEstado && selectEstado.options.length > 1 && cacheEstados.length > 0) return cacheEstados;
  
  try {
    const res = await fetch(`${API_BASE_URL}/Enderecos/estados`);
    if (res.ok) {
      const estados = await res.json();
      cacheEstados = estados;
      if (selectEstado) {
        selectEstado.innerHTML = '<option value="" disabled selected>Selecione um estado</option>';
        estados.forEach(est => {
          const opt = document.createElement('option');
          opt.value = est.id;
          opt.textContent = est.descricao || est.nome;
          selectEstado.appendChild(opt);
        });
      }
      return estados;
    }
  } catch (error) {
  }
  return [];
}

async function loadCidades(estadoId) {
  const selectCidade = document.getElementById('event-cidade');
  if (!selectCidade) return;
  
  selectCidade.innerHTML = '<option value="" disabled selected>A carregar...</option>';
  selectCidade.disabled = true;

  try {
    const res = await fetch(`${API_BASE_URL}/Enderecos/estados/${estadoId}/cidades`);
    if (res.ok) {
      const cidades = await res.json();
      selectCidade.innerHTML = '<option value="" disabled selected>Selecione uma cidade</option>';
      
      cidades.forEach(cid => {
        const opt = document.createElement('option');
        opt.value = cid.id;
        opt.textContent = cid.descricao || cid.nome;
        selectCidade.appendChild(opt);
      });
      selectCidade.disabled = false;
    }
  } catch (error) {
    selectCidade.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

function initEventForm() {
  const papelUsuario = localStorage.getItem('koridraws_user_role');
  const token = localStorage.getItem('koridraws_token');
  const form = document.getElementById('event-form');
  const formContainer = form ? form.closest('section') || form : null;

  if (papelUsuario !== 'Gerente' || !token) {
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    return;
  } else {
    if (formContainer) {
        formContainer.style.display = 'block';
    }
    loadEstados();
  }

  const selectEstado = document.getElementById('event-estado');
  if (selectEstado) {
    selectEstado.addEventListener('change', (e) => loadCidades(e.target.value));
  }

  const imageSelect = document.getElementById('event-image');

  if (imageSelect) {
    imageSelect.addEventListener('change', (e) => {
      if (e.target.files.length > 4) {
        showMessage('Por favor, selecione no máximo 4 imagens.', true);
        e.target.value = '';
              } 
    });
  }

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (imageSelect && imageSelect.files.length > 4) {
          showMessage('Por favor, selecione no máximo 4 imagens.', true);
          return;
      }

      const btnSubmit = form.querySelector('button[type="submit"]');
      
      const title = document.getElementById('event-title')?.value.trim();
      const dateValue = document.getElementById('event-date')?.value.trim();
      const details = document.getElementById('event-details')?.value.trim();

      const rua = document.getElementById('event-rua')?.value.trim();
      const numero = document.getElementById('event-numero')?.value.trim();
      const bairro = document.getElementById('event-bairro')?.value.trim();
      const cep = document.getElementById('event-cep')?.value.trim();
      const complemento = document.getElementById('event-complemento')?.value.trim();
      const cidadeId = document.getElementById('event-cidade')?.value;

      if (!title || !dateValue || !rua || !numero || !bairro || !cep || !cidadeId) {
        showMessage('Preencha os campos obrigatórios do evento e do endereço.', true);
        return;
      }

      if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = "Criando endereço...";
      }

      showMessage('', false);

      try {
        const addressFormData = new FormData();
        addressFormData.append('Rua', rua);
        addressFormData.append('Numero', numero);
        addressFormData.append('Bairro', bairro);
        addressFormData.append('Cep', cep);
        if (complemento) addressFormData.append('Complemento', complemento);
        addressFormData.append('CidadeId', cidadeId);

        const resAddress = await fetch(`${API_BASE_URL}/Enderecos/Post`, {
            method: 'POST',
            body: addressFormData,
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!resAddress.ok) {
            throw new Error('Erro ao criar a endereço.');
        }

        const addressData = await resAddress.json();
        const novoEnderecoId = addressData.id;

        if (btnSubmit) {
            btnSubmit.textContent = "Criando evento...";
        }

        const eventFormData = new FormData();
        eventFormData.append('Nome', title);
        eventFormData.append('Data', `${dateValue}T00:00:00Z`);
        eventFormData.append('EnderecoId', parseInt(novoEnderecoId, 10));
        
        if (details) {
            eventFormData.append('Descricao', details);
        }

        if (imageSelect && imageSelect.files.length > 0) {
            for (let i = 0; i < imageSelect.files.length; i++) {
                eventFormData.append('Imagens', imageSelect.files[i]);
            }
        }

        const resEvent = await fetch(`${API_BASE_URL}/Eventos/Post`, {
            method: 'POST',
                       headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: eventFormData
        });

        if (!resEvent.ok) {
            throw new Error('Erro ao criar o evento.');
        }

        showMessage('Evento adicionado com sucesso!', false);
        form.reset();
        
        const selectCidade = document.getElementById('event-cidade');
        if (selectCidade) {
            selectCidade.innerHTML = '<option value="" disabled selected>Selecione um estado primeiro</option>';
            selectCidade.disabled = true;
        }
        
        loadEventsAPI();

      } catch (error) {
        showMessage(error.message || 'Erro ao processar a requisição. Verifique os dados.', true);
      } finally {
          if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.textContent = "Adicionar Evento";
          }
      }
    });
  }
}

async function loadEventsAPI() {
  const upcomingContainer = document.getElementById('upcoming-carousel');
  const pastContainer = document.getElementById('past-carousel');

  if (!upcomingContainer || !pastContainer) return;

  upcomingContainer.innerHTML = '';
  pastContainer.innerHTML = '';

  try {
    const response = await fetch(`${API_BASE_URL}/Eventos`);
    
    if (!response.ok) {
      throw new Error(`Erro de rede: ${response.status}`);
    }

    const eventos = await response.json();
    const today = new Date();

    const eventosProximos = [];
    const eventosPassados = [];

    eventos.forEach(evento => {
      const eventDate = new Date(evento.data);
      if (eventDate < today) {
        eventosPassados.push(evento);
      } else {
        eventosProximos.push(evento);
      }
    });

    eventosProximos.sort((a, b) => new Date(a.data) - new Date(b.data));
    eventosPassados.sort((a, b) => new Date(b.data) - new Date(a.data));

    function criarCartaoEvento(evento, isPast, container) {
      const eventDate = new Date(evento.data);
      const article = document.createElement('article');
      article.className = `event-card ${isPast ? 'event-card--past' : 'event-card--upcoming'}`;
      article.style.minWidth = '280px'; 
      article.style.flexShrink = '0';
      article.style.cursor = 'pointer';

      article.addEventListener('click', () => {
          window.location.href = `/assets/pages/evento.html?id=${evento.id}`;
      });

      let imgSrc = '/assets/images/pinguim.jpg';
      if (evento.imagem != null) {
        imgSrc = `https://drive.google.com/thumbnail?id=${evento.imagem.caminhoCloud}&sz=w800`;
      }

      let localStr = 'Local a definir';
      if (evento.endereco) {
        localStr = `${evento.endereco.rua}, ${evento.endereco.numero} - ${evento.endereco.bairro}, ${evento.endereco.cidadeNome}`;
      }

      const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
      const dateStr = eventDate.toLocaleDateString('pt-BR', dateOptions);

      article.innerHTML = `
        <h3 class="event-card__name">${escapeHtml(evento.nome)}</h3>
        <div class="event-card__img-wrap">
          <img src="${imgSrc}" alt="${escapeHtml(evento.nome)}" class="event-card__img">
        </div>
        <div class="event-card__info">
          <p><strong>Data:</strong> ${escapeHtml(dateStr)}</p>
          <p><strong>Local:</strong> ${escapeHtml(localStr)}</p>
        </div>
      `;

      container.appendChild(article);
    }

    eventosProximos.forEach(evento => criarCartaoEvento(evento, false, upcomingContainer));
    eventosPassados.forEach(evento => criarCartaoEvento(evento, true, pastContainer));

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
      const newNext = c.next.cloneNode(true);
      const newBack = c.back.cloneNode(true);
      c.next.parentNode.replaceChild(newNext, c.next);
      c.back.parentNode.replaceChild(newBack, c.back);

      newNext.addEventListener('click', () => {
        c.container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
      newBack.addEventListener('click', () => {
        c.container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', loadEventsAPI);
document.addEventListener('DOMContentLoaded', initEventForm);