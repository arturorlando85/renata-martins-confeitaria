/* Chamado por js/carregar.js depois que os dados do site estão prontos. */
function iniciarSite() {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const precoFinal = (p) => (typeof p.precoPromo === "number" ? p.precoPromo : p.preco);
  const produtoPorId = (id) => PRODUTOS.find((p) => p.id === id);
  const waLink = (texto) => `https://wa.me/${LOJA.whatsapp}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  /* ---------- Datas ---------- */
  const hojeISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const somaDiasISO = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const formataData = (iso) => iso.split("-").reverse().join("/");

  /* ---------- Links e textos fixos ---------- */
  $$(".js-whatsapp").forEach((a) => (a.href = waLink("Olá, Renata! Vim pelo site e gostaria de mais informações.")));
  $$(".js-instagram").forEach((a) => (a.href = LOJA.instagram));
  $("#contactHours").textContent = LOJA.horario;
  $("#contactCity").textContent = LOJA.cidade;
  $("#year").textContent = new Date().getFullYear();
  if (LOJA.sobreTitulo) $("#sobreTitulo").textContent = LOJA.sobreTitulo;
  if (LOJA.sobreTexto) {
    $("#sobreTexto").innerHTML = LOJA.sobreTexto.split(/\n\s*\n/).map((par) => `<p>${esc(par.trim())}</p>`).join("");
  }
  $("#howNote").textContent =
    `Encomendas com no mínimo ${LOJA.antecedenciaDias} dia${LOJA.antecedenciaDias === 1 ? "" : "s"} de antecedência. Atendimento: ${LOJA.horario}.`;

  /* ---------- Menu mobile ---------- */
  const nav = $("#nav");
  const navToggle = $("#navToggle");
  navToggle.addEventListener("click", () => {
    const aberto = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", aberto);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Campanhas ---------- */
  const hoje = hojeISO();
  const campanhasAtivas = CAMPANHAS.filter((c) => (!c.inicio || c.inicio <= hoje) && (!c.fim || c.fim >= hoje));

  if (campanhasAtivas.length) {
    const c = campanhasAtivas[0];
    const topbar = $("#topbar");
    topbar.innerHTML = `${esc(c.titulo)} <a href="#promocoes">Saiba mais</a>`;
    topbar.hidden = false;
  }

  const promoGrid = $("#promoGrid");
  if (!campanhasAtivas.length) {
    $("#promocoes").hidden = true;
    $$('a[href="#promocoes"]').forEach((a) => (a.hidden = true));
  } else {
    promoGrid.innerHTML = campanhasAtivas.map((c) => `
      <article class="promo promo--${esc(c.cor || "rosa")}">
        <span class="promo-tag">${esc(c.selo || "Promoção")}</span>
        <h3>${esc(c.titulo)}</h3>
        <p>${esc(c.texto)}</p>
        ${c.fim ? `<span class="promo-until">Válido até ${formataData(c.fim)}</span>` : ""}
        ${c.produto && produtoPorId(c.produto) && !produtoPorId(c.produto).esgotado
          ? `<button class="btn btn-small" data-add="${esc(c.produto)}">Quero esse!</button>`
          : `<a class="btn btn-small" href="#cardapio">Ver cardápio</a>`}
      </article>`).join("");
  }

  /* ---------- Ilustrações (usadas enquanto não há foto) ---------- */
  const forminha = (cx, base, w) => {
    // pétalas da forminha, no estilo do símbolo da marca
    const petalas = [-0.42, -0.21, 0, 0.21, 0.42].map((f, i) => {
      const x = cx + f * w;
      const inclina = f * 40;
      return `<ellipse cx="${x}" cy="${base - 22}" rx="${i === 0 || i === 4 ? 6 : 7}" ry="26" fill="#ADDED8" transform="rotate(${inclina} ${x} ${base})"/>`;
    }).join("");
    return `${petalas}<rect x="${cx - w * 0.38}" y="${base - 2}" width="${w * 0.76}" height="4" rx="2" fill="#ADDED8"/>`;
  };

  const coberturas = {
    granulado: (cx, cy) => [[-22, -14, 30], [-6, -24, -20], [10, -18, 60], [22, -6, 10], [-14, 2, -50], [4, -4, 20], [-26, -2, 80], [14, 6, -30]]
      .map(([dx, dy, r]) => `<rect x="${cx + dx - 4}" y="${cy + dy - 1.5}" width="8" height="3" rx="1.5" fill="#2B170D" transform="rotate(${r} ${cx + dx} ${cy + dy})"/>`).join(""),
    po: (cx, cy) => `<ellipse cx="${cx}" cy="${cy - 18}" rx="20" ry="8" fill="#fff" opacity=".9"/><circle cx="${cx + 4}" cy="${cy - 8}" r="6" fill="#5C3420"/>`,
    coco: (cx, cy) => [[-20, -12], [-8, -22], [8, -20], [20, -10], [-14, 0], [2, -8], [14, 2], [-2, 6]]
      .map(([dx, dy]) => `<path d="M${cx + dx - 3} ${cy + dy} q3 -4 6 0" stroke="#E8DCC8" stroke-width="2" fill="none" stroke-linecap="round"/>`).join(""),
    picado: (cx, cy) => [[-16, -14], [0, -22], [14, -14], [-6, -4], [10, -2], [-20, 0]]
      .map(([dx, dy]) => `<rect x="${cx + dx - 3}" y="${cy + dy - 3}" width="6" height="5" rx="1" fill="#6E8B3D"/>`).join(""),
    cristal: (cx, cy) => [[-18, -12], [-6, -22], [8, -18], [20, -8], [-12, 0], [4, -6], [14, 4], [-22, 2], [0, 6]]
      .map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="1.8" fill="#fff" opacity=".85"/>`).join(""),
    graos: (cx, cy) => [[-12, -14, 20], [8, -18, -30], [0, -2, 60]]
      .map(([dx, dy, r]) => `<g transform="rotate(${r} ${cx + dx} ${cy + dy})"><ellipse cx="${cx + dx}" cy="${cy + dy}" rx="5" ry="7" fill="#1E110A"/><path d="M${cx + dx} ${cy + dy - 6} v12" stroke="#6B3B22" stroke-width="1.2"/></g>`).join(""),
  };

  const svgBrigadeiro = (cx, base, r, bola, cobertura) => `
    <circle cx="${cx}" cy="${base - r - 6}" r="${r}" fill="${bola}"/>
    <path d="M${cx - r * 0.9} ${base - r - 14} a${r} ${r} 0 0 1 ${r * 1.8} 0" stroke="#864F30" stroke-width="4" fill="none" stroke-linecap="round" opacity="${bola === "#5C3420" || bola === "#3E2418" ? 0 : 1}"/>
    ${(coberturas[cobertura] || coberturas.granulado)(cx, base - r - 6)}
    ${forminha(cx, base + 4, r * 2.4)}`;

  const ilustrar = (p) => {
    const il = p.ilustracao || {};
    if (il.tipo === "caixa") {
      const n = il.qtd >= 16 ? 4 : il.qtd >= 9 ? 3 : 2;
      const sabores = ["#5C3420", "#FBF3E6", "#FD9CAF", "#B7C98A", "#C98A4F", "#FFFDF8"];
      const cel = 120 / n;
      let bolas = "";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        bolas += `<circle cx="${40 + cel * j + cel / 2}" cy="${60 + cel * i + cel / 2}" r="${cel * 0.36}" fill="${sabores[(i * n + j) % sabores.length]}" stroke="#ADDED8" stroke-width="3"/>`;
      }
      return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(p.nome)}">
        <rect x="28" y="48" width="144" height="144" rx="14" fill="#fff" stroke="#E2CAC6" stroke-width="3"/>
        ${bolas}
        <rect x="94" y="44" width="12" height="152" fill="${il.fita}" opacity=".85"/>
        <path d="M100 46 c-20 -26 -44 -10 -24 2 z M100 46 c20 -26 44 -10 24 2 z" fill="${il.fita}"/>
        <circle cx="100" cy="46" r="7" fill="${il.fita}"/>
      </svg>`;
    }
    if (il.tipo === "bolo") {
      return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(p.nome)}">
        <ellipse cx="100" cy="170" rx="80" ry="12" fill="#E2CAC6"/>
        <rect x="40" y="90" width="120" height="76" rx="10" fill="${il.massa}"/>
        <rect x="40" y="118" width="120" height="8" fill="#fff" opacity=".55"/>
        <path d="M40 100 q0 -18 18 -18 h84 q18 0 18 18 v6 q-10 14 -20 0 q-10 16 -20 0 q-10 16 -20 0 q-10 16 -20 0 q-10 16 -20 0 q-10 14 -20 0 z" fill="${il.calda}"/>
        ${[70, 100, 130].map((x) => `<circle cx="${x}" cy="74" r="9" fill="#5C3420"/><path d="M${x - 8} 72 a8 8 0 0 1 16 0" stroke="#FD9CAF" stroke-width="3" fill="none"/>`).join("")}
      </svg>`;
    }
    if (il.tipo === "pote") {
      return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(p.nome)}">
        <rect x="60" y="34" width="80" height="18" rx="6" fill="#FD9CAF"/>
        <path d="M58 56 h84 l-6 112 q-1 10 -12 10 h-48 q-11 0 -12 -10 z" fill="#fff" stroke="#E2CAC6" stroke-width="3"/>
        <path d="M62 80 h76 l-1 22 h-74 z" fill="${il.recheio}"/>
        <path d="M63 102 h74 l-1 22 h-72 z" fill="#E8C9A6"/>
        <path d="M64 124 h72 l-1 22 h-70 z" fill="${il.recheio}"/>
        <path d="M65 146 h70 l-1 18 q-1 8 -10 8 h-48 q-9 0 -10 -8 z" fill="#E8C9A6"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(p.nome)}">
      <ellipse cx="100" cy="176" rx="60" ry="8" fill="#E2CAC6" opacity=".7"/>
      ${svgBrigadeiro(100, 170, 46, il.bola || "#5C3420", il.cobertura)}
    </svg>`;
  };

  /* ---------- Cardápio ---------- */
  const filtros = $("#filters");
  const grid = $("#productGrid");
  let categoriaAtual = "todos";

  filtros.innerHTML = CATEGORIAS
    .filter((c) => c.id === "todos" || PRODUTOS.some((p) => p.categoria === c.id))
    .map((c) => `<button class="filter" role="tab" data-cat="${esc(c.id)}" aria-selected="${c.id === categoriaAtual}">${esc(c.nome)}</button>`)
    .join("");

  const renderProdutos = () => {
    const lista = PRODUTOS.filter((p) => categoriaAtual === "todos" || p.categoria === categoriaAtual);
    grid.innerHTML = lista.map((p) => {
      const promo = typeof p.precoPromo === "number";
      return `
      <article class="product">
        <div class="product-media">
          ${p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nome)}" loading="lazy">` : ilustrar(p)}
          ${p.destaque ? `<span class="badge">Mais pedido</span>` : ""}
          ${promo ? `<span class="badge badge--promo">Promo</span>` : ""}
        </div>
        <div class="product-body">
          <h3>${esc(p.nome)}</h3>
          <p>${esc(p.descricao)}</p>
          <div class="product-foot">
            <div class="price">
              ${promo ? `<del>${brl(p.preco)}</del>` : ""}
              ${brl(precoFinal(p))} <small>/ ${esc(p.unidade)}</small>
            </div>
            ${p.esgotado
              ? `<button class="add-btn" disabled>Esgotado</button>`
              : `<button class="add-btn" data-add="${esc(p.id)}">Adicionar</button>`}
          </div>
        </div>
      </article>`;
    }).join("");
  };

  filtros.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    categoriaAtual = btn.dataset.cat;
    $$(".filter", filtros).forEach((b) => b.setAttribute("aria-selected", b === btn));
    renderProdutos();
  });
  renderProdutos();

  /* ---------- Carrinho ---------- */
  const CHAVE = "rm-carrinho";
  let carrinho = {};
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    Object.keys(salvo).forEach((id) => { if (produtoPorId(id) && !produtoPorId(id).esgotado && salvo[id] > 0) carrinho[id] = salvo[id]; });
  } catch (_) { carrinho = {}; }

  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (_) { /* sem storage */ } };
  const subtotal = () => Object.entries(carrinho).reduce((s, [id, q]) => s + precoFinal(produtoPorId(id)) * q, 0);
  const totalItens = () => Object.values(carrinho).reduce((s, q) => s + q, 0);

  const drawer = $("#drawer");
  const overlay = $("#overlay");
  const toast = $("#toast");
  let toastTimer;

  const mostrarToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const abrirCarrinho = () => {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    $("#cartClose").focus();
  };
  const fecharCarrinho = () => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  const recebimento = () => $('input[name="recebimento"]:checked').value;

  const renderCarrinho = () => {
    const itens = Object.entries(carrinho);
    const vazio = itens.length === 0;
    $("#cartEmpty").hidden = !vazio;
    $("#checkout").hidden = vazio;
    $("#drawerFoot").hidden = vazio;

    $("#cartItems").innerHTML = itens.map(([id, q]) => {
      const p = produtoPorId(id);
      return `
      <li class="cart-item" data-id="${esc(id)}">
        <div>
          <h4>${esc(p.nome)}</h4>
          <span class="unit">${brl(precoFinal(p))} / ${esc(p.unidade)}</span>
        </div>
        <span class="line-total">${brl(precoFinal(p) * q)}</span>
        <div class="qty">
          <button type="button" data-qty="-1" aria-label="Diminuir">−</button>
          <input type="number" min="1" max="999" value="${q}" aria-label="Quantidade de ${esc(p.nome)}">
          <button type="button" data-qty="1" aria-label="Aumentar">+</button>
        </div>
        <button type="button" class="remove">Remover</button>
      </li>`;
    }).join("");

    const entrega = recebimento() === "Entrega";
    const taxa = entrega ? LOJA.taxaEntrega : 0;
    $("#deliveryLine").hidden = !entrega;
    $("#deliveryFee").textContent = LOJA.taxaEntrega > 0 ? brl(LOJA.taxaEntrega) : "a combinar";
    $("#subtotal").textContent = brl(subtotal());
    $("#total").textContent = brl(subtotal() + taxa);

    const cont = $("#cartCount");
    cont.textContent = totalItens();
    cont.classList.remove("bump");
    void cont.offsetWidth;
    cont.classList.add("bump");
  };

  const alterarQtd = (id, qtd) => {
    if (qtd <= 0) delete carrinho[id];
    else carrinho[id] = Math.min(999, qtd);
    salvar();
    renderCarrinho();
  };

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (!add) return;
    const id = add.dataset.add;
    alterarQtd(id, (carrinho[id] || 0) + 1);
    mostrarToast(`${produtoPorId(id).nome} adicionado ao pedido`);
  });

  $("#cartItems").addEventListener("click", (e) => {
    const li = e.target.closest(".cart-item");
    if (!li) return;
    const id = li.dataset.id;
    const btn = e.target.closest("[data-qty]");
    if (btn) alterarQtd(id, carrinho[id] + Number(btn.dataset.qty));
    if (e.target.closest(".remove")) alterarQtd(id, 0);
  });
  $("#cartItems").addEventListener("change", (e) => {
    if (!e.target.matches("input")) return;
    const id = e.target.closest(".cart-item").dataset.id;
    alterarQtd(id, Math.floor(Number(e.target.value)) || 0);
  });

  $("#cartOpen").addEventListener("click", abrirCarrinho);
  $("#cartClose").addEventListener("click", fecharCarrinho);
  $("#cartBrowse").addEventListener("click", fecharCarrinho);
  overlay.addEventListener("click", fecharCarrinho);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) fecharCarrinho(); });

  /* ---------- Checkout ---------- */
  const form = $("#checkout");
  const erro = $("#formError");
  const dataMin = somaDiasISO(LOJA.antecedenciaDias);
  form.data.min = dataMin;
  form.data.value = dataMin;
  $("#payment").innerHTML = `<option value="">Selecione</option>` +
    LOJA.formasPagamento.map((f) => `<option>${esc(f)}</option>`).join("");

  $$('input[name="recebimento"]', form).forEach((r) => r.addEventListener("change", () => {
    $(".js-endereco", form).hidden = recebimento() !== "Entrega";
    renderCarrinho();
  }));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    erro.textContent = "";
    $$(".invalid", form).forEach((el) => el.classList.remove("invalid"));

    const entrega = recebimento() === "Entrega";
    const obrigatorios = ["nome", "telefone", "data", "pagamento"].concat(entrega ? ["endereco"] : []);
    const faltando = obrigatorios.filter((n) => !form[n].value.trim());
    faltando.forEach((n) => form[n].classList.add("invalid"));

    if (faltando.length) {
      erro.textContent = "Preencha os campos obrigatórios (*).";
      form[faltando[0]].focus();
      return;
    }
    if (form.data.value < dataMin) {
      form.data.classList.add("invalid");
      erro.textContent = `Escolha uma data a partir de ${formataData(dataMin)} (antecedência mínima de ${LOJA.antecedenciaDias} dias).`;
      form.data.focus();
      return;
    }
    if (form.telefone.value.replace(/\D/g, "").length < 10) {
      form.telefone.classList.add("invalid");
      erro.textContent = "Informe um telefone com DDD.";
      form.telefone.focus();
      return;
    }

    const linhas = Object.entries(carrinho).map(([id, q]) => {
      const p = produtoPorId(id);
      return `• ${q}x ${p.nome} — ${brl(precoFinal(p) * q)}`;
    });
    const taxa = entrega ? LOJA.taxaEntrega : 0;

    const msg = [
      "*Novo pedido pelo site*",
      "",
      ...linhas,
      "",
      `Subtotal: ${brl(subtotal())}`,
      entrega ? `Entrega: ${taxa > 0 ? brl(taxa) : "a combinar"}` : null,
      `*Total: ${brl(subtotal() + taxa)}*`,
      "",
      `*Nome:* ${form.nome.value.trim()}`,
      `*Telefone:* ${form.telefone.value.trim()}`,
      `*Recebimento:* ${recebimento()}`,
      entrega ? `*Endereço:* ${form.endereco.value.trim()}` : null,
      `*Data:* ${formataData(form.data.value)}${form.hora.value ? " às " + form.hora.value : ""}`,
      `*Pagamento:* ${form.pagamento.value}`,
      form.obs.value.trim() ? `*Observações:* ${form.obs.value.trim()}` : null,
    ].filter((l) => l !== null).join("\n");

    window.open(waLink(msg), "_blank", "noopener");
    mostrarToast("Pedido pronto! Finalize o envio no WhatsApp!");
  });

  renderCarrinho();
}
