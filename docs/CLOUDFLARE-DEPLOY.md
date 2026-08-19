# Cloudflare + Netlify — how the dual hosting actually works
> Written 2026-07-29 so this doesn't have to be re-derived from a chat transcript.
> Read this before touching deployment, branches, or wrangler.jsonc.

## The short version

There are **two independent hosts running the same app**, on **two different git branches**, both talking to **one shared Supabase backend**. Nothing about this is automatic — every deploy is a deliberate action, on purpose, so a mistake on one side can never silently affect the other.

| | Netlify | Cloudflare Workers |
|---|---|---|
| Branch | `feature/ai-website-writer` | `cloudflare` |
| Builder URL | `kdksites.netlify.app` | `kdksites.kartik-khandelwal.workers.dev` |
| Published sites | `kdksites.netlify.app/s/<subdomain>` | `kdksites.kartik-khandelwal.workers.dev/s/<subdomain>` |
| Deploys | Automatic — Netlify's dashboard watches the branch, every push deploys | Manual — `wrangler deploy`, run from this machine, whenever asked |
| Renderer | `backend/netlify/edge-functions/render.ts` | `src/index.ts` (ported line-for-line from render.ts) |
| Purpose | The "real" deploy, been running for weeks | Daily-dev deploy, so Netlify's free-tier credits aren't burned on every small push |

**Why two branches, not one:** pushing to `feature/ai-website-writer` auto-deploys to Netlify — there's no way to push there without it going live. Keeping Cloudflare on its own branch means iterating fast (deploy from the CLI as often as needed) without spending Netlify's usage on every experiment. **They do not sync automatically.** A fix made on one branch has to be deliberately ported to the other — see "Keeping the two branches in sync" below.

## Both hosts share one Supabase project

Same project (`hlhtopqbzfzlxxmolkok`), same `wb_websites` / `wb_leads` tables, same `app-config.js` values (URL + anon key are public by design, committed to git). This means:

- Logging in with the same account works identically on both — Supabase Auth doesn't care which host served the login page.
- Publishing a site from either host writes to the same database row. There's no locking: if you edit the same site from both hosts around the same time, the second Publish simply overwrites the first, same as any other save.
- A site published from Cloudflare is visible at **both** `.../s/<subdomain>` URLs, because both renderers query the same table. Which URL gets *shown* to the user after publishing depends on `publicBase` (see below) — but either link, if you have it, actually works.

## Deploying

**To Cloudflare:**
```
git checkout cloudflare
wrangler deploy
```
Needs `wrangler` installed globally (`npm install -g wrangler`) and authenticated (`wrangler login`, or `wrangler whoami` to check). No build step — `wrangler deploy` reads `frontend/` straight off local disk and uploads it, running `src/index.ts` as the Worker.

**To Netlify:** just push to `feature/ai-website-writer`. That's the entire mechanism — Netlify's dashboard is watching that branch and redeploys on every push, automatically, with no separate command.

## wrangler.jsonc — what each part does

Lives at the repo root, only on the `cloudflare` branch.

- `name: "kdksites"` — the Worker's name; determines the `kdksites.<account>.workers.dev` URL.
- `main: "src/index.ts"` — the Worker script (the ported render logic).
- `assets.directory: "./frontend"`, `assets.binding: "ASSETS"` — serves `frontend/` as static files, reachable inside the Worker script as `env.ASSETS.fetch(request)`.
- `vars` — **non-secret** environment values, committed in plain text on purpose: `SITE_DOMAINS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (this one really is meant to be public — same value already sits in `frontend/app-config.js`).
- `SUPABASE_SERVICE_KEY` is **not** in this file. It's a real secret and was set with `wrangler secret put SUPABASE_SERVICE_KEY` — check it's still there with `wrangler secret list`. If the Worker ever needs to be recreated from scratch, this has to be set again; it isn't stored anywhere in the repo.

## src/index.ts — the ported renderer

Does exactly what `backend/netlify/edge-functions/render.ts` does — resolve a subdomain (by Host header or `/s/<sub>` path), look up the site in Supabase with the service key, inject the saved config into the right template, rewrite title/OG tags. The only real differences are mechanical, from Cloudflare Workers' API being slightly different from Netlify's Deno-based edge functions:

- `Deno.env.get("X")` → `env.X` (passed into `fetch(request, env)`)
- `return undefined` (Netlify's "not mine, serve the static file") → `return env.ASSETS.fetch(request)`
- Fetching the template HTML: Netlify re-fetches from `url.origin`; the Worker fetches through the `ASSETS` binding instead (`env.ASSETS.fetch(...)`), since a Worker can't call back into itself over the network the way a same-origin fetch would.

**If `render.ts` changes, `src/index.ts` needs the same change made by hand.** They are not the same file and nothing keeps them in sync automatically.

## Two gotchas already hit once — don't reintroduce them

### 1. `wrangler deploy` reads from disk, not git — watch for local secrets
Netlify builds from a fresh `git clone`, so a gitignored file that was never committed simply isn't there. `wrangler deploy` uploads whatever's physically sitting in `frontend/` on this machine, gitignored or not. The first Cloudflare deploy (2026-07-29) briefly published `frontend/local-ai-config.js` — which holds a live OpenAI key — as a public static file, because it existed on disk even though it was never committed.

**Fixed by `frontend/.assetsignore`**, which excludes it from the upload (same syntax as `.gitignore`). **If a new local-only file is ever added under `frontend/` (another API key, another local override), it must be added to `.assetsignore` too, not just `.gitignore`.** Gitignore alone does not protect a Cloudflare deploy.

### 2. The share-link host used to be hardcoded
`frontend/app-config.js`'s `publicBase` used to be a fixed string, `'https://kdksites.netlify.app/s/'`. That meant publishing a site from the Cloudflare-served builder still showed a Netlify link on the "changes are live" screen — confusing, even though the Netlify link did actually work (same database).

**Fixed 2026-07-29**: `publicBase` is now `location.origin + '/s/'`, computed from whichever host is actually serving the builder in the browser right now. Same fix applied to the two fallback copies of this logic in `frontend/index.html` (search `publicBase` if this needs touching again).

## Keeping the two branches in sync

There is currently **no automated sync** between `cloudflare` and `feature/ai-website-writer`. If a bug fix or feature lands on one, it has to be cherry-picked or manually re-applied to the other, or the two will drift — e.g. `feature/ai-website-writer` does NOT have `wrangler.jsonc`, `src/index.ts`, `frontend/.assetsignore`, or the dynamic `publicBase` fix; `cloudflare` has all of those on top of everything `feature/ai-website-writer` had at the point it was branched (2026-07-29).

Before pushing anything to `feature/ai-website-writer`, remember it auto-deploys to Netlify — ask first rather than pushing reflexively, even for something as small as a `.gitignore` line (this happened once this session and triggered a real, if harmless, production redeploy).

## What's NOT set up yet

- **No custom domain on the Cloudflare side.** The Worker only has the default `kdksites.kartik-khandelwal.workers.dev` — no `*.kdksites.in` wildcard DNS points here. Netlify still owns that.
- **No CI for the Cloudflare deploy.** Every `wrangler deploy` so far has been run manually, from this machine, by Claude on request. There's no GitHub Action or Cloudflare dashboard Git-integration deploying automatically on push to `cloudflare` (the dashboard's Git-connected setup flow was tried first but had no branch picker in its wizard, which is why the CLI approach was used instead).
- **`docs/`, `CLAUDE.md`, and this file itself may not exist in identical form on both branches** — they were last synced on `cloudflare` on 2026-07-29; check before assuming the other branch's docs are current.
