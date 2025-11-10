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
      title: 'Score Board - Sistema de Placar e Gerenciamento de Times',
      meta: [
        {
          name: 'description',
          content: 'Sistema completo de placar digital e gerenciamento de times. Sorteie equipes balanceadas, acompanhe pontuações em tempo real e gerencie jogadores com facilidade.',
        },
        {
          name: 'keywords',
          content: 'placar digital, scoreboard, gerenciamento de times, sorteio de equipes, pontuação, esportes',
        },
        { name: 'author', content: 'Score Board' },
        { name: 'robots', content: 'index, follow' },
        // Open Graph
        {
          property: 'og:site_name',
          content: 'Score Board',
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
          content: 'Score Board - Sistema de Placar',
        },
        // Twitter Card
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:image',
          content: '/icon-512x512.png',
        },
        {
          name: 'twitter:image:alt',
          content: 'Score Board - Sistema de Placar',
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