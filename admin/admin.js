(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const numOuNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
  const formataData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
  const hojeISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };
  const CORES = { rosa: "#FD9CAF", menta: "#ADDED8", pessego: "#F5E0CD", salvia: "#A3BAB4", rose: "#E2CAC6" };

  /* ---------- Aviso ---------- */
  let avisoTimer;
  const avisar = (msg, erro = false) => {
    const el = $("#aviso");
    el.textContent = msg;
    el.classList.toggle("erro-aviso", erro);
    el.classList.add("mostrar");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.classList.remove("mostrar"), erro ? 5000 : 2500);
  };
  const traduzErro = (e) => {
    const m = (e && e.message) || String(e);
    if (/row-level security|permission denied|42501/i.test(m)) return "Você não tem permissão para fazer isso.";
    if (/pelo menos uma Dona|alterar o e-mail/.test(m)) return m.replace(/^.*?:\s*/, "");
    if (/duplicate key|already exists/i.test(m)) return "Já existe um cadastro com esse valor.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Verifique a internet e tente de novo.";
    return "Algo deu errado: " + m;
  };

  /* ---------- Telas ---------- */
  const mostrarTela = (id) => {
    ["telaCarregando", "telaLogin", "telaPainel"].forEach((t) => ($("#" + t).hidden = t !== id));
  };

  if (!window.supabase || !SUPABASE.url || !SUPABASE.chave) {
    mostrarTela("telaLogin");
    $("#loginMsg").textContent = "O painel ainda não foi conectado ao banco de dados.";
    $("#loginMsg").classList.add("erro");
    $("#btnGoogle").hidden = true;
    return;
  }

  const sb = window.supabase.createClient(SUPABASE.url, SUPABASE.chave);
  const fotoUrl = (path) => sb.storage.from("produtos").getPublicUrl(path).data.publicUrl;

  let papel = null;
  let emailUsuario = "";
  const dados = { produtos: [], categorias: [], campanhas: [], loja: null, acessos: [] };

  /* ---------- Login ---------- */
  $("#btnGoogle").addEventListener("click", async () => {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } },
    });
    if (error) avisar(traduzErro(error), true);
  });
  const sair = async () => {
    await sb.auth.signOut();
    location.reload();
  };
  $("#btnSair").addEventListener("click", sair);
  $("#btnSairLogin").addEventListener("click", sair);

  async function verificarSessao(session) {
    if (!session) {
      mostrarTela("telaLogin");
      return;
    }
    emailUsuario = (session.user.email || "").toLowerCase();
    const { data, error } = await sb.from("acessos").select("papel").eq("email", emailUsuario).maybeSingle();
    if (error || !data) {
      mostrarTela("telaLogin");
      $("#loginMsg").textContent = `A conta ${emailUsuario} não tem acesso a este painel. Peça para a Renata liberar o seu e-mail.`;
      $("#loginMsg").classList.add("erro");
      $("#btnGoogle").hidden = true;
      $("#btnSairLogin").hidden = false;
      return;
    }
    papel = data.papel;
    $("#usuarioEmail").textContent = `${emailUsuario} · ${papel === "dona" ? "Dona" : "Editor"}`;
    $("#abaAcessos").hidden = papel !== "dona";
    mostrarTela("telaPainel");
    await carregarTudo();
  }

  let sessaoVerificada = false;
  sb.auth.onAuthStateChange((evento, session) => {
    if (evento === "SIGNED_OUT") return mostrarTela("telaLogin");
    if ((evento === "INITIAL_SESSION" || evento === "SIGNED_IN") && !sessaoVerificada) {
      sessaoVerificada = !!session;
      // fora do callback para não travar o cliente de autenticação
      setTimeout(() => verificarSessao(session), 0);
    }
  });

  /* ---------- Abas ---------- */
  $$(".abas [data-aba]").forEach((btn) => btn.addEventListener("click", () => {
    $$(".abas [data-aba]").forEach((b) => b.setAttribute("aria-selected", b === btn));
    $$(".aba").forEach((s) => (s.hidden = s.id !== "aba-" + btn.dataset.aba));
  }));

  /* ---------- Carregar dados ---------- */
  async function carregarTudo() {
    const consultas = [
      sb.from("categorias").select("*").order("ordem").order("nome"),
      sb.from("produtos").select("*").order("ordem").order("nome"),
      sb.from("campanhas").select("*").order("ordem"),
      sb.from("loja").select("*").eq("id", 1).maybeSingle(),
      sb.from("acessos").select("*").order("papel").order("email"),
    ];
    const [cat, prod, camp, loja, ace] = await Promise.all(consultas);
    const erro = [cat, prod, camp, loja, ace].find((r) => r.error);
    if (erro) return avisar(traduzErro(erro.error), true);
    dados.categorias = cat.data;
    dados.produtos = prod.data;
    dados.campanhas = camp.data;
    dados.loja = loja.data;
    dados.acessos = ace.data;
    renderProdutos();
    renderCampanhas();
    renderCategorias();
    renderLoja();
    renderAcessos();
  }

  const nomeCategoria = (id) => (dados.categorias.find((c) => c.id === id) || {}).nome || "Sem categoria";

  /* =========================================================
     PRODUTOS
     ========================================================= */
  function renderProdutos() {
    const el = $("#listaProdutos");
    if (!dados.produtos.length) {
      el.innerHTML = `<p class="vazio">Nenhum produto ainda. Clique em "+ Novo produto".</p>`;
      return;
    }
    const grupos = [...dados.categorias.map((c) => c.id), null];
    el.innerHTML = grupos.map((catId) => {
      const itens = dados.produtos.filter((p) => (p.categoria_id || null) === catId
        || (catId === null && p.categoria_id && !dados.categorias.some((c) => c.id === p.categoria_id)));
      if (!itens.length) return "";
      return `<h3 class="grupo-titulo">${esc(catId ? nomeCategoria(catId) : "Sem categoria")}</h3>
        <div class="lista">${itens.map(itemProduto).join("")}</div>`;
    }).join("");
  }

  const itemProduto = (p) => `
    <div class="item ${p.visivel ? "" : "oculto"}">
      <button class="item-abrir" data-editar-produto="${esc(p.id)}">
        ${p.foto_path ? `<img class="thumb" src="${esc(fotoUrl(p.foto_path))}" alt="" loading="lazy">` : `<img class="thumb thumb-vazia" src="/assets/img/icone.png" alt="">`}
        <span class="item-info">
          <strong>${esc(p.nome)}</strong>
          <small>${p.preco_promo !== null ? `<s>${brl(p.preco)}</s> ${brl(p.preco_promo)}` : brl(p.preco)} / ${esc(p.unidade)}</small>
        </span>
      </button>
      <div class="item-lado">
        ${p.esgotado ? `<span class="etiqueta esgotado">Esgotado</span>` : ""}
        <label class="chave"><input type="checkbox" data-alternar="visivel" data-id="${esc(p.id)}" ${p.visivel ? "checked" : ""}> Visível</label>
        <label class="chave esgotar"><input type="checkbox" data-alternar="esgotado" data-id="${esc(p.id)}" ${p.esgotado ? "checked" : ""}> Esgotado</label>
      </div>
    </div>`;

  $("#listaProdutos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-editar-produto]");
    if (b) abrirProduto(dados.produtos.find((p) => p.id === b.dataset.editarProduto));
  });
  $("#listaProdutos").addEventListener("change", async (e) => {
    const chk = e.target.closest("[data-alternar]");
    if (!chk) return;
    const campo = chk.dataset.alternar;
    const { error } = await sb.from("produtos").update({ [campo]: chk.checked }).eq("id", chk.dataset.id);
    if (error) {
      chk.checked = !chk.checked;
      return avisar(traduzErro(error), true);
    }
    const p = dados.produtos.find((x) => x.id === chk.dataset.id);
    p[campo] = chk.checked;
    renderProdutos();
    avisar(campo === "visivel"
      ? (chk.checked ? "Produto voltou para o site" : "Produto escondido do site")
      : (chk.checked ? "Marcado como esgotado" : "Disponível de novo"));
  });

  /* ----- Editor de produto ----- */
  const dlgProduto = $("#dlgProduto");
  const formProduto = $("#formProduto");
  let produtoAtual = null;
  let fotoNova = null;       // Blob processado aguardando envio
  let removerFoto = false;

  function preencherSelectCategorias(valor) {
    $("#selCategoria").innerHTML = `<option value="">Sem categoria</option>` +
      dados.categorias.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");
    $("#selCategoria").value = valor || "";
  }

  function mostrarPreview(src) {
    $("#fotoPreview").innerHTML = src ? `<img src="${esc(src)}" alt="">` : "<span>Sem foto</span>";
    $("#fotoRemover").hidden = !src;
  }

  function abrirProduto(p) {
    produtoAtual = p || null;
    fotoNova = null;
    removerFoto = false;
    formProduto.reset();
    $("#erroProduto").textContent = "";
    $("#tituloProduto").textContent = p ? "Editar produto" : "Novo produto";
    $("#excluirProduto").hidden = !p;
    preencherSelectCategorias(p ? p.categoria_id : (dados.categorias[0] || {}).id);
    const f = formProduto.elements;
    f.nome.value = p ? p.nome : "";
    f.descricao.value = p ? p.descricao : "";
    f.preco.value = p ? p.preco : "";
    f.preco_promo.value = p && p.preco_promo !== null ? p.preco_promo : "";
    f.unidade.value = p ? p.unidade : "un.";
    f.visivel.checked = p ? p.visivel : true;
    f.esgotado.checked = p ? p.esgotado : false;
    f.destaque.checked = p ? p.destaque : false;
    f.ordem.value = p ? p.ordem : (Math.max(0, ...dados.produtos.map((x) => x.ordem)) + 1);
    mostrarPreview(p && p.foto_path ? fotoUrl(p.foto_path) : null);
    dlgProduto.showModal();
  }
  $("#novoProduto").addEventListener("click", () => abrirProduto(null));

  // Reduz a foto para no máximo 1200px e converte para WebP/JPEG.
  async function processarFoto(arquivo) {
    const bmp = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const gerar = (tipo) => new Promise((ok) => canvas.toBlob(ok, tipo, 0.85));
    let blob = await gerar("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await gerar("image/jpeg");
    return blob;
  }

  $("#fotoArquivo").addEventListener("change", async (e) => {
    const arq = e.target.files[0];
    e.target.value = "";
    if (!arq) return;
    try {
      fotoNova = await processarFoto(arq);
      removerFoto = false;
      mostrarPreview(URL.createObjectURL(fotoNova));
    } catch (_) {
      avisar("Não foi possível abrir essa imagem. Tente outra foto (JPG ou PNG).", true);
    }
  });
  $("#fotoRemover").addEventListener("click", () => {
    fotoNova = null;
    removerFoto = true;
    mostrarPreview(null);
  });

  formProduto.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = formProduto.elements;
    const erro = $("#erroProduto");
    erro.textContent = "";
    const preco = numOuNull(f.preco.value);
    const promo = numOuNull(f.preco_promo.value);
    if (!f.nome.value.trim()) return (erro.textContent = "Dê um nome ao produto.");
    if (preco === null || preco < 0) return (erro.textContent = "Informe um preço válido.");
    if (promo !== null && promo >= preco) return (erro.textContent = "O preço promocional precisa ser menor que o preço normal.");

    const btn = $("#salvarProduto");
    btn.disabled = true;
    btn.textContent = "Salvando...";
    const id = produtoAtual ? produtoAtual.id : crypto.randomUUID();
    const fotoAntiga = produtoAtual ? produtoAtual.foto_path : null;
    let fotoPath = fotoAntiga;

    try {
      if (fotoNova) {
        const ext = fotoNova.type === "image/webp" ? "webp" : "jpg";
        fotoPath = `${id}/${Date.now()}.${ext}`;
        const { error } = await sb.storage.from("produtos").upload(fotoPath, fotoNova, { contentType: fotoNova.type, cacheControl: "31536000" });
        if (error) throw error;
      } else if (removerFoto) {
        fotoPath = null;
      }

      const registro = {
        nome: f.nome.value.trim(),
        categoria_id: f.categoria_id.value || null,
        descricao: f.descricao.value.trim(),
        preco,
        preco_promo: promo,
        unidade: f.unidade.value.trim() || "un.",
        visivel: f.visivel.checked,
        esgotado: f.esgotado.checked,
        destaque: f.destaque.checked,
        ordem: Number(f.ordem.value) || 0,
        foto_path: fotoPath,
      };
      const { error } = produtoAtual
        ? await sb.from("produtos").update(registro).eq("id", id)
        : await sb.from("produtos").insert({ id, ...registro });
      if (error) throw error;

      if (fotoAntiga && fotoAntiga !== fotoPath) await sb.storage.from("produtos").remove([fotoAntiga]);
      dlgProduto.close();
      avisar("Produto salvo! Já está atualizado no site.");
      await carregarTudo();
    } catch (err) {
      if (fotoNova && fotoPath && fotoPath !== fotoAntiga) await sb.storage.from("produtos").remove([fotoPath]);
      erro.textContent = traduzErro(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "Salvar";
    }
  });

  $("#excluirProduto").addEventListener("click", async () => {
    if (!produtoAtual) return;
    if (!confirm(`Excluir "${produtoAtual.nome}" de vez?\n\nDica: se for só temporário, desmarque "Visível no site".`)) return;
    const { error } = await sb.from("produtos").delete().eq("id", produtoAtual.id);
    if (error) return ($("#erroProduto").textContent = traduzErro(error));
    if (produtoAtual.foto_path) await sb.storage.from("produtos").remove([produtoAtual.foto_path]);
    dlgProduto.close();
    avisar("Produto excluído.");
    await carregarTudo();
  });

  /* =========================================================
     PROMOÇÕES
     ========================================================= */
  const statusCampanha = (c) => {
    const hoje = hojeISO();
    if (!c.visivel) return ["Oculta", ""];
    if (c.inicio && c.inicio > hoje) return [`Começa ${formataData(c.inicio)}`, ""];
    if (c.fim && c.fim < hoje) return ["Encerrada", ""];
    return ["No ar", "no-ar"];
  };

  function renderCampanhas() {
    const el = $("#listaCampanhas");
    if (!dados.campanhas.length) {
      el.innerHTML = `<p class="vazio">Nenhuma promoção. Clique em "+ Nova promoção".</p>`;
      return;
    }
    el.innerHTML = dados.campanhas.map((c) => {
      const [txt, cls] = statusCampanha(c);
      const periodo = [c.inicio && `de ${formataData(c.inicio)}`, c.fim && `até ${formataData(c.fim)}`].filter(Boolean).join(" ");
      return `
      <div class="item ${cls ? "" : "oculto"}">
        <button class="item-abrir" data-editar-campanha="${esc(c.id)}">
          <span class="cor-bolinha" style="background:${CORES[c.cor] || CORES.rosa}"></span>
          <span class="item-info">
            <strong>${esc(c.titulo)}</strong>
            <small>${esc(c.selo)}${periodo ? " · " + periodo : " · sem data de fim"}</small>
          </span>
        </button>
        <div class="item-lado"><span class="etiqueta ${cls}">${esc(txt)}</span></div>
      </div>`;
    }).join("");
  }

  const dlgCampanha = $("#dlgCampanha");
  const formCampanha = $("#formCampanha");
  let campanhaAtual = null;

  function abrirCampanha(c) {
    campanhaAtual = c || null;
    formCampanha.reset();
    $("#erroCampanha").textContent = "";
    $("#excluirCampanha").hidden = !c;
    $("#selProduto").innerHTML = `<option value="">Nenhum (botão leva ao cardápio)</option>` +
      dados.produtos.map((p) => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join("");
    const f = formCampanha.elements;
    f.titulo.value = c ? c.titulo : "";
    f.texto.value = c ? c.texto : "";
    f.selo.value = c ? c.selo : "Promoção";
    f.cor.value = c ? c.cor : "rosa";
    f.inicio.value = c && c.inicio ? c.inicio : "";
    f.fim.value = c && c.fim ? c.fim : "";
    f.produto_id.value = c && c.produto_id ? c.produto_id : "";
    f.visivel.checked = c ? c.visivel : true;
    f.ordem.value = c ? c.ordem : (Math.max(0, ...dados.campanhas.map((x) => x.ordem)) + 1);
    dlgCampanha.showModal();
  }
  $("#novaCampanha").addEventListener("click", () => abrirCampanha(null));
  $("#listaCampanhas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-editar-campanha]");
    if (b) abrirCampanha(dados.campanhas.find((c) => c.id === b.dataset.editarCampanha));
  });

  formCampanha.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = formCampanha.elements;
    const erro = $("#erroCampanha");
    erro.textContent = "";
    if (!f.titulo.value.trim()) return (erro.textContent = "Dê um título à promoção.");
    if (f.inicio.value && f.fim.value && f.inicio.value > f.fim.value) return (erro.textContent = "A data de fim precisa ser depois do início.");
    const registro = {
      titulo: f.titulo.value.trim(),
      texto: f.texto.value.trim(),
      selo: f.selo.value.trim() || "Promoção",
      cor: f.cor.value,
      inicio: f.inicio.value || null,
      fim: f.fim.value || null,
      produto_id: f.produto_id.value || null,
      visivel: f.visivel.checked,
      ordem: Number(f.ordem.value) || 0,
    };
    const { error } = campanhaAtual
      ? await sb.from("campanhas").update(registro).eq("id", campanhaAtual.id)
      : await sb.from("campanhas").insert(registro);
    if (error) return (erro.textContent = traduzErro(error));
    dlgCampanha.close();
    avisar("Promoção salva!");
    await carregarTudo();
  });

  $("#excluirCampanha").addEventListener("click", async () => {
    if (!campanhaAtual || !confirm(`Excluir a promoção "${campanhaAtual.titulo}"?`)) return;
    const { error } = await sb.from("campanhas").delete().eq("id", campanhaAtual.id);
    if (error) return ($("#erroCampanha").textContent = traduzErro(error));
    dlgCampanha.close();
    avisar("Promoção excluída.");
    await carregarTudo();
  });

  /* =========================================================
     CATEGORIAS
     ========================================================= */
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function renderCategorias() {
    const el = $("#listaCategorias");
    if (!dados.categorias.length) {
      el.innerHTML = `<p class="vazio">Nenhuma categoria.</p>`;
      return;
    }
    el.innerHTML = dados.categorias.map((c) => {
      const qtd = dados.produtos.filter((p) => p.categoria_id === c.id).length;
      return `
      <div class="item ${c.visivel ? "" : "oculto"}">
        <div class="item-info">
          <strong>${esc(c.nome)}</strong>
          <small>${qtd} produto${qtd === 1 ? "" : "s"} · ordem ${c.ordem}</small>
        </div>
        <div class="item-lado">
          <label class="chave"><input type="checkbox" data-cat-visivel="${esc(c.id)}" ${c.visivel ? "checked" : ""}> Visível</label>
          <button class="btn btn-small btn-ghost" data-cat-editar="${esc(c.id)}">Editar</button>
          <button class="btn btn-small btn-link perigo" data-cat-excluir="${esc(c.id)}">Excluir</button>
        </div>
      </div>`;
    }).join("");
  }

  $("#novaCategoria").addEventListener("click", async () => {
    const nome = (prompt("Nome da nova categoria:") || "").trim();
    if (!nome) return;
    let id = slug(nome) || "categoria";
    if (dados.categorias.some((c) => c.id === id)) id += "-" + Date.now().toString(36).slice(-4);
    const ordem = Math.max(0, ...dados.categorias.map((c) => c.ordem)) + 1;
    const { error } = await sb.from("categorias").insert({ id, nome, ordem });
    if (error) return avisar(traduzErro(error), true);
    avisar("Categoria criada!");
    await carregarTudo();
  });

  $("#listaCategorias").addEventListener("change", async (e) => {
    const chk = e.target.closest("[data-cat-visivel]");
    if (!chk) return;
    const { error } = await sb.from("categorias").update({ visivel: chk.checked }).eq("id", chk.dataset.catVisivel);
    if (error) {
      chk.checked = !chk.checked;
      return avisar(traduzErro(error), true);
    }
    avisar(chk.checked ? "Categoria visível no site" : "Categoria escondida do site");
    await carregarTudo();
  });

  $("#listaCategorias").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-cat-editar]");
    const ex = e.target.closest("[data-cat-excluir]");
    if (ed) {
      const c = dados.categorias.find((x) => x.id === ed.dataset.catEditar);
      const nome = prompt("Nome da categoria:", c.nome);
      if (nome === null) return;
      const ordem = prompt("Posição no cardápio (1 = primeira):", c.ordem);
      if (ordem === null) return;
      const { error } = await sb.from("categorias").update({ nome: nome.trim() || c.nome, ordem: Number(ordem) || 0 }).eq("id", c.id);
      if (error) return avisar(traduzErro(error), true);
      avisar("Categoria atualizada!");
      await carregarTudo();
    }
    if (ex) {
      const c = dados.categorias.find((x) => x.id === ex.dataset.catExcluir);
      const qtd = dados.produtos.filter((p) => p.categoria_id === c.id).length;
      const msg = qtd
        ? `Excluir "${c.nome}"? Os ${qtd} produto(s) dela ficarão "Sem categoria" e só aparecem no filtro "Todos".`
        : `Excluir "${c.nome}"?`;
      if (!confirm(msg)) return;
      const { error } = await sb.from("categorias").delete().eq("id", c.id);
      if (error) return avisar(traduzErro(error), true);
      avisar("Categoria excluída.");
      await carregarTudo();
    }
  });

  /* =========================================================
     LOJA
     ========================================================= */
  const formLoja = $("#formLoja");
  function renderLoja() {
    const l = dados.loja;
    if (!l) return;
    const f = formLoja.elements;
    f.whatsapp.value = l.whatsapp.startsWith("55") && l.whatsapp.length >= 12 ? l.whatsapp.slice(2) : l.whatsapp;
    f.instagram.value = l.instagram;
    f.cidade.value = l.cidade;
    f.horario.value = l.horario;
    f.antecedencia_dias.value = l.antecedencia_dias;
    f.taxa_entrega.value = l.taxa_entrega;
    f.formas_pagamento.value = (l.formas_pagamento || []).join(", ");
    f.sobre_titulo.value = l.sobre_titulo;
    f.sobre_texto.value = l.sobre_texto;
  }

  formLoja.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = formLoja.elements;
    const digitos = f.whatsapp.value.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 13) return avisar("Confira o WhatsApp: use DDD + número, só números.", true);
    const btn = formLoja.querySelector("[type=submit]");
    btn.disabled = true;
    const { error } = await sb.from("loja").update({
      whatsapp: digitos.length <= 11 ? "55" + digitos : digitos,
      instagram: f.instagram.value.trim(),
      cidade: f.cidade.value.trim(),
      horario: f.horario.value.trim(),
      antecedencia_dias: Number(f.antecedencia_dias.value) || 0,
      taxa_entrega: Number(f.taxa_entrega.value) || 0,
      formas_pagamento: f.formas_pagamento.value.split(",").map((s) => s.trim()).filter(Boolean),
      sobre_titulo: f.sobre_titulo.value.trim(),
      sobre_texto: f.sobre_texto.value.trim(),
    }).eq("id", 1);
    btn.disabled = false;
    if (error) return avisar(traduzErro(error), true);
    avisar("Dados da loja salvos!");
    await carregarTudo();
  });

  /* =========================================================
     ACESSOS (só a Dona)
     ========================================================= */
  function renderAcessos() {
    if (papel !== "dona") return;
    $("#listaAcessos").innerHTML = dados.acessos.map((a) => `
      <div class="item">
        <div class="item-info">
          <strong>${esc(a.email)}${a.email === emailUsuario ? " (você)" : ""}</strong>
          <small>Liberado em ${new Date(a.criado_em).toLocaleDateString("pt-BR")}${a.criado_por ? " por " + esc(a.criado_por) : ""}</small>
        </div>
        <div class="item-lado">
          <span class="etiqueta ${a.papel === "dona" ? "dona" : ""}">${a.papel === "dona" ? "Dona" : "Editor"}</span>
          <button class="btn btn-small btn-ghost" data-acesso-papel="${esc(a.email)}">${a.papel === "dona" ? "Tornar Editor" : "Tornar Dona"}</button>
          <button class="btn btn-small btn-link perigo" data-acesso-remover="${esc(a.email)}">Remover</button>
        </div>
      </div>`).join("");
  }

  $("#formAcesso").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const email = f.email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return avisar("Digite um e-mail válido.", true);
    if (f.papel.value === "dona" && !confirm(`${email} também poderá liberar e remover acessos, inclusive o seu. Confirmar?`)) return;
    const { error } = await sb.from("acessos").insert({ email, papel: f.papel.value });
    if (error) return avisar(traduzErro(error), true);
    e.target.reset();
    avisar(`Acesso liberado para ${email}. A pessoa entra em /admin com essa conta Google.`);
    await carregarTudo();
  });

  $("#listaAcessos").addEventListener("click", async (e) => {
    const bp = e.target.closest("[data-acesso-papel]");
    const br = e.target.closest("[data-acesso-remover]");
    if (bp) {
      const a = dados.acessos.find((x) => x.email === bp.dataset.acessoPapel);
      const novo = a.papel === "dona" ? "editor" : "dona";
      if (novo === "dona" && !confirm(`${a.email} poderá liberar e remover acessos. Confirmar?`)) return;
      if (novo === "editor" && a.email === emailUsuario && !confirm("Você deixará de ser Dona e não poderá mais gerenciar acessos. Confirmar?")) return;
      const { error } = await sb.from("acessos").update({ papel: novo }).eq("email", a.email);
      if (error) return avisar(traduzErro(error), true);
      if (a.email === emailUsuario) return location.reload();
      avisar("Papel alterado.");
      await carregarTudo();
    }
    if (br) {
      const email = br.dataset.acessoRemover;
      const msg = email === emailUsuario ? "Remover o SEU próprio acesso? Você sairá do painel." : `Remover o acesso de ${email}?`;
      if (!confirm(msg)) return;
      const { error } = await sb.from("acessos").delete().eq("email", email);
      if (error) return avisar(traduzErro(error), true);
      if (email === emailUsuario) return sair();
      avisar("Acesso removido.");
      await carregarTudo();
    }
  });

  /* ---------- Diálogos: fechar ---------- */
  $$("[data-fechar]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
})();
