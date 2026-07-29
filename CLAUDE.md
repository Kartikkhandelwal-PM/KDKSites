# CLAUDE.md — Personalised Website Builder
> Project context for Claude Code. Read this before touching any file.

## What This Project Is

A **website builder product** embedded inside the KDK Software desktop/web app. It lets Indian finance and legal professionals (CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, Cost Accountants) create a professional website in under 10 minutes — no technical knowledge required.

- **Product owner:** KDK Software (appadmin@kdksoftware.com)
- **Maintainer:** Kartik Khandelwal (Kartik.khandelwal@kdksoftware.com), GitHub: Kartikkhandelwal-PM
- **Status:** Phase 1 prototype, live on GitHub Pages (as of 2026-07-03)
- **Goal:** Ship a 6-step wizard that publishes a professional site. Prototype is hosted now; production hosting is not yet decided (see Deployment).

---

## Current State (read this first)

- **Live prototype:** https://kartikkhandelwal-pm.github.io/KDKSites/
- **Repo:** https://github.com/Kartikkhandelwal-PM/KDKSites (branch: `main`)
- The site opens **directly on the 6-step builder**. There is no landing dashboard.
- **`frontend/index.html` IS the builder.** It lived at the repo root until the 2026-07-25 reorg moved it into `frontend/`. The `index.html` still at the root is only a fallback redirect. Originally moved up from `Admin Panel/website-builder-admin-v4.html` on 2026-07-03.
- **Hosting:** GitHub Pages (static) off `main`. **Action required:** set Settings -> Pages -> Source to **GitHub Actions** so `.github/workflows/pages.yml` serves `frontend/` as the site root. Every push triggers a rebuild (typically 1 to 3 minutes) followed by a CDN cache refresh.
- The four published website templates live in `frontend/templates/` (apex, nova, heritage, zenith). Each is the design plus a binding script defining `window.__applyConfig(config)`. See [frontend/README.md](frontend/README.md).
- **2026-07-25 reorg:** `Live/` -> `frontend/templates/`, logos -> `frontend/assets/`, `supabase/` + `netlify/` -> `backend/`, spec -> `backend/spec/`, `Admin Panel/` notes -> `docs/`. The stale `New Design copy/` duplicate was deleted.
- **AI Writer + Auth + Supabase + Netlify (prototype, on branch `feature/ai-website-writer`, not yet merged to `main`):**
  - **AI Writer** — a floating button runs a short interview and an LLM drafts the whole site. The AI key is now **server-side** in a Supabase Edge Function (`ai-generate`); the browser calls that, never the provider directly.
  - **Auth** — Supabase Auth (email/password) gates the builder with an animated login; the profile menu has Sign Out.
  - **Supabase** — project `hlhtopqbzfzlxxmolkok`; `wb_websites`/`wb_leads` tables + RLS applied; `ai-generate` function deployed. Public config (URL + anon key) is in committed `frontend/app-config.js`; local AI overrides in gitignored `frontend/local-ai-config.js`.
  - **Publishing** — root `netlify.toml` + `backend/netlify/edge-functions/render.ts` serve published sites at `kdksites.netlify.app/s/<subdomain>` (no domain needed). Publish saves config to Supabase.
  - **Netlify IS connected, and it deploys THIS branch** (verified 2026-07-28, correcting an earlier "pending" note). Evidence: the live page at `kdksites.netlify.app/` is byte-identical (sha256 `bec54c4d…`) to `index.html` at commit `693ae55`, which is exactly where `origin/feature/ai-website-writer` points. **So every push to this branch costs a deploy.** It is a cheap one: `command = ""`, so there is no build step, just a file upload plus the edge-function bundle. Confirm the production branch in Netlify under Site configuration -> Build & deploy -> Branches and deploy contexts.
  - `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` **are already set** on Netlify: `/s/<any-name>` returns a 404 "No site at …" from the Supabase lookup rather than the 500 "Not configured" that a missing var produces. `SITE_DOMAINS` is still unset, which is harmless because `render.ts` defaults it to `kdksites.in`.
  - **Pushing will move the site root** from `publish = "."` to `publish = "frontend"`. The builder stays up: for the `*.netlify.app` host, `fromHost()` returns null and `/` is not a `/s/` path, so `render.ts` returns undefined and the request passes straight through to the static build.
  - **Addresses are a PAIR `(domain, subdomain)`** (2026-07-27). KDK will own a pool of domains and the user picks one, so `sharma` can exist on two of them. The pool is `KDK_AI.siteDomains` in `frontend/app-config.js`; the picker hides while only one is configured. Adding a bought domain = edit that array + wildcard DNS + the `SITE_DOMAINS` env var. `render.ts` resolves by Host, falling back to `/s/<sub>` (default domain) and `/s/<domain>/<sub>`.
  - **Availability + lifecycle** (2026-07-27) — `wb_subdomain_available()` gates Launch on a confirmed-free name; the publish step offers Take offline / Put back online / Delete. Migration `20260727100000` is **applied** to `hlhtopqbzfzlxxmolkok` and verified live.
  - **Portrait crop** (2026-07-27) — every portrait upload (Step 5 and the AI Writer) opens a **Crop & adjust** dialog immediately and stores a **640px square**, because all four templates render the portrait as a square with `object-fit:cover`. `BOX_PHOTO` (3:4) is no longer used for partners. There is no re-crop button on a photo already in place: the cross removes it, and clicking the frame re-picks it, which opens the dialog again.
  - **Mandatory AI Writer answers + no demo data on live sites** (2026-07-28). Two rules to know before touching either area:
    1. **A template must never leave its own demo text standing.** All four bound content as "replace only if a value was given", so a skipped office address published "302, Barakhamba House, Connaught Place, New Delhi" on a Jaipur firm's site, and skipped reviews served the design's sample quotes. Contact rows now remove themselves and the testimonials section hides when empty. **Any new bound field needs an else branch**, or it reintroduces this.
    2. **Completeness lives in one function**, `screenErr(q)` in the AI Writer, run by *both* `next()` and `doGen()`. It is not enough to check in `next()`: the step rail reaches the summary from screen 1, which is exactly how "required" used to be bypassable. Floors are hard (`req`+`min`) or conditional (`min` alone: zero allowed, one is not).
    - Required now: firm, years practising, 2+ "best known for", 2+ "typical clients", 3+ workflow steps, 1+ partner with name **and** role, city, phone, email, office address, office hours (new field, prefilled). All-or-nothing at 3 to 6: Key Numbers and Client Reviews. Key Numbers stays optional on purpose, since forcing it invites an invented client count.
  - **AI Writer prefills from the published site** (2026-07-28). `seedFromSite()` runs on open and fills only **hard facts**: firm, city, years (from Founded Year), phone, email, address, hours, socials, partner names/roles/photos. It deliberately does **not** fill the judgement fields (known-for, clients, numbers, workflow, review notes), because the builder stores only the model's polished prose, and feeding that back as a brief makes it paraphrase itself. Reviews stay empty so a skipped screen **preserves the testimonials already live** (`apply()` leaves `S.testimonials` alone when the model returns none).
    - **Trap:** prefilling makes `anyAnswered()` true before the user types, and three places used that to skip the interview. Use `hasResumableAnswers()` for any resume decision, never `anyAnswered()` on its own.
  - Full detail: [docs/DEV-LOG.md](docs/DEV-LOG.md) 2026-07-11 (Sessions 5 & 6), 2026-07-28 (Sessions 18 & 19).
- **Second host: Cloudflare Workers, on its own `cloudflare` branch** (2026-07-29, forked from `feature/ai-website-writer`; that branch keeps deploying to Netlify, untouched). Daily-dev deploys go here instead of spending Netlify's usage limits. Builder + published sites both live at `kdksites.kartik-khandelwal.workers.dev`; deploy manually with `wrangler deploy` (no auto-deploy on push). Full reference, including two gotchas already hit once (a secret briefly leaked via a disk-vs-git deploy difference, and a hardcoded share-link host) — see [docs/CLOUDFLARE-DEPLOY.md](docs/CLOUDFLARE-DEPLOY.md) and [docs/DEV-LOG.md](docs/DEV-LOG.md) 2026-07-29 (Session 21).

### Deploy a change
```
git add -A && git commit -m "your message" && git push
```
Then wait 1 to 3 minutes for the Pages rebuild. Preview locally without deploying:
```
cd frontend && python3 -m http.server 8765    # then open http://localhost:8765/
```
Serve from `frontend/`, not the repo root, so paths match production. (From the
root it also works, at `http://localhost:8765/frontend/`.)

### GitHub auth
Auth uses the `gh` CLI (installed via Homebrew). If a push fails with no credentials, run `gh auth login` (GitHub.com, HTTPS, login with a web browser) then `gh auth setup-git`.

---

## Session Handoff Protocol (IMPORTANT: keeps work resumable across machines and accounts)

Claude's per-account memory does **not** transfer between accounts or machines. The **repo is the only durable state**. So at the **end of every working session** you MUST:

1. Add a dated entry to [docs/DEV-LOG.md](docs/DEV-LOG.md): what changed, decisions, blockers, next steps.
2. Bump [docs/CHANGELOG.md](docs/CHANGELOG.md) if features or structure changed.
3. Update the **Current State** section above if the live state, URL, or structure changed.
4. `git add -A && git commit && git push` so it is saved to GitHub.

Any new session should **START** by reading this file, then the top entry of [docs/DEV-LOG.md](docs/DEV-LOG.md), to know exactly where things stand.

---

## Project Structure

Split into `frontend/` + `backend/` + `docs/` on 2026-07-25. **`frontend/` is the
published site root on both hosts** (GitHub Pages uploads it, Netlify publishes
it), so paths inside it stay relative and resolve unchanged.

Only `netlify.toml` is pinned to the repo root: Netlify reads its config from
nowhere else. The root `index.html` is **not** the builder any more, just a
fallback redirect (see the note under the tree).

```
KDKSites/
├── netlify.toml                      # [PINNED to root] publish=frontend, edge_functions=backend/...
├── index.html                        # NOT the builder — fallback redirect to frontend/
├── README.md                         # Repo readme + live URL
├── CLAUDE.md                         # This file — start here
├── .gitignore                        # Excludes .claude/, "* copy/", OS files, local-ai-config.js
├── .github/workflows/pages.yml       # Publishes frontend/ as the Pages site root
│
├── frontend/                         # EVERYTHING THE BROWSER DOWNLOADS = the site root
│   ├── README.md                     # How templates/ works; adding a 5th design
│   ├── index.html                    # THE 6-step builder wizard (real entry point)
│   ├── app-config.js                 # Public Supabase config: URL + anon key
│   ├── local-ai-config.js            # Local AI overrides — gitignored, holds a key
│   ├── assets/
│   │   ├── ca-india-logo.png         # Favicon for builder + all templates
│   │   └── kdk-sites-logo.png        # KDK Sites brand logo (icon + wordmark)
│   └── templates/                    # The 4 PUBLISHED renderers (was Live/)
│       └── apex|nova|heritage|zenith/index.html
│
├── backend/
│   ├── README.md                     # What is built vs spec-only; CLI + env vars
│   ├── supabase/                     # BUILT: config.toml, migrations/, functions/ai-generate/
│   ├── netlify/edge-functions/       # BUILT: render.ts — serves /s/<subdomain>
│   └── spec/                         # NEVER BUILT: the planned Golang + MySQL backend
│
└── docs/
    ├── PRD - Website Builder.md      # Full product requirements (note: still lists older 3-template lineup)
    ├── CHANGELOG.md                  # Version history & change log
    ├── DEV-LOG.md                    # Detailed daily dev log
    └── ADMIN-PANEL-UNDERSTANDING.md  # Notes on admin/builder behaviour
```

### Three things that will bite you

1. **`backend/spec/` is paper only.** The schema that actually runs is
   `backend/supabase/migrations/` (Postgres), *not* `spec/database-schema.sql` (MySQL).
2. **The Supabase CLI needs the right working directory** now that `config.toml`
   sits at `backend/supabase/`: run `cd backend && supabase …` or
   `supabase --workdir backend …`. Bare `supabase db push` from the root will not
   find the project.
3. **GitHub Pages needs a one-time settings change** to serve `frontend/` at the
   site root: Settings -> Pages -> Source -> **GitHub Actions**. Until that is
   flipped, Pages serves the branch root and the fallback `index.html` forwards
   visitors to `/frontend/` so the live URL keeps working. Delete that fallback
   once Pages is on GitHub Actions.

---

## Tech Stack

### Currently running (the prototype)
| Layer | Technology |
|---|---|
| Everything | Self-contained single-file HTML/CSS/JS (no build step, no CDN) |
| Hosting | GitHub Pages (static), repo `Kartikkhandelwal-PM/KDKSites`, branch `main` |

### Planned backend (specified, NOT built yet)
| Layer | Technology |
|---|---|
| Backend | Golang |
| Frontend (Builder UI) | React + Vite |
| Database | MySQL |
| Published Website Rendering | Server-rendered (dynamic per visit) |
| Hosting | KDK infrastructure; subdomains `name.kdksites.in` |

> **Hosting decision is open.** On 2026-07-02/03 we discussed replacing the Golang + MySQL plan with **Supabase (Postgres)** for data and **Cloudflare Pages** for hosting (allows commercial use and wildcard `*.kdksites.in`, unlike GitHub Pages whose terms forbid commercial hosting). Nothing is committed. GitHub Pages is fine for this **prototype/demo** only. See [docs/DEV-LOG.md](docs/DEV-LOG.md).

---

## Key Design Decisions

- **All designs are single-file HTML prototypes** — no build step, open directly in browser
- **Inline SVG icons** everywhere — no emoji, no external icon libraries
- **System font stack** (`'Segoe UI', system-ui, sans-serif`) — no Google Fonts dependency
- **No external CDN** — all styles and scripts are self-contained per file
- **Colour variables** via CSS custom properties on `:root`
- **Mobile-responsive** — all published templates use flexbox/grid with fluid units

### Colour tokens (used across all files)
```css
--navy:   #0D1E35
--gold:   #C4830A
--emerald:#0F6B45
--brown:  #6B3A1F
--ground: #F0F4F8
--border: #DDE5EF
--muted:  #5A7A9B
```

---

## The 6 Builder Steps

1. **Profession** — Select from 6 preset profession types
2. **Design & Colour** — Choose from 4 designs (Apex, Nova, Heritage, Zenith), then a colour theme
3. **Business Info** — Firm name, tagline, contact, about text
4. **Services** — Toggle pre-loaded services per profession
5. **Colour Theme** — 6 palette options
6. **Publish** — Pick subdomain → go live

---

## Professions & Pre-loaded Services

| Profession | Services |
|---|---|
| Chartered Accountant | ITR, GST, Tax Audit, TDS, ROC, NRI Services |
| Advocate / Lawyer | Civil, Criminal, Corporate, Tax Litigation, Property |
| Tax Consultant | ITR, TDS, Tax Planning, NRI Tax, IT Notices |
| GST Practitioner | GST Registration, Returns, GSTR-9, Notices |
| Company Secretary | Incorporation, ROC Filings, FEMA, Board Meetings |
| Cost Accountant | Cost Audit, CAS, Management Accounting, Budgeting |

---

## Phase 1 Scope Boundaries

**In scope:**
- 6-step wizard, 4 designs (Apex, Nova, Heritage, Zenith), 6 colour themes
- Subdomain hosting (`name.kdksites.in`)
- Lead capture → email + KDK leads inbox
- WhatsApp button on all published sites
- 5-section layout: Hero, Services, About, Contact, Footer

**Out of scope (Phase 1):**
- Custom domains
- Client portal / login
- Blog, multiple pages
- Payment gateway / booking system
- Integration with existing KDK profile data

---

## API Overview

Base: `POST /api/v1/website-builder/` — all endpoints require JWT from KDK app.

12 endpoints covering: get-website, create, update-info, update-services, update-theme, publish, check-subdomain, get-leads, analytics, delete, preview, list-professions.

Full spec in [backend/spec/api-spec.md](backend/spec/api-spec.md).

---

## Database

5 MySQL tables: `websites`, `website_business_info`, `website_services`, `website_leads`, `website_analytics`.

Full schema + seed data for all 6 professions in [backend/spec/database-schema.sql](backend/spec/database-schema.sql).

---

## What NOT to Do

- Do not add external script/stylesheet CDN links to any HTML file
- Do not use emoji in design files — use inline SVG
- Do not create additional dependencies or build systems for the prototype phase
- Do not deviate from the CSS variable colour system already established
- Phase 2 features (custom domains, blog, booking) should not be designed yet

---

## Working With This Project

- **To open the builder:** open `frontend/index.html` in a browser, or visit the live URL above
- **To view a template:** open any `frontend/templates/<name>/index.html`
- **To understand the product:** read `docs/PRD - Website Builder.md`
- **To know the current state / how to continue:** read the **Current State** and **Session Handoff Protocol** sections at the top of this file, then the top entry of `docs/DEV-LOG.md`
- **To track changes:** see `docs/CHANGELOG.md` and `docs/DEV-LOG.md`
