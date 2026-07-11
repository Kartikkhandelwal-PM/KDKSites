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
- The root **`index.html` IS the builder.** It was moved up from `Admin Panel/website-builder-admin-v4.html` on 2026-07-03, and its `../` asset paths were rewritten to be root-relative.
- **Hosting:** GitHub Pages (static), serving the root of `main`. Every push triggers a Pages rebuild (typically 1 to 3 minutes) followed by a CDN cache refresh.
- The four published website templates live in `Live/` (apex, nova, heritage, zenith). `New Design/` holds design iterations. `Admin Panel/` now holds only its notes file.
- **AI Website Writer (prototype, on branch `feature/ai-website-writer`, not yet merged to `main`):** a floating button in the builder runs a short interview and an LLM drafts the whole site. It needs a **gitignored `local-ai-config.js`** holding an API key (OpenAI or Anthropic) and calls the LLM **directly from the browser — local demo only**. Production must move this server-side (never ship a key to the browser). See [docs/DEV-LOG.md](docs/DEV-LOG.md) 2026-07-11.

### Deploy a change
```
git add -A && git commit -m "your message" && git push
```
Then wait 1 to 3 minutes for the Pages rebuild. Preview locally without deploying:
```
python3 -m http.server 8765     # then open http://localhost:8765/
```

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

```
KDKSites/                             # repo root (this is what GitHub Pages serves)
├── index.html                        # THE 6-step builder wizard (site entry point)
├── README.md                         # Repo readme + live URL
├── CLAUDE.md                         # This file — start here
├── .gitignore                        # Excludes .claude/, New Design copy/, OS files
├── CA India Logo.png                 # Logo asset used by builder + templates
├── KDK Sites.png                     # KDK Sites brand logo (icon + wordmark)
├── Admin Panel/
│   └── ADMIN-PANEL-UNDERSTANDING.md  # Notes on admin/builder behaviour
├── Live/                             # Published website templates (live renderers)
│   ├── apex/index.html
│   ├── nova/index.html
│   ├── heritage/index.html
│   └── zenith/index.html
├── New Design/                       # Design iterations (apex, nova, heritage, zenith, zenith V2)
├── docs/
│   ├── PRD - Website Builder.md      # Full product requirements (note: still lists older 3-template lineup)
│   ├── CHANGELOG.md                  # Version history & change log
│   └── DEV-LOG.md                    # Detailed daily dev log
└── backend/
    ├── api-spec.md                   # 12 REST endpoints (Golang) — SPEC ONLY, not built
    └── database-schema.sql           # MySQL schema, 5 tables + seed — SPEC ONLY, not built
```
> `New Design copy/` exists locally but is gitignored (not published).

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

Full spec in [backend/api-spec.md](backend/api-spec.md).

---

## Database

5 MySQL tables: `websites`, `website_business_info`, `website_services`, `website_leads`, `website_analytics`.

Full schema + seed data for all 6 professions in [backend/database-schema.sql](backend/database-schema.sql).

---

## What NOT to Do

- Do not add external script/stylesheet CDN links to any HTML file
- Do not use emoji in design files — use inline SVG
- Do not create additional dependencies or build systems for the prototype phase
- Do not deviate from the CSS variable colour system already established
- Phase 2 features (custom domains, blog, booking) should not be designed yet

---

## Working With This Project

- **To open the builder:** open `index.html` in a browser, or visit the live URL above
- **To view a template:** open any `Live/<name>/index.html`
- **To understand the product:** read `docs/PRD - Website Builder.md`
- **To know the current state / how to continue:** read the **Current State** and **Session Handoff Protocol** sections at the top of this file, then the top entry of `docs/DEV-LOG.md`
- **To track changes:** see `docs/CHANGELOG.md` and `docs/DEV-LOG.md`
