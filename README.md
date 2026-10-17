# Renata Martins Confeitaria — site

Site simples (HTML/CSS/JS puro, sem build) para divulgar produtos e campanhas e **receber pedidos online**, seguindo o manual de identidade visual da marca (paleta, logo, ícone "R" e selo).

## Como o pedido funciona

1. O cliente adiciona produtos ao **Meu pedido** (o carrinho fica salvo no navegador).
2. Preenche nome, telefone, retirada ou entrega (com endereço), data (respeitando a antecedência mínima), horário, pagamento e observações.
3. Ao clicar em **Enviar pedido pelo WhatsApp**, o pedido completo, com itens, total e dados, abre já escrito no WhatsApp da confeitaria. Basta confirmar com o cliente.

## O que editar (tudo em `js/dados.js`)

| O quê | Onde |
|---|---|
| **Número do WhatsApp** que recebe os pedidos (obrigatório!) | `LOJA.whatsapp`, no formato `55` + DDD + número, só dígitos |
| Cidade, horário, antecedência, taxa de entrega, formas de pagamento | objeto `LOJA` |
| **Campanhas/promoções** (faixa do topo + cartões) | lista `CAMPANHAS`. Use `inicio`/`fim` (AAAA-MM-DD) para entrarem e saírem do ar sozinhas |
| **Produtos**, preços e preços promocionais | lista `PRODUTOS` (`preco`, `precoPromo`, `destaque`) |
| Fotos reais | salve em `assets/produtos/` e troque `foto: null` por `foto: "assets/produtos/arquivo.jpg"` |

> Os produtos, preços e textos atuais são **exemplos**. O Instagram exige login, então não deu para copiar o cardápio real. Revise antes de publicar.

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
