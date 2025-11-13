# Deploy na Vercel - ScoreBoard com WebSockets

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Repositório Git (GitHub, GitLab, Bitbucket)

## 🚀 Deploy Passo a Passo

### 1. Configurar Variável de Ambiente

Na Vercel, vá em **Settings → Environment Variables** e adicione:

```
NUXT_PUBLIC_SOCKET_URL
```

**Valor:** A URL do seu app na Vercel (ex: `https://seu-app.vercel.app`)

⚠️ **Importante:** Adicione esta variável **antes** do primeiro deploy!

### 2. Deploy Automático

1. Conecte seu repositório na Vercel
2. A Vercel detectará automaticamente que é um projeto Nuxt
3. Clique em **Deploy**

### 3. Após o Deploy

1. Copie a URL do seu app (ex: `https://seu-app.vercel.app`)
2. Volte em **Settings → Environment Variables**
3. Atualize `NUXT_PUBLIC_SOCKET_URL` com a URL real
4. Force um novo deploy (Settings → Deployments → Redeploy)

## 🔧 Configurações da Vercel

### Build & Development Settings

Geralmente a Vercel detecta automaticamente, mas se precisar configurar manualmente:

- **Framework Preset:** Nuxt.js
- **Build Command:** `pnpm run build`
- **Output Directory:** `.output/public`
- **Install Command:** `pnpm install`

### Variáveis de Ambiente

```bash
# Produção
NUXT_PUBLIC_SOCKET_URL=https://seu-app.vercel.app

# Preview (opcional - branches)
NUXT_PUBLIC_SOCKET_URL=https://seu-app-git-preview-username.vercel.app
```

## 🧪 Testar Localmente

```bash
# Instalar dependências
pnpm install

# Development
pnpm dev

# Build de produção local
pnpm build
pnpm preview
```

## 🌐 Como Funciona

### WebSockets com Vercel

O Nuxt usa o Nitro server que suporta WebSockets nativamente. Na Vercel:

- ✅ **Long polling** funciona out-of-the-box
- ✅ **WebSockets** funciona com o adapter correto
- ✅ Salas são mantidas em memória (resetam a cada deploy)

### Fluxo de Funcionamento

1. **Host cria sala** → Gera código único (ex: ABC123)
2. **Sistema gera link** → `https://seu-app.vercel.app/?room=ABC123`
3. **Participantes acessam link** → Entram automaticamente na sala
4. **Sincronização em tempo real:**
   - Jogadores adicionados/removidos
   - Times sorteados
   - Placares atualizados
   - Reset de placares

## 📱 Compartilhamento de Sala

### Opção 1: Link Direto (Recomendado)
```
https://seu-app.vercel.app/?room=ABC123
```
Participantes clicam e já entram direto na sala!

### Opção 2: Código Manual
Participantes acessam o site e digitam: **ABC123**

## ⚡ Limitações e Considerações

### Memória Efêmera
- Salas são mantidas em memória
- Um redeploy limpa todas as salas ativas
- Para persistência, adicione Redis (Upstash)

### Escalabilidade
- Funciona perfeitamente para grupos pequenos/médios
- Para muitas salas simultâneas, considere:
  - Upstash Redis para state
  - Pusher/Ably para WebSockets dedicados

### Timeout
- Vercel tem limite de 10s para Hobby plan
- WebSockets de long-polling compensam isso
- Para Pro plan, timeout é maior

## 🔒 Segurança

### Validações Implementadas
- ✅ Códigos de sala únicos
- ✅ Host validation (apenas host pode modificar times)
- ✅ Auto-cleanup de salas antigas (24h)
- ✅ Cleanup quando host desconecta

### Melhorias Futuras (Opcional)
- Rate limiting
- Autenticação de usuários
- Senha para salas privadas
- Moderação de nomes/conteúdo

## 🐛 Troubleshooting

### "Erro ao criar sala"
- Verifique se `NUXT_PUBLIC_SOCKET_URL` está configurada
- Certifique-se que a URL não tem `/` no final

### "Sala não encontrada"
- Sala pode ter expirado (24h)
- Host pode ter saído/desconectado
- Redeploy resetou todas as salas

### WebSockets não conectam
- Verifique console do browser
- Confirme URL no .env está correta
- Tente usar link em HTTPS

## 📚 Recursos Adicionais

- [Nuxt Deployment](https://nuxt.com/docs/getting-started/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Socket.IO](https://socket.io/docs/v4/)
- [Nitro Server](https://nitro.unjs.io/)

## 🎉 Pronto!

Seu ScoreBoard agora está rodando com salas interativas em tempo real! 🚀

Compartilhe links diretos e divirta-se! 🎮
