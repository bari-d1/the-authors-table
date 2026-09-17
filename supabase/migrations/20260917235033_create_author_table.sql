-- Create the author table: a single site-wide row describing PJK, the site's
-- only author. Stands alone, no foreign keys in or out.
create extension if not exists pgcrypto;

create table public.author (
  id uuid primary key default gen_random_uuid(),
  name text,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.author enable row level security;

-- Public (anon) can read. No insert/update/delete policies are defined for
-- anon or authenticated, so those operations are rejected by default once
-- RLS is enabled; only the service-role connection (which bypasses RLS) can
-- write to this table.
create policy "Public read access to author"
  on public.author
  for select
  to anon
  using (true);
