// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  // O app é 100% client-side (Pinia + localStorage, sem chamadas de API).
  // Pré-renderizar as duas páginas gera HTML estático de verdade para cada
  // rota, que o service worker consegue colocar em cache — sem isso, o
  // documento HTML nunca existiria como arquivo para funcionar offline.
  routeRules: {
    '/': { prerender: true },
    '/manage': { prerender: true },
  },

  // O app nunca usa itálico — evita baixar/precachear a variante 'italic'
  // de cada peso da Roboto (metade dos arquivos de fonte, sem uso nenhum).
  fonts: {
    families: [{ name: 'Roboto', styles: ['normal'] }],
  },

  pwa: {
    registerType: 'autoUpdate',
    manifestFilename: 'manifest.json',
    includeAssets: ['favicon.ico', 'scoreboard-logo.svg'],
    manifest: {
      name: 'ScoreBoard',
      short_name: 'ScoreBoard',
      description:
        'Sistema completo de placar digital e gerenciamento de equipes',
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#EF4444',
      orientation: 'any',
      categories: ['sports', 'utilities'],
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      // Pré-armazena todo o app (JS, CSS, HTML das duas páginas, ícones e
      // fontes) para funcionar 100% offline assim que instalado uma vez.
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
    },
    client: {
      // Verifica se há uma versão nova sempre que a página é aberta e,
      // enquanto o app fica aberto, também a cada 1h — assim que encontra
      // uma versão nova, atualiza e recarrega sozinho (registerType acima).
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
    },
  },

  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'pt-BR',
      },
      charset: 'utf-8',
      viewport:
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      title: 'ScoreBoard',
      meta: [
        {
          name: 'description',
          content:
            'Sistema completo de placar digital e gerenciamento de equipes. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
        },
        {
          name: 'keywords',
          content:
            'placar digital, scoreboard, gerenciamento de equipes, sorteio de equipes, pontuação, esportes, placar eletrônico, equipes balanceadas',
        },
        { name: 'author', content: 'Cledson Medeiros' },
        { name: 'robots', content: 'index, follow' },
        // Open Graph
        {
          property: 'og:title',
          content: 'ScoreBoard',
        },
        {
          property: 'og:description',
          content:
            'Sistema completo de placar digital e gerenciamento de equipes. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
        },
        {
          property: 'og:type',
          content: 'website',
        },
        {
          property: 'og:site_name',
          content: 'ScoreBoard',
        },
        {
          property: 'og:locale',
          content: 'pt_BR',
        },
        {
          property: 'og:image',
          content: '/icon-512x512.png',
        },
        {
          property: 'og:image:width',
          content: '512',
        },
        {
          property: 'og:image:height',
          content: '512',
        },
        {
          property: 'og:image:alt',
          content: 'ScoreBoard - Sistema de Placar Digital',
        },
        // Twitter Card
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: 'ScoreBoard',
        },
        {
          name: 'twitter:description',
          content:
            'Sistema completo de placar digital e gerenciamento de equipes. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
        },
        {
          name: 'twitter:image',
          content: '/icon-512x512.png',
        },
        {
          name: 'twitter:image:alt',
          content: 'ScoreBoard - Sistema de Placar Digital',
        },
        // Theme color inicial (equipe vermelha no topo, orientação retrato).
        // app/pages/index.vue atualiza essa mesma tag dinamicamente conforme
        // a orientação do dispositivo muda.
        {
          name: 'theme-color',
          content: '#EF4444',
        },
        // Safari/iPadOS não confia só no manifest.json para o modo
        // standalone e o nome do ícone — precisa dessas tags dedicadas.
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'apple-mobile-web-app-title',
          content: 'ScoreBoard',
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
      ],
    },
  },
})
