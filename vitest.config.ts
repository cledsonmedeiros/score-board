import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Mesmo alias do Nuxt, para testar módulos (ex.: stores) que importam via `~/`.
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.{test,spec}.ts'],
  },
})
