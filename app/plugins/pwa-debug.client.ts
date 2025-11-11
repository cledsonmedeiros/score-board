export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    // Log para debug do service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('[PWA] Service Worker ready:', registration)
      })

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed')
      })
    } else {
      console.log('[PWA] Service Worker not supported')
    }
  }
})
