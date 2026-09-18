-- Create the two public Storage buckets for curated site assets: book
-- covers + PJK's author photo, and quote-card background templates.
--
-- Both are public buckets, so Supabase Storage serves objects at their
-- public URL (/storage/v1/object/public/<bucket>/<path>) without an auth
-- header. That public-read behavior comes from the bucket's `public` flag,
-- not from an RLS policy.
--
-- Writes are a different matter: storage.objects has row level security
-- enabled by default in every Supabase project, and no INSERT/UPDATE/DELETE
-- policies are created here for anon or authenticated. That means uploads,
-- replacements, and deletes are rejected for both roles; only the
-- service-role connection (which bypasses RLS) or the dashboard (which
-- also acts as service-role) can write to these buckets. These are curated
-- assets, not user-generated content.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-assets', 'book-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('quote-backgrounds', 'quote-backgrounds', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
