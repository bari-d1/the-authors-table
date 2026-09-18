-- The quote-backgrounds bucket's `public` flag makes individual object
-- downloads work without auth, but that's a separate code path from
-- storage.list(), which queries storage.objects directly and is subject to
-- its RLS like any other table. With no SELECT policy, listing returned
-- nothing for anon even though the bucket itself is public - this is what
-- the background picker's storage.from(...).list() call needs.
create policy "Public read access to quote-backgrounds objects"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'quote-backgrounds');
