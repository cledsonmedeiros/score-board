# Score Board - Configuração WebSockets na Vercel

## Variáveis de Ambiente

Configure esta variável de ambiente no painel da Vercel:

```
NUXT_PUBLIC_SOCKET_URL=https://seu-app.vercel.app
```

**Importante**: Substitua `seu-app.vercel.app` pela URL real do seu deploy na Vercel.

## Como Funciona

### Desenvolvimento Local
- URL padrão: `http://localhost:3000`
- Socket.IO roda no mesmo servidor Nitro
- Não precisa configurar nada

### Produção (Vercel)
- Defina `NUXT_PUBLIC_SOCKET_URL` com a URL do seu app
- O Socket.IO usa a mesma instância do servidor Nuxt/Nitro
- Funciona com Serverless Functions da Vercel

## Recursos

### Salas Interativas
- **Criar Sala**: Host cria uma sala com código único (ex: ABC123)
- **Compartilhar**: Link direto `https://seu-app.vercel.app/?room=ABC123`
- **Sincronização**: Todos veem mudanças em tempo real

### O que Sincroniza
- ✅ Jogadores adicionados/removidos
- ✅ Times sorteados
- ✅ Placares atualizados
- ✅ Reset de placar
- ✅ Participantes entrando/saindo

### Limitações da Vercel
- Salas expiram após 24 horas
- Timeout de 10 segundos em conexões (limitação Serverless)
- Não usa sticky sessions (pode ter problemas com múltiplas regiões)

## Deploy

1. Conecte seu repositório na Vercel
2. Adicione a variável de ambiente `NUXT_PUBLIC_SOCKET_URL`
3. Deploy! 🚀

## Alternativas para Produção

Se precisar de melhor performance:

1. **Fly.io** - Suporta WebSockets nativamente
2. **Railway** - WebSockets + persistência
3. **DigitalOcean App Platform** - Funciona bem com Socket.IO
4. **Render** - Deploy gratuito com WebSockets

Todas essas plataformas suportam Nuxt 3 com Socket.IO sem limitações.
