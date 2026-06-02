import { API_BASE_URL } from './config.js';

let perfilNome, perfilEmail, enderecosList, btnNovoEndereco, formEnderecoContainer, formEndereco, btnCancelarEndereco, selectEstado, selectCidade, formTitle;
let cacheEstados = [];

function bindElements() {
  perfilNome = document.getElementById('perfil-nome');
  perfilEmail = document.getElementById('perfil-email');
  enderecosList = document.getElementById('enderecos-list');
  btnNovoEndereco = document.getElementById('btn-novo-endereco');
  formEnderecoContainer = document.getElementById('endereco-form-container');
  formEndereco = document.getElementById('form-endereco');
  btnCancelarEndereco = document.getElementById('btn-cancelar-endereco');
  selectEstado = document.getElementById('end-estado');
  selectCidade = document.getElementById('end-cidadeId');
  formTitle = document.getElementById('form-endereco-title');
}

async function loadProfile() {
  const token = localStorage.getItem('koridraws_token');
  
  if (!token) {
    window.location.href = '/assets/pages/auth.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/Perfil`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('koridraws_token');
        window.location.href = '/assets/pages/auth.html';
      }
      throw new Error('Falha ao carregar o perfil');
    }

    const perfilText = await response.text();
    const data = perfilText ? JSON.parse(perfilText) : {};
    
    if (perfilNome) perfilNome.textContent = data.perfil?.nome || 'Utilizador';
    if (perfilEmail) perfilEmail.textContent = data.perfil?.email || 'Não informado';

    renderEnderecos(data.enderecos || []);
  } catch (error) {
    console.error(error);
    if (perfilNome) perfilNome.textContent = "Erro ao carregar dados";
  }
}

function renderEnderecos(enderecos) {
  if (!enderecosList) return;
  enderecosList.innerHTML = '';

  if (!enderecos || enderecos.length === 0) {
    enderecosList.innerHTML = '<p class="empty-state">Não possui nenhuma morada guardada.</p>';
    return;
  }

  enderecos.forEach(end => {
    const card = document.createElement('div');
    card.className = 'endereco-card';

    const cidadeNome = end.cidade?.descricao || '';
    const estadoSigla = end.cidade?.estado?.sigla || '';
    const formatCidadeEstado = cidadeNome && estadoSigla ? `${cidadeNome} / ${estadoSigla}` : 'Cidade não identificada';

    card.innerHTML = `
      <div class="endereco-info">
        <p><strong>${end.rua}, ${end.numero}</strong></p>
        <p>${end.complemento || ''}</p>
        <p>${end.bairro} - ${end.cep}</p>
        <p>${formatCidadeEstado}</p>
      </div>
      <div class="endereco-actions">
        <button class="btn-edit" data-id="${end.id}">Editar</button>
        <button class="btn-delete" data-id="${end.id}">Remover</button>
      </div>
    `;

    enderecosList.appendChild(card);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => editEndereco(e.target.dataset.id, enderecos));
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteEndereco(e.target.dataset.id));
  });
}

async function loadEstados() {
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
    console.error(error);
  }
  return [];
}

async function loadCidades(estadoId, cidadeSelecionadaId = null) {
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

      if (cidadeSelecionadaId) {
        selectCidade.value = cidadeSelecionadaId;
      }
    }
  } catch (error) {
    console.error(error);
    selectCidade.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

async function editEndereco(id, enderecos) {
  const endereco = enderecos.find(e => e.id.toString() === id.toString());
  if (!endereco) return;

  await loadEstados();

  document.getElementById('end-id').value = endereco.id;
  document.getElementById('end-rua').value = endereco.rua || '';
  document.getElementById('end-numero').value = endereco.numero || '';
  document.getElementById('end-bairro').value = endereco.bairro || '';
  document.getElementById('end-cep').value = endereco.cep || '';
  document.getElementById('end-complemento').value = endereco.complemento || '';

  const estadoId = endereco.cidade?.estadoId;
  const cidadeId = endereco.cidadeId;

  if (estadoId) {
    selectEstado.value = estadoId;
    await loadCidades(estadoId, cidadeId);
  } else {
    selectCidade.innerHTML = '<option value="" disabled selected>Selecione um estado primeiro</option>';
    selectCidade.disabled = true;
  }

  formTitle.textContent = 'Editar Morada';
  formEnderecoContainer.style.display = 'block';
}

async function deleteEndereco(id) {
  if (!confirm('Tem a certeza que deseja remover esta morada?')) return;

  const token = localStorage.getItem('koridraws_token');

  try {
    const response = await fetch(`${API_BASE_URL}/Enderecos/Delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Falha ao remover a morada');

    await loadProfile();
  } catch (error) {
    console.error(error);
    alert('Erro ao remover a morada.');
  }
}

function initProfile() {
  bindElements();
  
  if (perfilNome) {
    loadProfile();
  }

  if (selectEstado) {
    selectEstado.addEventListener('change', (e) => loadCidades(e.target.value));
  }

  if (btnNovoEndereco) {
    btnNovoEndereco.addEventListener('click', () => {
      formEndereco.reset();
      document.getElementById('end-id').value = '';
      formTitle.textContent = 'Adicionar Nova Morada';
      selectCidade.innerHTML = '<option value="" disabled selected>Selecione um estado primeiro</option>';
      selectCidade.disabled = true;
      formEnderecoContainer.style.display = 'block';
      loadEstados();
    });
  }

  if (btnCancelarEndereco) {
    btnCancelarEndereco.addEventListener('click', () => {
      formEnderecoContainer.style.display = 'none';
      formEndereco.reset();
    });
  }

  if (formEndereco) {
    formEndereco.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('koridraws_token');
      const id = document.getElementById('end-id').value;
      const isUpdate = !!id;

      const formData = new FormData();
      formData.append('Rua', document.getElementById('end-rua').value.trim());
      formData.append('Numero', document.getElementById('end-numero').value.trim());
      formData.append('Bairro', document.getElementById('end-bairro').value.trim());
      formData.append('Cep', document.getElementById('end-cep').value.trim());
      formData.append('Complemento', document.getElementById('end-complemento').value.trim());
      formData.append('CidadeId', document.getElementById('end-cidadeId').value);

      const url = isUpdate 
        ? `${API_BASE_URL}/Enderecos/Put/${id}` 
        : `${API_BASE_URL}/Enderecos/Post`;
      
      const method = isUpdate ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) throw new Error('Falha ao guardar a morada');

        formEnderecoContainer.style.display = 'none';
        formEndereco.reset();
        await loadProfile();
      } catch (error) {
        console.error(error);
        alert('Erro ao guardar a morada.');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfile);
} else {
  initProfile();
}