-- Visitantes (anon) só leem o conteúdo público; nunca escrevem nem veem acessos.
-- (O Supabase concede tudo por padrão a tabelas novas; o RLS já bloqueava,
-- isto fecha também as permissões.)
revoke all on public.acessos from anon;
revoke insert, update, delete, truncate, references, trigger on public.categorias, public.produtos, public.campanhas, public.loja from anon;
-- Equipe logada: só o necessário (RLS decide o resto).
revoke truncate, references, trigger on public.acessos, public.categorias, public.produtos, public.campanhas, public.loja from authenticated;
revoke insert, delete on public.loja from authenticated;
