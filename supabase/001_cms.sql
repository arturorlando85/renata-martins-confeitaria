-- =========================================================
-- Renata Martins Confeitaria — CMS
-- Tabelas do cardápio, promoções, dados da loja e acessos,
-- com regras de segurança (RLS) e espaço para fotos.
-- =========================================================

-- ---------- Funções de permissão (schema privado, fora da API) ----------
create schema if not exists private;

-- Acessos ao painel: quem pode entrar e com qual papel.
create table public.acessos (
  email       text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  papel       text not null default 'editor' check (papel in ('dona', 'editor')),
  criado_em   timestamptz not null default now(),
  criado_por  text default lower(auth.jwt() ->> 'email')
);

-- Papel de quem está logado. Só vale login feito pelo Google
-- (app_metadata é definido pelo servidor, o usuário não consegue alterar).
create or replace function private.papel_atual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.papel
  from public.acessos a
  where a.email = lower(auth.jwt() ->> 'email')
    and coalesce(auth.jwt() -> 'app_metadata' -> 'providers', '[]'::jsonb) ? 'google'
$$;

create or replace function private.e_equipe()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.papel_atual() is not null $$;

create or replace function private.e_dona()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(private.papel_atual() = 'dona', false) $$;

revoke all on function private.papel_atual(), private.e_equipe(), private.e_dona() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.papel_atual(), private.e_equipe(), private.e_dona() to anon, authenticated;

-- Nunca deixar o painel sem nenhuma Dona; e-mail não pode ser trocado.
create or replace function private.proteger_acessos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.email <> old.email then
    raise exception 'Não é possível alterar o e-mail. Remova e cadastre de novo.';
  end if;
  if old.papel = 'dona' and (tg_op = 'DELETE' or new.papel <> 'dona') then
    if not exists (select 1 from public.acessos where papel = 'dona' and email <> old.email) then
      raise exception 'É preciso ter pelo menos uma Dona com acesso ao painel.';
    end if;
  end if;
  return coalesce(new, old);
end
$$;

create trigger acessos_protecao
before update or delete on public.acessos
for each row execute function private.proteger_acessos();

-- ---------- Conteúdo do site ----------
create table public.categorias (
  id      text primary key check (id ~ '^[a-z0-9-]+$'),
  nome    text not null check (length(btrim(nome)) > 0),
  ordem   int  not null default 0,
  visivel boolean not null default true
);

create table public.produtos (
  id           text primary key default gen_random_uuid()::text,
  categoria_id text references public.categorias (id) on update cascade on delete set null,
  nome         text not null check (length(btrim(nome)) > 0),
  descricao    text not null default '',
  preco        numeric(10, 2) not null check (preco >= 0),
  preco_promo  numeric(10, 2) check (preco_promo >= 0),
  unidade      text not null default 'un.',
  destaque     boolean not null default false,
  esgotado     boolean not null default false,
  visivel      boolean not null default true,
  ordem        int not null default 0,
  foto_path    text,
  ilustracao   jsonb,
  atualizado_em timestamptz not null default now()
);
create index produtos_categoria_idx on public.produtos (categoria_id);

create table public.campanhas (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null check (length(btrim(titulo)) > 0),
  texto      text not null default '',
  selo       text not null default 'Promoção',
  cor        text not null default 'rosa' check (cor in ('rosa', 'menta', 'pessego', 'salvia', 'rose')),
  inicio     date,
  fim        date,
  produto_id text references public.produtos (id) on update cascade on delete set null,
  visivel    boolean not null default true,
  ordem      int not null default 0,
  check (inicio is null or fim is null or inicio <= fim)
);
create index campanhas_produto_idx on public.campanhas (produto_id);

-- Dados da loja: uma única linha (id = 1).
create table public.loja (
  id                int primary key default 1 check (id = 1),
  nome              text not null default 'Renata Martins Confeitaria',
  whatsapp          text not null default '' check (whatsapp ~ '^[0-9]*$'),
  instagram         text not null default '',
  cidade            text not null default '',
  horario           text not null default '',
  antecedencia_dias int  not null default 2 check (antecedencia_dias between 0 and 60),
  taxa_entrega      numeric(10, 2) not null default 0 check (taxa_entrega >= 0),
  formas_pagamento  text[] not null default array['Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro'],
  sobre_titulo      text not null default '',
  sobre_texto       text not null default ''
);

-- atualizado_em automático nos produtos
create or replace function private.tocar_atualizado_em()
returns trigger language plpgsql set search_path = ''
as $$ begin new.atualizado_em = now(); return new; end $$;

create trigger produtos_atualizado_em
before update on public.produtos
for each row execute function private.tocar_atualizado_em();

-- ---------- Permissões da API ----------
grant select on public.categorias, public.produtos, public.campanhas, public.loja to anon, authenticated;
grant insert, update, delete on public.categorias, public.produtos, public.campanhas to authenticated;
grant update on public.loja to authenticated;
grant select, insert, update, delete on public.acessos to authenticated;

alter table public.acessos    enable row level security;
alter table public.categorias enable row level security;
alter table public.produtos   enable row level security;
alter table public.campanhas  enable row level security;
alter table public.loja       enable row level security;

-- Visitantes veem só o que está visível; a equipe vê tudo.
create policy "publico ve categorias visiveis" on public.categorias
  for select to anon, authenticated using (visivel or (select private.e_equipe()));
create policy "publico ve produtos visiveis" on public.produtos
  for select to anon, authenticated using (visivel or (select private.e_equipe()));
create policy "publico ve campanhas visiveis" on public.campanhas
  for select to anon, authenticated using (visivel or (select private.e_equipe()));
create policy "publico ve dados da loja" on public.loja
  for select to anon, authenticated using (true);

-- Equipe (Dona e Editores) edita o conteúdo.
create policy "equipe cria categorias" on public.categorias for insert to authenticated with check ((select private.e_equipe()));
create policy "equipe edita categorias" on public.categorias for update to authenticated using ((select private.e_equipe())) with check ((select private.e_equipe()));
create policy "equipe apaga categorias" on public.categorias for delete to authenticated using ((select private.e_equipe()));

create policy "equipe cria produtos" on public.produtos for insert to authenticated with check ((select private.e_equipe()));
create policy "equipe edita produtos" on public.produtos for update to authenticated using ((select private.e_equipe())) with check ((select private.e_equipe()));
create policy "equipe apaga produtos" on public.produtos for delete to authenticated using ((select private.e_equipe()));

create policy "equipe cria campanhas" on public.campanhas for insert to authenticated with check ((select private.e_equipe()));
create policy "equipe edita campanhas" on public.campanhas for update to authenticated using ((select private.e_equipe())) with check ((select private.e_equipe()));
create policy "equipe apaga campanhas" on public.campanhas for delete to authenticated using ((select private.e_equipe()));

create policy "equipe edita dados da loja" on public.loja for update to authenticated using ((select private.e_equipe())) with check ((select private.e_equipe()));

-- Acessos: a equipe vê a lista; só a Dona libera, altera ou remove.
create policy "equipe ve acessos" on public.acessos for select to authenticated using ((select private.e_equipe()));
create policy "dona libera acessos" on public.acessos for insert to authenticated with check ((select private.e_dona()));
create policy "dona altera acessos" on public.acessos for update to authenticated using ((select private.e_dona())) with check ((select private.e_dona()));
create policy "dona remove acessos" on public.acessos for delete to authenticated using ((select private.e_dona()));

-- ---------- Fotos dos produtos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "equipe envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos' and (select private.e_equipe()));
create policy "equipe ve fotos" on storage.objects
  for select to authenticated using (bucket_id = 'produtos' and (select private.e_equipe()));
create policy "equipe troca fotos" on storage.objects
  for update to authenticated using (bucket_id = 'produtos' and (select private.e_equipe()));
create policy "equipe apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'produtos' and (select private.e_equipe()));
