-- Add comments to the supabase_realtime publication so postgres_changes
-- subscriptions (INSERT/UPDATE) can be received by clients. Realtime still
-- respects the table's existing RLS policies for each subscribing client,
-- so this doesn't widen access beyond what anon/authenticated can already
-- SELECT.
--
-- Guarded with an existence check so this migration is safe to re-run and
-- doesn't error if the table is already a publication member.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
