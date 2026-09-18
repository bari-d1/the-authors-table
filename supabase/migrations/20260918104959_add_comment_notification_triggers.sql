-- Fire the two notification Edge Functions directly from Postgres on
-- comments INSERT, via pg_net (async HTTP from a trigger). This project
-- doesn't have the dashboard's Database Webhooks feature provisioned (no
-- supabase_functions.http_request), so the equivalent is built by hand here
-- to keep it in a migration rather than dashboard-only config.
--
-- The service-role key used to call the functions is read from Supabase
-- Vault at trigger time (secret name 'edge_function_service_role_key'), not
-- embedded in this file. The secret itself is set once, directly against
-- the database, the same way edge function secrets are set via the CLI
-- rather than committed.
create extension if not exists pg_net;

-- Notify PJK when a comment is flagged as a question. The WHEN clause below
-- keeps this from invoking the function at all for the common case (most
-- comments aren't questions), rather than relying solely on the function's
-- own early-return.
create or replace function public.trigger_notify_pjk_of_question()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_role_key text;
begin
  select decrypted_secret into service_role_key
  from vault.decrypted_secrets
  where name = 'edge_function_service_role_key'
  limit 1;

  perform net.http_post(
    url := 'https://gbxqnukwbebmssqftwpm.supabase.co/functions/v1/notify-pjk-of-question',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'comments',
      'schema', 'public',
      'record', to_jsonb(NEW),
      'old_record', null
    )
  );

  return NEW;
end;
$$;

drop trigger if exists comments_notify_pjk_of_question on public.comments;
create trigger comments_notify_pjk_of_question
  after insert on public.comments
  for each row
  when (NEW.question = true)
  execute function public.trigger_notify_pjk_of_question();

-- Notify the reader when a reply lands on their comment. Every reply
-- (parent_id set) invokes this; the function itself decides whether the
-- parent actually qualifies (question = true with a reader_email), since
-- that's not knowable from NEW alone without a lookup the function already
-- has to do.
create or replace function public.trigger_notify_reader_of_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  service_role_key text;
begin
  select decrypted_secret into service_role_key
  from vault.decrypted_secrets
  where name = 'edge_function_service_role_key'
  limit 1;

  perform net.http_post(
    url := 'https://gbxqnukwbebmssqftwpm.supabase.co/functions/v1/notify-reader-of-reply',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'apikey', service_role_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'comments',
      'schema', 'public',
      'record', to_jsonb(NEW),
      'old_record', null
    )
  );

  return NEW;
end;
$$;

drop trigger if exists comments_notify_reader_of_reply on public.comments;
create trigger comments_notify_reader_of_reply
  after insert on public.comments
  for each row
  when (NEW.parent_id is not null)
  execute function public.trigger_notify_reader_of_reply();
