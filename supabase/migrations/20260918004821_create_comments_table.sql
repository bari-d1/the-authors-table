-- Create the comments table: every comment is a reply to something, either
-- the book/chapter itself (parent_id null) or another comment (parent_id
-- set). Handles general discussion, chapter-level comments, and questions
-- to PJK in one table, no separate mechanisms for each.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  commenter_name text not null,
  content text not null,
  question boolean not null default false,
  hidden boolean not null default false,
  reader_email text,
  created_at timestamptz not null default now(),
  constraint comments_question_requires_email check (not question or reader_email is not null)
);

-- All three are queried on directly: comments for a book, comments for a
-- chapter, and replies to a given comment.
create index comments_book_id_idx on public.comments (book_id);
create index comments_chapter_id_idx on public.comments (chapter_id);
create index comments_parent_id_idx on public.comments (parent_id);

alter table public.comments enable row level security;

-- Public (anon) and authenticated (admin) can read every row, hidden ones
-- included. Moderation renders hidden = true as "[comment removed]" on the
-- frontend rather than filtering it out at the database level, so replies
-- underneath a hidden comment aren't orphaned.
create policy "Public read access to comments"
  on public.comments
  for select
  to anon, authenticated
  using (true);

-- Public (anon) can insert. The reader_email-for-questions rule is enforced
-- by the table's CHECK constraint, not policy logic, so this check is
-- unconditional.
create policy "Public insert access to comments"
  on public.comments
  for insert
  to anon
  with check (true);

-- Only an authenticated admin can update, and column-level grants (below)
-- restrict that to the hidden column only.
create policy "Authenticated can moderate comments"
  on public.comments
  for update
  to authenticated
  using (true)
  with check (true);

-- Neither anon nor authenticated get UPDATE at all by default; grant it
-- back to authenticated on the hidden column only, so moderation can flip
-- hidden but nothing else, and anon can't update anything.
revoke update on public.comments from anon, authenticated;
grant update (hidden) on public.comments to authenticated;

-- No DELETE policy for anon or authenticated means DELETE is rejected by
-- RLS regardless of table grants, but revoke the grant too for an explicit
-- permission error rather than a silent no-op. Only the service-role
-- connection (which bypasses RLS and grants) can delete; moderation should
-- use hidden, not DELETE, in normal operation.
revoke delete on public.comments from anon, authenticated;
