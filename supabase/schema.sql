-- Run this once in Supabase Dashboard > SQL Editor

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index notes_user_id_created_at_idx on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

-- Each policy only lets a signed-in user touch rows where user_id is their own id.
create policy "Users read own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);
