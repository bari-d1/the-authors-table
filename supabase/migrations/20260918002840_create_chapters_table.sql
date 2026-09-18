-- Create the chapters table: one row per chapter, holding the full
-- extracted text. Belongs to a book; deleting a book cascades to its
-- chapters.
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  number integer not null,
  title text,
  content text,
  created_at timestamptz not null default now()
);

-- Chapters are always queried by book (chapter picker, chapter-scoped search).
create index chapters_book_id_idx on public.chapters (book_id);

alter table public.chapters enable row level security;

-- Public (anon) can read. No insert/update/delete policies are defined for
-- anon or authenticated, so those operations are rejected by default once
-- RLS is enabled; only the service-role connection (which bypasses RLS) can
-- write to this table.
create policy "Public read access to chapters"
  on public.chapters
  for select
  to anon
  using (true);
