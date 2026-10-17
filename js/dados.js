/* =========================================================
   CONFIGURAÇÕES DA LOJA — edite aqui
   ========================================================= */
const LOJA = {
  nome: "Renata Martins Confeitaria",
  // WhatsApp que recebe os pedidos: 55 + DDD + número, só dígitos
  whatsapp: "5500000000000",
  instagram: "https://www.instagram.com/renatamartinsconfeitaria/",
  cidade: "[Sua cidade - UF]",
  horario: "Seg a Sáb, 9h às 19h",
  // Antecedência mínima (em dias) para encomendas
  antecedenciaDias: 2,
  // Taxa de entrega exibida no pedido (0 = "a combinar")
  taxaEntrega: 0,
  formasPagamento: ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"],
};

/* =========================================================
   CAMPANHAS / PROMOÇÕES
   - Aparecem no topo do site e na seção "Promoções".
   - "inicio" e "fim" (AAAA-MM-DD) controlam quando a campanha
     fica visível. Deixe vazio ("") para não ter limite.
   - "produto" (opcional) liga o botão da campanha a um produto.
   ========================================================= */
const CAMPANHAS = [
  {
    titulo: "Encomendas de Natal abertas!",
    texto: "Caixas presenteáveis com brigadeiros gourmet para família, amigos e empresas. Garanta já a sua data.",
    selo: "Natal",
    cor: "rosa",
    inicio: "",
    fim: "2026-12-20",
    produto: "caixa-natal",
  },
  {
    titulo: "Leve 25, pague 20",
    texto: "Na caixa com 25 brigadeiros gourmet você ganha 5 docinhos por nossa conta.",
    selo: "Promoção",
    cor: "menta",
    inicio: "",
    fim: "",
    produto: "caixa-25",
  },
  {
    titulo: "Docinhos para sua festa",
    texto: "Cento de brigadeiros e doces finos com forminhas na cor do seu tema. Consulte datas disponíveis.",
    selo: "Festas",
    cor: "pessego",
    inicio: "",
    fim: "",
    produto: "cento-tradicional",
  },
];

/* =========================================================
   PRODUTOS
   - categoria: brigadeiros | caixas | bolos | festas
   - preco: valor em reais (número). precoPromo: opcional.
   - unidade: texto curto que aparece após o preço.
   - foto: caminho da foto (ex: "assets/produtos/ninho.jpg").
     Enquanto for null, aparece uma ilustração.
   - ilustracao: tipo de desenho e cores (usado sem foto).
   - destaque: true para aparecer com selo "Mais pedido".
   ========================================================= */
const CATEGORIAS = [
  { id: "todos", nome: "Todos" },
  { id: "brigadeiros", nome: "Brigadeiros" },
  { id: "caixas", nome: "Caixas e presentes" },
  { id: "bolos", nome: "Bolos e potes" },
  { id: "festas", nome: "Para festas" },
];

const PRODUTOS = [
  // ---------- Brigadeiros (unidade) ----------
  {
    id: "brig-tradicional", categoria: "brigadeiros",
    nome: "Brigadeiro tradicional",
    descricao: "Chocolate nobre, cremoso, finalizado com granulado belga.",
    preco: 4.0, unidade: "un.", destaque: true, foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#5C3420", cobertura: "granulado" },
  },
  {
    id: "brig-ninho", categoria: "brigadeiros",
    nome: "Ninho com Nutella",
    descricao: "Brigadeiro de leite Ninho com coração de Nutella.",
    preco: 4.5, unidade: "un.", destaque: true, foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#FBF3E6", cobertura: "po" },
  },
  {
    id: "brig-beijinho", categoria: "brigadeiros",
    nome: "Beijinho",
    descricao: "Coco fresco e leite condensado, envolto em coco ralado.",
    preco: 4.0, unidade: "un.", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#FFFDF8", cobertura: "coco" },
  },
  {
    id: "brig-pistache", categoria: "brigadeiros",
    nome: "Pistache",
    descricao: "Feito com pasta pura de pistache e pistache picado.",
    preco: 5.5, unidade: "un.", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#B7C98A", cobertura: "picado" },
  },
  {
    id: "brig-morango", categoria: "brigadeiros",
    nome: "Bicho de pé (morango)",
    descricao: "Brigadeiro de morango com açúcar cristal rosado.",
    preco: 4.0, unidade: "un.", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#FD9CAF", cobertura: "cristal" },
  },
  {
    id: "brig-churros", categoria: "brigadeiros",
    nome: "Churros",
    descricao: "Doce de leite com canela e açúcar.",
    preco: 4.5, unidade: "un.", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#C98A4F", cobertura: "cristal" },
  },
  {
    id: "brig-cafe", categoria: "brigadeiros",
    nome: "Café",
    descricao: "Chocolate meio amargo com café especial.",
    preco: 4.5, unidade: "un.", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#3E2418", cobertura: "graos" },
  },

  // ---------- Caixas ----------
  {
    id: "caixa-4", categoria: "caixas",
    nome: "Caixinha com 4",
    descricao: "Mimo perfeito para presentear. Escolha os sabores nas observações.",
    preco: 18.0, unidade: "caixa", foto: null,
    ilustracao: { tipo: "caixa", qtd: 4, fita: "#FD9CAF" },
  },
  {
    id: "caixa-9", categoria: "caixas",
    nome: "Caixa com 9",
    descricao: "Sortida com nossos sabores mais pedidos.",
    preco: 38.0, unidade: "caixa", destaque: true, foto: null,
    ilustracao: { tipo: "caixa", qtd: 9, fita: "#ADDED8" },
  },
  {
    id: "caixa-25", categoria: "caixas",
    nome: "Caixa com 25",
    descricao: "Promoção: leve 25 e pague 20. Sabores sortidos.",
    preco: 100.0, precoPromo: 80.0, unidade: "caixa", foto: null,
    ilustracao: { tipo: "caixa", qtd: 16, fita: "#864F30" },
  },
  {
    id: "caixa-natal", categoria: "caixas",
    nome: "Caixa de Natal",
    descricao: "Edição especial com 12 brigadeiros, embalagem temática e cartão.",
    preco: 58.0, unidade: "caixa", foto: null,
    ilustracao: { tipo: "caixa", qtd: 9, fita: "#C8102E" },
  },

  // ---------- Bolos e potes ----------
  {
    id: "bolo-pote", categoria: "bolos",
    nome: "Bolo no pote",
    descricao: "Camadas de massa fofinha e recheio cremoso. Sabores: brigadeiro, ninho ou prestígio.",
    preco: 14.0, unidade: "pote", foto: null,
    ilustracao: { tipo: "pote", recheio: "#5C3420" },
  },
  {
    id: "bolo-vulcao", categoria: "bolos",
    nome: "Bolo vulcão",
    descricao: "Bolo de chocolate com calda farta de brigadeiro. Serve 8 a 10 pessoas.",
    preco: 75.0, unidade: "bolo", destaque: true, foto: null,
    ilustracao: { tipo: "bolo", massa: "#6B3B22", calda: "#3E2418" },
  },
  {
    id: "bolo-decorado", categoria: "bolos",
    nome: "Bolo decorado (sob encomenda)",
    descricao: "Bolo personalizado para aniversários. Valor por kg — tema e sabor combinados pelo WhatsApp.",
    preco: 120.0, unidade: "kg", foto: null,
    ilustracao: { tipo: "bolo", massa: "#F5E0CD", calda: "#FD9CAF" },
  },

  // ---------- Festas ----------
  {
    id: "cento-tradicional", categoria: "festas",
    nome: "Cento de brigadeiros",
    descricao: "100 brigadeiros tradicionais em forminhas. Ideal para festas.",
    preco: 280.0, unidade: "cento", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#5C3420", cobertura: "granulado" },
  },
  {
    id: "cento-gourmet", categoria: "festas",
    nome: "Cento de doces finos",
    descricao: "100 doces gourmet sortidos, forminhas na cor do tema da festa.",
    preco: 380.0, unidade: "cento", foto: null,
    ilustracao: { tipo: "brigadeiro", bola: "#FBF3E6", cobertura: "po" },
  },
];
