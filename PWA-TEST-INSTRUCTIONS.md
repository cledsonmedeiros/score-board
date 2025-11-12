# Como testar o PWA Offline

## Mudanças implementadas:

1. **Service Worker configurado com:**
   - `clientsClaim: true` - Ativa o SW imediatamente
   - `skipWaiting: true` - Pula a espera por outras abas fechadas
   - `scope: '/'` - Define o escopo completo do app
   - Cache de todos os assets (JS, CSS, HTML, imagens, fontes)
   - Cache dos ícones Iconify (30 dias)

2. **Precache de 35 arquivos** (588.74 KiB)

## Passos para testar:

### 1. Fazer deploy da nova versão

```bash
git add .
git commit -m "feat: PWA offline configurado"
git push
```

### 2. No iPhone após o deploy:

1. **Remova o app atual da tela inicial** (se já tiver instalado)
   - Mantenha pressionado o ícone
   - Toque em "Remover App"

2. **Abra o Safari e acesse** a URL do seu app na Vercel

3. **Abra o DevTools** (se possível via computador conectado) para ver os logs:
   - `[PWA] Service Worker ready` - SW registrado
   - `PWA v1.1.0` - Versão do PWA
   - `precache 35 entries` - Arquivos em cache

4. **Adicione à tela inicial** novamente
   - Toque no botão de compartilhar
   - "Adicionar à Tela Inicial"

5. **Navegue pelo app** com internet conectada
   - Acesse todas as páginas principais
   - Isso força o cache de todos os recursos

6. **Feche o app completamente**
   - Deslize para cima e feche
   - Ou force quit

7. **Ative o modo avião**

8. **Abra o app** - Deve funcionar offline!

## Debug se não funcionar:

No Safari Desktop conectado ao iPhone:

1. Safari > Develop > [Seu iPhone] > [Seu Site]
2. Verifique no Console:

   ```javascript
   // Ver service workers registrados
   navigator.serviceWorker.getRegistrations()
   
   // Ver cache
   caches.keys()
   ```

## Notas importantes:

- ⚠️ **PWA só funciona em HTTPS** (Vercel já fornece)
- ⚠️ **Service Worker não funciona em localhost** para iOS
- ⚠️ **Cache é específico por domínio** (não funciona entre diferentes URLs)
- ✅ **LocalStorage funciona offline** (jogadores e times persistem)
