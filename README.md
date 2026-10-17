# Renata Martins Confeitaria — site

Site simples (HTML/CSS/JS puro, sem build) para divulgar produtos e campanhas e **receber pedidos online**, seguindo o manual de identidade visual da marca (paleta, logo, ícone "R" e selo).

## Como o pedido funciona

1. O cliente adiciona produtos ao **Meu pedido** (o carrinho fica salvo no navegador).
2. Preenche nome, telefone, retirada ou entrega (com endereço), data (respeitando a antecedência mínima), horário, pagamento e observações.
3. Ao clicar em **Enviar pedido pelo WhatsApp**, o pedido completo, com itens, total e dados, abre já escrito no WhatsApp da confeitaria. Basta confirmar com o cliente.

## Painel de edição (CMS)

O conteúdo do site (produtos, fotos, promoções, categorias e dados da loja) é editado pelo painel em **`/admin`**, com login pela conta Google. Os dados ficam no **Supabase**. Se o Supabase não estiver configurado ou não responder, o site abre com os dados de reserva de `js/dados.js`.

- **Dona** (`renatachm@gmail.com` na instalação): edita tudo e é a única que libera ou remove acessos.
- **Editor**: edita o conteúdo, mas não mexe em acessos.
- As regras de acesso ficam no próprio banco (RLS), não só na tela. O painel nunca fica sem nenhuma Dona.

Guia de uso para a Renata: [`docs/guia-do-painel.md`](docs/guia-do-painel.md).

### Instalação (uma vez só)

1. **Projeto Supabase:** crie um projeto (região São Paulo, `sa-east-1`) e rode, no SQL Editor e nesta ordem, `supabase/001_cms.sql` e `supabase/002_dados_iniciais.sql`.
2. **Login com Google:**
   - No Google Cloud Console, crie um "ID do cliente OAuth" do tipo **Aplicativo da Web** e use como URI de redirecionamento autorizado a URL de callback que o Supabase mostra em *Authentication → Sign In / Providers → Google* (`https://<projeto>.supabase.co/auth/v1/callback`).
   - No Supabase, ative o provedor **Google** com o Client ID e o Client Secret.
   - Em *Authentication → Sign In / Providers*, **desative o provedor Email**. O banco já só aceita login feito pelo Google, mas assim ninguém cria conta por e-mail e senha.
   - Em *Authentication → URL Configuration*, coloque `https://renata-martins-confeitaria.vercel.app` como **Site URL** e `https://renata-martins-confeitaria.vercel.app/admin/` em **Redirect URLs**.
3. **Conectar o site:** em `js/supabase-config.js`, preencha `url` (Project URL) e `chave` (publishable key). A chave publishable é pública e pode ficar no código. **Nunca** coloque aqui a chave `secret`/`service_role`.

### Fotos

As fotos são reduzidas no navegador para no máximo 1200 px (WebP) antes do envio e ficam no bucket público `produtos`. Ao trocar ou remover a foto de um produto, a antiga é apagada.

## Identidade visual aplicada

- Cores do manual: `#864F30`, `#E2CAC6`, `#F5E0CD`, `#A3BAB4`, `#ADDED8`, `#FD9CAF` e o creme do pattern.
- Tipografia: **Montserrat** (do manual) para textos. **Quicksand** (Google Fonts) para títulos, como substituta arredondada próxima do logo, já que a Cocomat não está disponível no Google Fonts.
- Logos extraídos do PDF em `assets/img/` (`logo.png`, `icone.png`, `selo.png`, `favicon.png`).

## Testar e publicar

```bash
cd renata-martins-confeitaria
python3 -m http.server 8080   # abra http://localhost:8080
```

Para publicar, importe este repositório em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, Cloudflare Pages), sem comando de build.
