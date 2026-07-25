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
