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
  - **Publishing** — root `netlify.toml` + `backend/netlify/edge-functions/render.ts` serve published sites at `kdksites.netlify.app/s/<subdomain>` (no domain needed). Publish saves config to Supabase. **Pending: user connects Netlify** (repo access + `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` env vars).
  - Full detail: [docs/DEV-LOG.md](docs/DEV-LOG.md) 2026-07-11 (Sessions 5 & 6).

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
