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
      error_file: './logs/nuxt-error.log',
      out_file: './logs/nuxt-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'scoreboard-socket',
      script: 'server/socket-server.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 5152,
      },
      error_file: './logs/socket-error.log',
      out_file: './logs/socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
}
