let registration: ServiceWorkerRegistration | undefined
let available = false
let applying = false
export const hasAppUpdate = () => available
function announce() {
  available = true
  window.dispatchEvent(new Event('app_update_available'))
}
export function applyAppUpdate() {
  applying = true
  if (registration?.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  else window.location.reload()
}
export function registerAppUpdates() {
  if (!('serviceWorker' in navigator)) return
  let hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController && !applying) { hadController = true; return }
    if (applying) window.location.reload()
    else announce()
  })
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((reg) => {
      registration = reg
      if (reg.waiting) announce()
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announce()
        })
      })
      void reg.update().catch(() => undefined)
      window.setInterval(() => { void reg.update().catch(() => undefined) }, 3 * 60 * 1000)
    }).catch(() => undefined)
  }, { once: true })
}
