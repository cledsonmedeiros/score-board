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
    '@nuxt/fonts',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'ScoreBoard',
      short_name: 'ScoreBoard',
      description:
        'Sistema completo de placar digital e gerenciamento de equipes',
      theme_color: '#EF4444',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//, /\/offline\.html$/],
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      globIgnores: ['offline.html'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'cdn-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/api\.iconify\.design\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'iconify-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: 'module',
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
        // Theme color
        {
          name: 'theme-color',
          content: '#EF4444',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon.ico',
        },
        {
          rel: 'manifest',
          href: '/manifest.json',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
      ],
      script: [{ src: 'https://cdn.tailwindcss.com' }],
    },
  },
})
