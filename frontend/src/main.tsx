import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Atualização silenciosa e automática do ícone da barra de tarefas / PWA
const forceSilentIconUpdate = () => {
  try {
    const v = '2.0.1';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
    iconLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const cleanHref = href.split('?')[0];
        link.setAttribute('href', `${cleanHref}?v=${v}`);
      }
    });
  } catch (e) {
    console.debug('[PWA Icon Auto-Update]', e);
  }
};

// Executar atualização silenciosa de ícones no carregamento
forceSilentIconUpdate();

// Registro automático do Service Worker com checagem constante de atualização (PWA Always Fresh)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker v4 registrado com sucesso:', reg.scope)
        // Forçar busca imediata de atualizações no servidor
        reg.update()
        // Checar periodicamente a cada 3 minutos
        setInterval(() => {
          reg.update()
        }, 3 * 60 * 1000)
      })
      .catch((err) => console.error('[PWA] Erro ao registrar Service Worker:', err))
  })

  // Recarregar a aplicação silenciosamente apenas quando houver atualização de versão
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      console.log('[PWA] Nova versão instalada e ativada. Atualizando ícones e cache...')
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
