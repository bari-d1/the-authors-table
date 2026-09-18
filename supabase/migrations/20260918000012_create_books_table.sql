-- Create the books table: one row per launch title. Stands alone, no
-- foreign keys in or out.
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  blurb text,
  cover_url text,
  buy_link text,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

-- Public (anon) can read. No insert/update/delete policies are defined for
-- anon or authenticated, so those operations are rejected by default once
-- RLS is enabled; only the service-role connection (which bypasses RLS) can
-- write to this table.
create policy "Public read access to books"
  on public.books
  for select
  to anon
  using (true);
