-- =========================================================
-- Dados iniciais: Renata como Dona do painel, dados da loja,
-- categorias, produtos e promoções que já estavam no site.
-- =========================================================

insert into public.acessos (email, papel, criado_por)
values ('renatachm@gmail.com', 'dona', 'instalação')
on conflict (email) do update set papel = 'dona';

insert into public.loja (id, whatsapp, instagram, cidade, horario, antecedencia_dias, taxa_entrega, sobre_titulo, sobre_texto)
values (
  1, '', 'https://www.instagram.com/renatamartinsconfeitaria/', '', 'Seg a Sáb, 9h às 19h', 2, 0,
  'Oi, eu sou a Renata!',
  E'A Renata Martins Confeitaria nasceu do amor por transformar ingredientes simples em pequenos momentos de alegria. Cada brigadeiro é enrolado à mão, com chocolate nobre e muito capricho, do jeitinho que eu faria para a minha família.\n\nTrabalho por encomenda para garantir doces sempre fresquinhos — para presentear, comemorar ou simplesmente se dar um mimo.'
)
on conflict (id) do nothing;

insert into public.categorias (id, nome, ordem) values
  ('brigadeiros', 'Brigadeiros', 1),
  ('caixas', 'Caixas e presentes', 2),
  ('bolos', 'Bolos e potes', 3),
  ('festas', 'Para festas', 4)
on conflict (id) do nothing;

insert into public.produtos (id, categoria_id, nome, descricao, preco, preco_promo, unidade, destaque, ordem, ilustracao) values
  ('brig-tradicional', 'brigadeiros', 'Brigadeiro tradicional', 'Chocolate nobre, cremoso, finalizado com granulado belga.', 4.00, null, 'un.', true, 1, '{"tipo":"brigadeiro","bola":"#5C3420","cobertura":"granulado"}'),
  ('brig-ninho', 'brigadeiros', 'Ninho com Nutella', 'Brigadeiro de leite Ninho com coração de Nutella.', 4.50, null, 'un.', true, 2, '{"tipo":"brigadeiro","bola":"#FBF3E6","cobertura":"po"}'),
  ('brig-beijinho', 'brigadeiros', 'Beijinho', 'Coco fresco e leite condensado, envolto em coco ralado.', 4.00, null, 'un.', false, 3, '{"tipo":"brigadeiro","bola":"#FFFDF8","cobertura":"coco"}'),
  ('brig-pistache', 'brigadeiros', 'Pistache', 'Feito com pasta pura de pistache e pistache picado.', 5.50, null, 'un.', false, 4, '{"tipo":"brigadeiro","bola":"#B7C98A","cobertura":"picado"}'),
  ('brig-morango', 'brigadeiros', 'Bicho de pé (morango)', 'Brigadeiro de morango com açúcar cristal rosado.', 4.00, null, 'un.', false, 5, '{"tipo":"brigadeiro","bola":"#FD9CAF","cobertura":"cristal"}'),
  ('brig-churros', 'brigadeiros', 'Churros', 'Doce de leite com canela e açúcar.', 4.50, null, 'un.', false, 6, '{"tipo":"brigadeiro","bola":"#C98A4F","cobertura":"cristal"}'),
  ('brig-cafe', 'brigadeiros', 'Café', 'Chocolate meio amargo com café especial.', 4.50, null, 'un.', false, 7, '{"tipo":"brigadeiro","bola":"#3E2418","cobertura":"graos"}'),
  ('caixa-4', 'caixas', 'Caixinha com 4', 'Mimo perfeito para presentear. Escolha os sabores nas observações.', 18.00, null, 'caixa', false, 1, '{"tipo":"caixa","qtd":4,"fita":"#FD9CAF"}'),
  ('caixa-9', 'caixas', 'Caixa com 9', 'Sortida com nossos sabores mais pedidos.', 38.00, null, 'caixa', true, 2, '{"tipo":"caixa","qtd":9,"fita":"#ADDED8"}'),
  ('caixa-25', 'caixas', 'Caixa com 25', 'Promoção: leve 25 e pague 20. Sabores sortidos.', 100.00, 80.00, 'caixa', false, 3, '{"tipo":"caixa","qtd":16,"fita":"#864F30"}'),
  ('caixa-natal', 'caixas', 'Caixa de Natal', 'Edição especial com 12 brigadeiros, embalagem temática e cartão.', 58.00, null, 'caixa', false, 4, '{"tipo":"caixa","qtd":9,"fita":"#C8102E"}'),
  ('bolo-pote', 'bolos', 'Bolo no pote', 'Camadas de massa fofinha e recheio cremoso. Sabores: brigadeiro, ninho ou prestígio.', 14.00, null, 'pote', false, 1, '{"tipo":"pote","recheio":"#5C3420"}'),
  ('bolo-vulcao', 'bolos', 'Bolo vulcão', 'Bolo de chocolate com calda farta de brigadeiro. Serve 8 a 10 pessoas.', 75.00, null, 'bolo', true, 2, '{"tipo":"bolo","massa":"#6B3B22","calda":"#3E2418"}'),
  ('bolo-decorado', 'bolos', 'Bolo decorado (sob encomenda)', 'Bolo personalizado para aniversários. Valor por kg — tema e sabor combinados pelo WhatsApp.', 120.00, null, 'kg', false, 3, '{"tipo":"bolo","massa":"#F5E0CD","calda":"#FD9CAF"}'),
  ('cento-tradicional', 'festas', 'Cento de brigadeiros', '100 brigadeiros tradicionais em forminhas. Ideal para festas.', 280.00, null, 'cento', false, 1, '{"tipo":"brigadeiro","bola":"#5C3420","cobertura":"granulado"}'),
  ('cento-gourmet', 'festas', 'Cento de doces finos', '100 doces gourmet sortidos, forminhas na cor do tema da festa.', 380.00, null, 'cento', false, 2, '{"tipo":"brigadeiro","bola":"#FBF3E6","cobertura":"po"}')
on conflict (id) do nothing;

insert into public.campanhas (titulo, texto, selo, cor, inicio, fim, produto_id, ordem) values
  ('Encomendas de Natal abertas!', 'Caixas presenteáveis com brigadeiros gourmet para família, amigos e empresas. Garanta já a sua data.', 'Natal', 'rosa', null, '2026-12-20', 'caixa-natal', 1),
  ('Leve 25, pague 20', 'Na caixa com 25 brigadeiros gourmet você ganha 5 docinhos por nossa conta.', 'Promoção', 'menta', null, null, 'caixa-25', 2),
  ('Docinhos para sua festa', 'Cento de brigadeiros e doces finos com forminhas na cor do seu tema. Consulte datas disponíveis.', 'Festas', 'pessego', null, null, 'cento-tradicional', 3);
