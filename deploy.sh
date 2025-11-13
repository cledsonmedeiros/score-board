#!/bin/bash

# Script de deploy para VPS Linode
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do ScoreBoard..."

# 1. Build da aplicação
echo "📦 Building aplicação..."
pnpm install --frozen-lockfile
pnpm build

# 2. Criar diretório de logs se não existir
mkdir -p logs

# 3. Restart com PM2
echo "🔄 Reiniciando serviços com PM2..."
pm2 restart ecosystem.config.cjs

# 4. Save PM2 config
pm2 save

echo "✅ Deploy concluído com sucesso!"
echo ""
echo "Comandos úteis:"
echo "  pm2 status          - Ver status dos serviços"
echo "  pm2 logs            - Ver logs de todos os serviços"
echo "  pm2 logs scoreboard-nuxt   - Ver logs do Nuxt"
echo "  pm2 logs scoreboard-socket - Ver logs do Socket.IO"
echo "  pm2 monit           - Monitor em tempo real"
echo "  pm2 restart all     - Reiniciar todos os serviços"
echo "  pm2 stop all        - Parar todos os serviços"
