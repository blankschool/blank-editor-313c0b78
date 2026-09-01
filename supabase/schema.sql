-- Estúdio — esquema para o Supabase self-hosted.
-- Rode este arquivo no SQL editor do seu servidor (uma vez).

create extension if not exists "pgcrypto";

-- projects -------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default 'Meu projeto',
  criado_em timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
drop policy if exists "projects own" on public.projects;
create policy "projects own" on public.projects for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- designs --------------------------------------------------------------
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null default 'Novo design',
  tipo text not null default 'tela',
  favorito boolean not null default false,
  tom text not null default 'oklch(0.9 0.03 85)',
  doc jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create index if not exists designs_owner_idx on public.designs(owner, atualizado_em desc);
grant select, insert, update, delete on public.designs to authenticated;
grant all on public.designs to service_role;
alter table public.designs enable row level security;
drop policy if exists "designs own" on public.designs;
create policy "designs own" on public.designs for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- versions -------------------------------------------------------------
create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rotulo text not null default 'v1',
  autor text not null default 'Você',
  doc jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists versions_design_idx on public.versions(design_id, criado_em desc);
grant select, insert, update, delete on public.versions to authenticated;
grant all on public.versions to service_role;
alter table public.versions enable row level security;
drop policy if exists "versions own" on public.versions;
create policy "versions own" on public.versions for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- messages -------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text not null default 'voce',
  payload jsonb not null default '{}'::jsonb, -- { texto, tarefas?, arquivo?, pergunta? }
  criado_em timestamptz not null default now()
);
create index if not exists messages_design_idx on public.messages(design_id, criado_em);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
drop policy if exists "messages own" on public.messages;
create policy "messages own" on public.messages for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- comments -------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text not null default '',
  x double precision not null default 0,
  y double precision not null default 0,
  texto text not null default '',
  resolvido boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists comments_design_idx on public.comments(design_id, criado_em);
grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
drop policy if exists "comments own" on public.comments;
create policy "comments own" on public.comments for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- replies --------------------------------------------------------------
create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text not null default '',
  texto text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists replies_comment_idx on public.replies(comment_id, criado_em);
grant select, insert, update, delete on public.replies to authenticated;
grant all on public.replies to service_role;
alter table public.replies enable row level security;
drop policy if exists "replies own" on public.replies;
create policy "replies own" on public.replies for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
