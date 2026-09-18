-- Create the quote_cards table: write-only from the public site, one row
-- per quote card download. Exists purely to power the admin metrics
-- dashboard, never read by readers.
create table public.quote_cards (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index quote_cards_book_id_idx on public.quote_cards (book_id);
create index quote_cards_chapter_id_idx on public.quote_cards (chapter_id);

alter table public.quote_cards enable row level security;

-- Public (anon) can insert freely; no restrictions beyond the FK
-- constraints on book_id/chapter_id.
create policy "Public insert access to quote_cards"
  on public.quote_cards
  for insert
  to anon
  with check (true);

-- Only an authenticated admin can read, for the metrics dashboard.
create policy "Authenticated read access to quote_cards"
  on public.quote_cards
  for select
  to authenticated
  using (true);

-- Revoke SELECT from anon explicitly so a query is rejected with a
-- permission error rather than silently matching zero rows under RLS.
revoke select on public.quote_cards from anon;

-- No UPDATE/DELETE policy for anon or authenticated, and the grants are
-- revoked too for an explicit permission error. Only the service-role
-- connection (which bypasses RLS and grants) can update or delete.
revoke update, delete on public.quote_cards from anon, authenticated;
