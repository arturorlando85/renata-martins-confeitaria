/* Busca produtos, categorias, promoções e dados da loja no Supabase.
   Se não estiver configurado ou não responder a tempo, o site
   abre com os dados de js/dados.js. */
(function () {
  "use strict";

  const ILUSTRACAO_PADRAO = {
    caixas: { tipo: "caixa", qtd: 9, fita: "#FD9CAF" },
    bolos: { tipo: "bolo", massa: "#6B3B22", calda: "#3E2418" },
  };

  const buscar = (tabela, consulta, sinal) =>
    fetch(`${SUPABASE.url}/rest/v1/${tabela}?${consulta}`, {
      headers: { apikey: SUPABASE.chave },
      signal: sinal,
    }).then((r) => {
      if (!r.ok) throw new Error(`${tabela}: ${r.status}`);
      return r.json();
    });

  const fotoUrl = (path) => `${SUPABASE.url}/storage/v1/object/public/produtos/${path.split("/").map(encodeURIComponent).join("/")}`;

  async function carregar() {
    if (!SUPABASE.url || !SUPABASE.chave) return;

    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 6000);
    try {
      const [loja, categorias, produtos, campanhas] = await Promise.all([
        buscar("loja", "select=*&id=eq.1", controle.signal),
        buscar("categorias", "select=id,nome&visivel=eq.true&order=ordem.asc,nome.asc", controle.signal),
        buscar("produtos", "select=*&visivel=eq.true&order=ordem.asc,nome.asc", controle.signal),
        buscar("campanhas", "select=*&visivel=eq.true&order=ordem.asc", controle.signal),
      ]);

      if (loja[0]) {
        const l = loja[0];
        Object.assign(LOJA, {
          nome: l.nome,
          whatsapp: l.whatsapp || LOJA.whatsapp,
          instagram: l.instagram || LOJA.instagram,
          cidade: l.cidade || LOJA.cidade,
          horario: l.horario || LOJA.horario,
          antecedenciaDias: l.antecedencia_dias,
          taxaEntrega: Number(l.taxa_entrega),
          formasPagamento: l.formas_pagamento && l.formas_pagamento.length ? l.formas_pagamento : LOJA.formasPagamento,
          sobreTitulo: l.sobre_titulo,
          sobreTexto: l.sobre_texto,
        });
      }

      CATEGORIAS.splice(0, CATEGORIAS.length, { id: "todos", nome: "Todos" },
        ...categorias.map((c) => ({ id: c.id, nome: c.nome })));

      // "Todos" segue a ordem das categorias e, dentro delas, a ordem dos produtos
      const posCategoria = (id) => {
        const i = categorias.findIndex((c) => c.id === id);
        return i === -1 ? categorias.length : i;
      };
      produtos.sort((a, b) => posCategoria(a.categoria_id) - posCategoria(b.categoria_id) || a.ordem - b.ordem);

      PRODUTOS.splice(0, PRODUTOS.length, ...produtos.map((p) => ({
        id: p.id,
        categoria: p.categoria_id,
        nome: p.nome,
        descricao: p.descricao,
        preco: Number(p.preco),
        precoPromo: p.preco_promo === null ? undefined : Number(p.preco_promo),
        unidade: p.unidade,
        destaque: p.destaque,
        esgotado: p.esgotado,
        foto: p.foto_path ? fotoUrl(p.foto_path) : null,
        ilustracao: p.ilustracao || ILUSTRACAO_PADRAO[p.categoria_id] || { tipo: "brigadeiro" },
      })));

      CAMPANHAS.splice(0, CAMPANHAS.length, ...campanhas.map((c) => ({
        titulo: c.titulo,
        texto: c.texto,
        selo: c.selo,
        cor: c.cor,
        inicio: c.inicio || "",
        fim: c.fim || "",
        produto: c.produto_id,
      })));
    } catch (e) {
      console.warn("Usando dados de reserva do site:", e.message);
    } finally {
      clearTimeout(limite);
    }
  }

  carregar().then(iniciarSite);
})();
