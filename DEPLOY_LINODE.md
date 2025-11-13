# Deploy no Linode VPS com PM2

## Requisitos no Servidor

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Nginx (para proxy reverso)
sudo apt install nginx -y
```

## Configuração Inicial

### 1. Clone o repositório

```bash
cd /var/www
sudo git clone https://github.com/cledsonmedeiros/score-board.git
cd score-board
sudo chown -R $USER:$USER .
```

### 2. Configure as variáveis de ambiente

Crie o arquivo `.env`:

```bash
nano .env
```

Adicione:

```env
NUXT_PUBLIC_SOCKET_URL=http://seu-dominio.com:3001
# ou se usar proxy reverso nginx:
# NUXT_PUBLIC_SOCKET_URL=https://seu-dominio.com
```

### 3. Build e Start

```bash
# Tornar o script executável
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

Ou manualmente:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Start com PM2
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
pm2 save

# Auto-start no boot
pm2 startup
# Execute o comando que o PM2 sugerir
```

## Configuração do Nginx (Proxy Reverso)

### Opção 1: Sem SSL

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Nuxt App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opção 2: Com SSL (Certbot)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

Configuração nginx com SSL:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    # Nuxt App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Salvar em: `/etc/nginx/sites-available/scoreboard`

```bash
# Criar symlink
sudo ln -s /etc/nginx/sites-available/scoreboard /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Atualizar a Aplicação

```bash
cd /var/www/score-board
git pull
./deploy.sh
```

## Comandos Úteis PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs específicos
pm2 logs scoreboard-nuxt
pm2 logs scoreboard-socket

# Monitor
pm2 monit

# Restart
pm2 restart all
pm2 restart scoreboard-nuxt
pm2 restart scoreboard-socket

# Stop
pm2 stop all

# Delete
pm2 delete all

# Recarregar configuração
pm2 reload ecosystem.config.cjs
```

## Firewall (UFW)

```bash
# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Se não usar nginx, permitir portas diretas
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Ativar firewall
sudo ufw enable
```

## Troubleshooting

### Ver logs

```bash
pm2 logs --lines 100
```

### Reiniciar tudo

```bash
pm2 restart all
```

### Limpar logs

```bash
pm2 flush
```

### Se algo der errado

```bash
# Parar tudo
pm2 stop all

# Rebuild
pnpm build

# Restart
pm2 start ecosystem.config.cjs
```

## Monitoramento

```bash
# Instalar PM2 web dashboard (opcional)
pm2 install pm2-server-monit
```
