module.exports = {
  apps: [
    {
      name: 'scoreboard-nuxt',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5151,
        NUXT_PUBLIC_SOCKET_URL: 'https://socket.scoreboard.acoes.cc',
      },
      error_file: './logs/scoreboard-nuxt-error.log',
      out_file: './logs/scoreboard-nuxt-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
