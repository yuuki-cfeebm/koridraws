import { API_BASE_URL } from './config.js';

let carouselInterval;

async function carregarDetalhesDoEvento() {
    const url = new URLSearchParams(window.location.search);
    const idEvento = url.get('id');

    if (!idEvento) {
        exibirErro();
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/Eventos/${idEvento}`);
        
        if (resposta.ok) {
            const eventoData = await resposta.json();
            preencherTela(eventoData);
            inicializarAcoesGerente(eventoData.id, eventoData.nome);
        } else {
            exibirErro();
        }
    } catch (erro) {
        exibirErro();
    }
}

function formatDriveLink(url) {
    if (!url || !url.includes('/d/')) return url;
    const idImg = url.split('/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${idImg}&sz=w1000`;
}

function formatarDataHora(dataString) {
    const dataObj = new Date(dataString);
    if (Number.isNaN(dataObj.valueOf())) return 'Data não informada';

    const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const opcoesHora = { hour: '2-digit', minute: '2-digit' };
    
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', opcoesData);
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', opcoesHora);

    return `${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)} às ${horaFormatada}`;
}

function formatarEndereco(endereco) {
    if (!endereco) return 'Local a definir';
    
    const complemento = endereco.complemento ? ` - ${endereco.complemento}` : '';
    return `${endereco.rua}, ${endereco.numero}${complemento}<br>${endereco.bairro} - ${endereco.cidadeNome}<br>CEP: ${endereco.cep}`;
}

function exibirErro() {
    const container = document.getElementById('evento-container');
    const erroDiv = document.getElementById('evento-error');
    
    if (container) container.style.display = 'none';
    if (erroDiv) erroDiv.style.display = 'block';
}

function preencherTela(evento) {
    const container = document.getElementById('evento-container');
    if (container) container.style.display = 'flex';

    const titleEl = document.getElementById('evento-title');
    const dateEl = document.getElementById('evento-date');
    const locationEl = document.getElementById('evento-location');
    const descEl = document.getElementById('evento-description');
    
    if (titleEl) titleEl.textContent = evento.nome;
    if (dateEl) dateEl.textContent = formatarDataHora(evento.data);
    if (locationEl) locationEl.innerHTML = formatarEndereco(evento.endereco);
    if (descEl) descEl.textContent = evento.descricao;

    setupSlider(evento.imagens);
}

function setupSlider(imagensArray) {
    const sliderSection = document.getElementById('evento-slider-section');
    const track = document.getElementById('evento-carousel-track');
    const bulletsContainer = document.getElementById('evento-bullets-container');
    
    if (!imagensArray || imagensArray.length === 0) {
        sliderSection.style.display = 'none';
        return;
    }

    sliderSection.style.display = 'block';
    track.innerHTML = '';
    bulletsContainer.innerHTML = '';

    const btnPrev = document.getElementById('btn-evento-prev');
    const btnNext = document.getElementById('btn-evento-next');

    if (imagensArray.length === 1) {
        btnPrev.style.display = 'none';
        btnNext.style.display = 'none';
    } else {
        btnPrev.style.display = 'flex';
        btnNext.style.display = 'flex';
    }

    const bulletsArray = [];

    imagensArray.forEach((imgData, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'evento-slide';
        
        const imgEl = document.createElement('img');
        imgEl.src = formatDriveLink(imgData.url || imgData.caminhoCloud);
        imgEl.alt = "Imagem do Evento";
        
        slideDiv.appendChild(imgEl);
        track.appendChild(slideDiv);

        if (imagensArray.length > 1) {
            const bullet = document.createElement('div');
            bullet.className = 'evento-bullet';
            if (index === 0) bullet.classList.add('active');
            
            bullet.addEventListener('click', () => {
                goToSlide(index);
                resetInterval();
            });

            bulletsContainer.appendChild(bullet);
            bulletsArray.push(bullet);
        }
    });

    let currentIndex = 0;
    const totalSlides = imagensArray.length;

    function updateSliderPosition() {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        bulletsArray.forEach((b, i) => {
            b.classList.toggle('active', i === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateSliderPosition();
    }

    function nextSlide() {
        currentIndex = (currentIndex < totalSlides - 1) ? currentIndex + 1 : 0;
        updateSliderPosition();
    }

    function prevSlide() {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalSlides - 1;
        updateSliderPosition();
    }

    function resetInterval() {
        if (carouselInterval) clearInterval(carouselInterval);
        if (totalSlides > 1) {
            carouselInterval = setInterval(nextSlide, 3500);
        }
    }

    if (totalSlides > 1) {
        btnNext.addEventListener('click', () => {
            nextSlide();
            resetInterval();
        });

        btnPrev.addEventListener('click', () => {
            prevSlide();
            resetInterval();
        });

        resetInterval();
    }
}

function inicializarAcoesGerente(idEvento, nomeEvento) {
    const papelUsuario = localStorage.getItem('koridraws_user_role');
    const token = localStorage.getItem('koridraws_token');
    const painelAcoes = document.getElementById('gerente-actions');
    const btnDelete = document.getElementById('btn-delete-evento');
    const msgDelete = document.getElementById('msg-delete-evento');

    if (papelUsuario !== 'Gerente' || !token || !painelAcoes) {
        return;
    }

    painelAcoes.style.display = 'block';

    if (btnDelete) {
        btnDelete.addEventListener('click', async () => {
            const confirmar = confirm(`Tem a certeza que deseja excluir permanentemente o evento "${nomeEvento}"? Esta ação não pode ser desfeita.`);
            
            if (!confirmar) return;

            btnDelete.disabled = true;
            btnDelete.textContent = "A excluir...";
            if (msgDelete) msgDelete.textContent = "";

            try {
                const response = await fetch(`${API_BASE_URL}/Eventos/Delete/${idEvento}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Admin-Key': 'SUA_CHAVE_AQUI'
                    }
                });

                if (response.ok) {
                    if (msgDelete) {
                        msgDelete.textContent = "Evento excluído com sucesso. A redirecionar...";
                        msgDelete.style.color = "#27ae60";
                    }
                    setTimeout(() => {
                        window.location.href = '/assets/pages/agenda.html';
                    }, 1500);
                } else {
                    throw new Error("Erro ao excluir.");
                }
            } catch (error) {
                if (msgDelete) {
                    msgDelete.textContent = "Erro ao excluir o evento. Verifique a sua conexão.";
                    msgDelete.style.color = "#c0392b";
                }
                btnDelete.disabled = false;
                btnDelete.textContent = "Excluir Evento";
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', carregarDetalhesDoEvento);