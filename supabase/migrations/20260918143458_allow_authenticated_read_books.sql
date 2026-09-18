-- books' read policy only granted `anon`. The admin dashboard queries as
-- `authenticated` (a logged-in admin session), both directly (fetching
-- book titles for the metrics panel) and via embedding (joining comments
-- to their book's title in the moderation panel) - neither would return
-- anything under the previous policy, since `authenticated` isn't a member
-- of `anon` and RLS only applies to roles a policy actually names.
alter policy "Public read access to books"
  on public.books
  to anon, authenticated;
