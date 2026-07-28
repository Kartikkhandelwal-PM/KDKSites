# backend/

Server-side code and specs. **Two of these three folders are real; one is paper.**

| Folder | Status | What it is |
|---|---|---|
| `supabase/` | **BUILT, deployed** | Postgres schema (`migrations/`) + the `ai-generate` Edge Function that keeps the AI API key off the browser. Project ref `hlhtopqbzfzlxxmolkok`. |
| `netlify/` | **BUILT** | `edge-functions/render.ts` serves each published site at `/s/<subdomain>`. |
| `spec/` | **NEVER BUILT** | The originally planned Golang + MySQL backend. Design document only. |

## Do not confuse `spec/` with what runs

`spec/database-schema.sql` is **MySQL** and has never been applied anywhere. The
schema that actually runs is **Postgres**, in `supabase/migrations/`. Likewise
`spec/api-spec.md` describes 12 Golang REST endpoints that do not exist; the app
talks to Supabase's REST API and the two Edge Functions instead.

Keep `spec/` for reference when the production backend is built, but never treat
it as a description of the current system.

## Running the Supabase CLI

The CLI resolves a project from `supabase/config.toml` **relative to the working
directory**, and that file now sits at `backend/supabase/config.toml`. So either:

```bash
cd backend && supabase functions deploy ai-generate     # run from backend/
supabase --workdir backend db push                      # or pass --workdir
```

Running bare `supabase db push` from the repo root will not find the project.

## Netlify

`netlify.toml` stays at the **repo root** (Netlify reads it from nowhere else). It
points at this folder with `edge_functions = "backend/netlify/edge-functions"` and
publishes `frontend/` as the site root.

Required Netlify environment variables (Site settings -> Environment variables):

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | `https://hlhtopqbzfzlxxmolkok.supabase.co` |
| `SUPABASE_SERVICE_KEY` | **Secret.** Service role key; lets `render.ts` read any published site, bypassing RLS. |
| `SUPABASE_ANON_KEY` | Public key injected into published pages so contact forms can insert leads. |
| `SITE_DOMAINS` | Comma-separated pool of KDK-owned domains, e.g. `kdksites.in,casites.in`. The **first is the default** and is what a bare `/s/<sub>` resolves against. Optional; defaults to `kdksites.in`. `render.ts` serves only domains named here, so a domain missing from this list resolves in DNS but 404s. |

### Adding a domain to the pool

Three places, all required:

1. **DNS** — point wildcard `*.<domain>` at the Netlify site, and add the domain under Netlify's Domain management.
2. **`SITE_DOMAINS`** — append it, so `render.ts` will answer for it.
3. **`frontend/app-config.js`** — append `{host:'<domain>', label:'…', note:'…', live:true}` to `siteDomains`, so the builder offers it. Use `live:false` to list a domain that is bought but not yet wired: it renders disabled rather than being offered.

The edge function is registered on `/*`, not `/s/*`, because a real address requests `/`. It returns `undefined` for anything it does not own, so the builder and all static assets pass through.
