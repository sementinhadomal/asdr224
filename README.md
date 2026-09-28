# Shopify Checkout Leads — painel para Vercel

Pacote focado no painel interno Shopify Checkout Leads. Inclui o frontend, o cliente tipado da API, os arquivos de build e a configuração do Vercel. Não inclui o servidor API nem o banco de dados.

## O que é necessário para mostrar dados

O painel chama a API Shopify existente. Configure `VITE_API_BASE_URL` como a origem pública do servidor API (sem `/api` no final), e o servidor precisa permitir chamadas do domínio Vercel e validar tokens da mesma aplicação Clerk configurada no painel.

O painel de métricas e leads não funcionará até existir uma API acessível com os endpoints Shopify e um banco conectado. A base de produção Replit estava pausada quando este ZIP foi preparado; se continuar usando essa API, reative-a antes de configurar o domínio.

## Publicar pelo GitHub e Vercel

1. Extraia o ZIP e envie o conteúdo da pasta para um repositório GitHub.
2. No Vercel, importe esse repositório e mantenha o diretório raiz do projeto como `./`.
3. Em **Environment Variables**, configure:
   - `VITE_CLERK_PUBLISHABLE_KEY`: chave pública da mesma aplicação Clerk usada pelo servidor API.
   - `VITE_API_BASE_URL`: origem HTTPS do servidor API, sem barra final nem `/api`.
   - `VITE_CLERK_PROXY_URL`: opcional; preencha apenas se sua configuração Clerk exigir um proxy.
4. Publique/reconstrua o projeto depois de salvar as variáveis.

O `vercel.json` já define instalação, build, pasta de saída e fallback de rotas. O build publica o painel na raiz do domínio Vercel.

## Desenvolvimento local

```sh
cp .env.example .env.local
# Preencha as variáveis do Clerk e da API em .env.local
pnpm install --frozen-lockfile
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/shopify-checkout-leads run dev
```

## Segurança e escopo

- Não inclua `CLERK_SECRET_KEY`, `DATABASE_URL` ou outras chaves privadas em variáveis `VITE_*`; variáveis Vite são incorporadas ao código público do navegador.
- Credenciais do Clerk e do PostgreSQL, permissões de acesso e tabelas pertencem ao servidor API, que não está neste pacote.
- Este ZIP contém somente o painel Shopify; não inclui os temas da loja, páginas Ticketmaker, dashboard Stripe ou backend.
