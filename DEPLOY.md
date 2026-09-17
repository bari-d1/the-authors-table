# Deploying to Vercel

## Build settings

Vercel auto-detects this as a Vite project. `vercel.json` pins the settings explicitly:

- Build command: `npm run build`
- Output directory: `dist`
- Rewrite: all routes fall back to `index.html`, which is required for a client-side-routed
  React Router app — without it, refreshing or directly loading a route like `/admin` or
  `/book/:bookId` returns a 404 instead of letting the app's router handle it.

## Environment variables

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read at build time via `import.meta.env`
(see `src/lib/supabaseClient.js`). They are **not** committed (`.env` is gitignored) and must be
set separately in the Vercel project:

1. Vercel dashboard → Project → Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the real values from the Supabase
   project (Project Settings → API).
3. Apply to all environments you deploy (Production, Preview, Development) as needed.
4. Redeploy after adding or changing them — Vite inlines env vars at build time, so a running
   deployment won't pick up new values without a rebuild.

If either variable is missing, `supabaseClient.js` throws immediately on import instead of
failing silently later.
