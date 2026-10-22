/**
 * Versão instalada e atualização manual do app (PWA).
 *
 * `forceUpdate` remove o service worker e o cache do app e recarrega a
 * página, que volta a ser baixada da rede na versão mais recente. Jogadores,
 * equipes e placar ficam no localStorage e não são apagados.
 */
export const useAppUpdate = () => {
  const { appVersion, buildTime } = useRuntimeConfig().public
  const notify = useNotify()
  const { askConfirm } = usePrompt()

  const buildDate = new Date(buildTime).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const versionLabel = `Versão ${appVersion} · ${buildDate}`

  const forceUpdate = async () => {
    if (!navigator.onLine) {
      notify.error('Sem internet. Conecte-se para atualizar o app.')
      return
    }

    const confirmed = await askConfirm({
      title: 'Forçar atualização?',
      message:
        'O app vai baixar a versão mais recente e recarregar.\n' +
        'Jogadores, equipes e placar continuam salvos.',
      confirmLabel: 'Atualizar agora',
    })
    if (!confirmed) return

    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(registrations.map((r) => r.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
    window.location.reload()
  }

  return { versionLabel, forceUpdate }
}
