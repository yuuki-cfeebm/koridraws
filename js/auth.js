import { API_BASE_URL } from './config.js';

const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const btnShowRegister = document.getElementById('btn-show-register');
const btnShowLogin = document.getElementById('btn-show-login');
const formRegister = document.getElementById('form-register');
const formLogin = document.getElementById('form-login');
const formForgot = document.getElementById('form-forgot');
const formReset = document.getElementById('form-reset');

function toggleLoading(btn, isLoading, defaultText) {
  if (isLoading) {
    btn.disabled = true;
    btn.textContent = 'Aguarde...';
    btn.style.opacity = '0.7';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.textContent = defaultText;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

if (btnShowRegister && btnShowLogin) {
  btnShowRegister.addEventListener('click', () => {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
  });

  btnShowLogin.addEventListener('click', () => {
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
  });
}

if (formRegister) {
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = formRegister.querySelector('button[type="submit"]');
    toggleLoading(btnSubmit, true, 'Cadastrar');

    const nome = document.getElementById('reg-nome').value.trim();
    const sobrenome = document.getElementById('reg-sobrenome').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const senha = document.getElementById('reg-senha').value.trim();

    const formDataRegistro = new FormData();
    formDataRegistro.append('Nome', `${nome} ${sobrenome}`);
    formDataRegistro.append('Email', email);
    formDataRegistro.append('Senha', senha);
    formDataRegistro.append('Perfil', 'Cliente');

    try {
      const resRegistro = await fetch(`${API_BASE_URL}/Auth/registro`, {
        method: 'POST',
        body: formDataRegistro
      });

      if (!resRegistro.ok) {
        throw new Error('Erro ao criar conta. Verifique os dados fornecidos.');
      }

      const formDataLogin = new FormData();
      formDataLogin.append('Email', email);
      formDataLogin.append('Senha', senha);

      const resLogin = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        body: formDataLogin
      });

      if (!resLogin.ok) {
        throw new Error('Conta criada com sucesso, mas ocorreu uma falha ao iniciar sessão automaticamente.');
      }

      const dataText = await resLogin.text();
      let token = dataText;
      let primeiroNome = nome.split(' ')[0];
      let papelUsuario = "Cliente";

      try {
        const js = JSON.parse(dataText);
        if (js.token) token = js.token;
        if (js.usuario && js.usuario.nome) primeiroNome = js.usuario.nome.split(' ')[0];
        if (js.usuario && js.usuario.papel) papelUsuario = js.usuario.papel;
      } catch(err) {}

      localStorage.setItem('koridraws_token', token);
      localStorage.setItem('koridraws_user_name', primeiroNome);
      localStorage.setItem('koridraws_user_role', papelUsuario);
      window.location.href = '/assets/pages/perfil.html';

    } catch (error) {
      console.error(error);
      alert(error.message || 'Não foi possível realizar o cadastro no momento.');
      toggleLoading(btnSubmit, false, 'Cadastrar');
    }
  });
}

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = formLogin.querySelector('button[type="submit"]');
    toggleLoading(btnSubmit, true, 'Entrar');

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();

    const formData = new FormData();
    formData.append('Email', email);
    formData.append('Senha', senha);

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Credenciais inválidas.');
      }

      const dataText = await response.text();
      let token = dataText;
      let primeiroNome = "Usuário";
      let papelUsuario = "Cliente";

      try {
        const js = JSON.parse(dataText);
        if (js.token) token = js.token;
        if (js.usuario && js.usuario.nome) primeiroNome = js.usuario.nome.split(' ')[0];
        if (js.usuario && js.usuario.papel) papelUsuario = js.usuario.papel;
      } catch(err) {}

      localStorage.setItem('koridraws_token', token);
      localStorage.setItem('koridraws_user_name', primeiroNome);
      localStorage.setItem('koridraws_user_role', papelUsuario);
      window.location.href = '/index.html';

    } catch (error) {
      console.error(error);
      alert('Email ou senha incorretos.');
      toggleLoading(btnSubmit, false, 'Entrar');
    }
  });
}

if (formForgot) {
    formForgot.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('input-email-esqueci');
        const mensagemContainer = document.getElementById('msg-esqueci-senha');
        const btnSubmit = formForgot.querySelector('button[type="submit"]');
        
        toggleLoading(btnSubmit, true, 'Enviar Instruções');

        const formData = new FormData();
        formData.append('Email', emailInput.value.trim());

        try {
            const response = await fetch(`${API_BASE_URL}/Auth/esqueci-senha`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                mensagemContainer.textContent = "Se o e-mail estiver registado, receberá as instruções em breve.";
                mensagemContainer.style.color = "#27ae60";
                emailInput.value = '';
            } else {
                throw new Error();
            }
        } catch (error) {
            mensagemContainer.textContent = "Erro ao processar a solicitação. Tente novamente mais tarde.";
            mensagemContainer.style.color = "#c0392b";
        } finally {
            toggleLoading(btnSubmit, false, 'Enviar Instruções');
        }
    });
}

if (formReset) {
    formReset.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('input-email-reset');
        const senhaInput = document.getElementById('input-nova-senha');
        const tokenInput = document.getElementById('input-token-reset');
        const mensagemContainer = document.getElementById('msg-reset-senha');
        const btnSubmit = formReset.querySelector('button[type="submit"]');

        if (senhaInput.value.length < 6) {
            mensagemContainer.textContent = "A nova senha deve ter pelo menos 6 caracteres.";
            mensagemContainer.style.color = "#c0392b";
            return;
        }

        toggleLoading(btnSubmit, true, 'Salvar Nova Senha');

        const formData = new FormData();
        formData.append('Email', emailInput.value.trim());
        formData.append('Token', tokenInput.value.trim());
        formData.append('NovaSenha', senhaInput.value);

        try {
            const response = await fetch(`${API_BASE_URL}/Auth/resetar-senha`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                mensagemContainer.textContent = "Senha redefinida com sucesso! A redirecionar...";
                mensagemContainer.style.color = "#27ae60";
                setTimeout(() => {
                    window.location.href = '/assets/pages/auth.html';
                }, 2000);
            } else {
                throw new Error();
            }
        } catch (error) {
            mensagemContainer.textContent = "Erro ao redefinir a senha. Verifique os dados fornecidos.";
            mensagemContainer.style.color = "#c0392b";
            toggleLoading(btnSubmit, false, 'Salvar Nova Senha');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const tokenInput = document.getElementById('input-token-reset');
    
    if (token && tokenInput) {
        tokenInput.value = token;
    }
});