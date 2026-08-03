import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Registro automático do Service Worker com checagem constante de atualização (PWA Always Fresh)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com sucesso:', reg.scope)
        // Forçar busca imediata de atualizações no servidor
        reg.update()
        // Checar periodicamente a cada 5 minutos
        setInterval(() => {
          reg.update()
        }, 5 * 60 * 1000)
      })
      .catch((err) => console.error('[PWA] Erro ao registrar Service Worker:', err))
  })

  // Recarregar a página automaticamente quando a nova versão do Service Worker for ativada
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      console.log('[PWA] Nova versão instalada e ativada. Atualizando aplicação...')
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
