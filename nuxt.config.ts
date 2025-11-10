// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: ['@nuxt/fonts', '@nuxt/scripts', '@nuxt/icon', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: {
        lang: 'pt-BR',
      },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'ScoreBoard',
      meta: [
        {
          name: 'description',
          content:
            'Sistema completo de placar digital e gerenciamento de times. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
        },
        {
          name: 'keywords',
          content:
            'placar digital, scoreboard, gerenciamento de times, sorteio de equipes, pontuação, esportes, placar eletrônico, times balanceados',
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
            'Sistema completo de placar digital e gerenciamento de times. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
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
            'Sistema completo de placar digital e gerenciamento de times. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
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
          content: '#dc2626',
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