# CHANGELOG — Personalised Website Builder
> All notable changes, additions, and decisions are documented here.
> Format: `[version] YYYY-MM-DD — Summary`

---

## [0.9.1] 2026-07-25 — Repository reorganisation

> Housekeeping only. No product behaviour, UI, or feature change. All moves used `git mv`, so file history is preserved.

### Removed
- **`New Design copy/`** — a stale Finder duplicate, byte-identical to `New Design/` and already gitignored.
- All `.DS_Store` files from the working tree.

### Changed
- **`Live/` → `templates/`** (the four published renderers). Updated `index.html`, `netlify/edge-functions/render.ts`, and `netlify.toml`.
- **`New Design/` → `design-samples/`**, and `zenith V2/` → `zenith-v2/`.
- **Loose logos → `assets/`**, renamed to remove spaces: `ca-india-logo.png`, `kdk-sites-logo.png`. No path in the repo needs `%20` escaping any more.
- **`Admin Panel/ADMIN-PANEL-UNDERSTANDING.md` → `docs/ADMIN-PANEL-UNDERSTANDING.md`**; the empty folder was removed.
- **`backend/` → `docs/backend-spec/`** — it holds only the never-built Golang + MySQL spec. The backend that actually runs is `supabase/` + `netlify/`.
- **`.gitignore`** now ignores `* copy/` and `* copy */` generally instead of one hardcoded folder name.
- `CLAUDE.md` and `README.md` structure sections rewritten, and the four tooling-pinned root files (`index.html`, `app-config.js`, `local-ai-config.js`, `netlify.toml`, plus `supabase/`) marked `[PINNED]` so they are not moved in future cleanups.

### Notes
- A literal `frontend/` folder is not possible: GitHub Pages serves only the repo root or `/docs`, so the builder's `index.html` and its root-relative scripts must remain at the root.
- **Deploy note:** `render.ts` now fetches `/templates/<key>/index.html`. The renamed tree and the Edge Function must deploy together, or published sites return "Template missing".

---

## [0.9.0] 2026-07-11 — User auth + Supabase backend + Netlify publishing

> Branch `feature/ai-website-writer`. Adds login, a Supabase backend, and Netlify hosting so published sites can actually go live (no domain needed). The AI key moves server-side.

### Added
- **User authentication** (Supabase Auth via REST, no CDN library): animated dark split-screen login/signup that gates the builder; name+email captured on sign-up; persistent session with token refresh; signed-in user shown in the sidebar.
- **Account menu** — clicking the profile opens an in-place popover: Profile / Settings / Subscription (placeholders, no navigation) + working **Sign Out**.
- **Supabase backend** — `wb_websites` (JSONB config) + `wb_leads` tables with RLS; `ai-generate` Edge Function that proxies OpenAI/Anthropic with the key **server-side**.
- **Publishing to Netlify** — `netlify.toml` + `render` Edge Function serve each published site at `/s/<subdomain>` from its saved config + `Live/` template; **Save-on-Publish** writes config to Supabase.
- `app-config.js` — public Supabase URL + anon key so the deployed builder has auth/publish.
- Splash re-skinned to the dark premium theme; login mesh-gradient + drifting orbs + browser mockup + waving 👋.

### Changed / Fixed
- The splash no longer flashes on refresh for signed-in users (shown only to logged-out/new visitors).
- Fixed the profile click not opening the account menu (bound directly to the element, overriding the stale inline handler).

### Decisions / notes
- **No domain required** to go live: `kdksites.netlify.app/s/<subdomain>` now; becomes `sub.kdksites.in` once `kdksites.in` + wildcard DNS exist, with no builder change.
- Public vs secret split: anon key + URL are committed (`app-config.js`); `service_role` key lives only in Netlify env, OpenAI key only in Supabase secrets.
- Pending: user connects Netlify (repo access + env vars) to go live.

---

## [0.8.0] 2026-07-11 — AI Website Writer (prototype)

> Branch `feature/ai-website-writer`. Adds an AI-assisted "write my whole site" flow to the builder, and removes leftover demo data from published sites. AI runs **client-side for local demo only**; production must move it server-side.

### Added
- **AI Website Writer** in `index.html`: a floating sparkle button opens a short guided interview (profession, firm, differentiator, clients, key numbers, how-you-work, client reviews, location + contact, founder, extra — most steps skippable), then an LLM drafts and fills the entire builder: tagline, hero (short slogan headline + accent + sub), CTAs, audience tags, key stats, About highlights, How-We-Work steps, testimonials, credentials, about, founder bio, footer, and all service descriptions.
- **Provider-agnostic** LLM integration (OpenAI or Anthropic/Claude), switched via a **gitignored `local-ai-config.js`** holding the API key (never committed).
- Animated "building your site" loading state (shimmering site skeleton + cycling status messages).
- Repeatable **client-reviews** input; the AI writes polished testimonials from the user's rough notes (never fabricated when skipped).
- Input helpers: `smartTitle()` auto-capitalisation (firm/city/address/founder, acronym-aware), `capFirst()` on email, and a ₹ ★ + % ✓ symbol inserter for Key Stats.

### Changed / Removed
- **Removed all fake "Sharma & Associates" demo data** from the builder defaults (firm, contact, address, copyright, hero, about, founder, stats, testimonials) → empty fields with guiding placeholders. Empty stats/highlights/process/testimonials are filtered out at publish/preview so they never ship as blank cards.
- Services list now shows active services on top, disabled at the bottom.
- The floating AI button is hidden while the preview/publish overlay is open.
- Added `<meta charset="utf-8">` to `index.html` (fixed ₹ / ★ / © mojibake).

### Fixed
- **`window.S` bug:** builder state is `const S`, which doesn't attach to `window`, so the AI Writer's `window.S`-guarded sections (stats/highlights/process/testimonials/tags/service descriptions) were silently skipped. Fixed with `window.S = S;`.
- **Heritage template:** the testimonials watermark leaked the literal "HERITAGE" → now bound to the firm name.
- **Publish step:** the firm/city checklist line showed a stray "," when those fields were empty → now handled gracefully.

### Decisions / open items
- AI Writer is **local-demo only** as shipped (browser-direct API call exposes the key). Production must call the LLM **server-side** (planned Golang/Supabase backend). Provider (OpenAI vs Claude) not finalised.
- Security: the OpenAI key used for local testing lives only in the gitignored config and should be rotated (it was exposed during setup).

---

## [0.7.0] 2026-07-03 — GitHub Pages hosting + repo restructure

> The prototype is now version-controlled and hosted online. Live: https://kartikkhandelwal-pm.github.io/KDKSites/

### Added
- Git repository initialised and pushed to **https://github.com/Kartikkhandelwal-PM/KDKSites** (branch `main`).
- **GitHub Pages** enabled (serves root of `main`). Site is live at https://kartikkhandelwal-pm.github.io/KDKSites/
- `README.md` (repo readme with live URL and structure) and `.gitignore` (excludes `.claude/`, `New Design copy/`, OS files).
- `gh` CLI installed (Homebrew) and authenticated as `Kartikkhandelwal-PM` for pushes and Pages API.

### Changed — entry point is now the builder
- The builder (`Admin Panel/website-builder-admin-v4.html`) was **moved to the repo root as `index.html`**, and its `../` asset paths were rewritten to root-relative. The site now opens **directly on the 6-step builder**; the old project dashboard was removed.
- Docs reconciled to reality: `CLAUDE.md` structure, tech stack (current vs planned), template lineup (4 designs: Apex/Nova/Heritage/Zenith), and a new **Current State** + **Session Handoff Protocol** section so any session (any account/machine) can resume from the repo alone.

### Decisions / open items
- **Hosting is not finalised.** GitHub Pages is used for the prototype only. Its terms forbid commercial hosting of customer sites, and per-site wildcard subdomains are painful. For production we discussed **Supabase (Postgres)** for data plus **Cloudflare Pages** (commercial-friendly, native wildcard `*.kdksites.in`), deploying from this same repo. No decision committed.
- Persistence rule established: Claude's per-account memory does not transfer, so the repo docs are the single source of truth and must be updated + pushed every session.

### Reverted
- A trial header change (swapping the text logo for `KDK Sites.png`) was previewed locally and rolled back at the user's request. No header change shipped.

---

## [0.6.0] 2026-07-02 — Builder Admin UX Overhaul (v4)

> All work in this release is in `Admin Panel/website-builder-admin-v4.html` and the four `Live/` renderers (`apex`, `heritage`, `nova`, `zenith`).

### Added — Step 1 "Choose your design and colours"
- **Live design thumbnails**: each design card now embeds the real `Live/` site in a desktop-width iframe scaled down to fit, replacing the four identical wireframe skeletons.
- **Hover Preview**: hovering a card reveals a "Preview" button that opens the in-app preview overlay for that design on the same page (no new tab). `openPreview()` now accepts a design key so any card can be previewed without changing the current selection.
- **Live colour reflection**: choosing a colour theme now recolours the selected design's thumbnail in place, via a colour-only postMessage to the iframe.

### Added — Admin guidance and validation
- Reusable educational info callouts (`.f-note`) explaining what a section does and where it appears.
- **"How We Work" step validation**: minimum 3, maximum 5 steps. Add button disables at 5, delete buttons disable at 3, with a live "N of 5 steps" counter and toast messages.
- Hero Images field is now shown **only when the Nova design is selected** (Nova is the only photo-hero design); hidden for Apex, Heritage, Zenith.

### Changed — Admin visual polish
- Form-card header icons upgraded from flat tint squares to gradient badges with depth.
- Form cards, inputs, upload zones, and the Publish "globe" illustration refined (hover states, gradients, solid gold globe).
- Left sidebar footer redesigned into a contained progress panel with a gradient bar.
- Row delete (trash) button redesigned: neutral ghost by default, delete-red on hover, crisper icon.
- Removed the design-card badge pills ("Most Popular / Advocates / Modern / Corporate") that were covering the website hero, and the new-tab "Open sample" link.
- Removed em dashes from all user-facing admin copy (per content style rule).

### Changed — Live templates ("How We Work" alignment)
- `apex`, `nova`, `heritage`: process grid converted to a centered flex layout so partial rows (3, 4, or 5 steps) stay centered instead of left-aligned with a gap. Card widths preserved.
- `zenith`: no change needed (vertical, already-centered timeline).

### Fixed
- Step-1 thumbnails were reading a stale shared `kdk_wb_config` from `localStorage`, causing all four to show the same (line-break-flattened) headline. `pushConfig()` no longer writes `localStorage`, and stale render-config keys are cleared on load so each thumbnail shows its own pristine default. The user's saved draft (`kdk_wb_draft`) is left untouched.

### Note — Documentation drift
- Docs still describe the earlier 3-template lineup (Prestige / Clarity / Heritage) and the `designs/website-builder-admin.html` path. Current work uses 4 designs (Apex / Heritage / Nova / Zenith) under `New Design/` + `Live/`, with the admin at `Admin Panel/website-builder-admin-v4.html`. CLAUDE.md and the PRD have not yet been reconciled to this.

---

## [0.5.0] 2026-06-23 — Universal Template Content (Content Audit Fix)

### Changed — Heritage (Advocate) template
- Hero badge: removed "Chennai" city name
- Hero paragraph: "Tamil Nadu" → "across India"
- About story: removed Madras High Court, Tamil Nadu, state-specific references
- About badges: specific bar council reg number removed; "Madras High Court" → "High Court Enrolled"
- Team section: removed "Bar Council TN · Reg. TN/XXXX" state-coded registration numbers
- Testimonials: removed suburb/city name "Adyar", removed "in Chennai"
- **Credentials section**: replaced all 5 hardcoded Tamil Nadu cards with universal advocate credentials (High Court Enrolled, Bar Council Member, AIBE Certified, Pan-India Practice, Years of Practice)
- Footer: removed state bar council number and "Madras High Court"; removed specific Chennai address

### Changed — Clarity (Tax Consultant) template
- Hero badge: removed "Mumbai"
- Hero/about: removed all "Maharashtra" references → "India"
- About credentials: removed specific ICAI M.No. and FRN numbers → generic labels
- Contact: specific Mumbai/Andheri address → placeholder; state-coded GST number removed
- Footer: specific membership numbers removed → profession descriptors

### Changed — Prestige (CA) template
- Hero eyebrow: removed "New Delhi"
- About: removed "Delhi NCR, Maharashtra" → "across India"
- About credentials: specific ICAI/FRN numbers → "ICAI Member", "ICAI Registered Firm"
- Contact: removed specific Connaught Place address → placeholder
- Footer: specific numbers removed → "ICAI Member · Firm Registered with ICAI"

### Principle Added
Universal defaults only. City, address, registration numbers, founding year, and state-specific credentials must come from the admin builder, not the template. See DEV-LOG 2026-06-23 for the full decision table.

---

## [0.4.0] 2026-06-23 — Project Docs & Logging Infrastructure

### Added
- `CLAUDE.md` — project context file for AI-assisted development; covers structure, tech stack, design rules, scope boundaries
- `docs/CHANGELOG.md` — this file; tracks all versions and changes
- `docs/DEV-LOG.md` — daily development log with decisions, blockers, and next steps
- `INDEX.html` now links to all docs (already referenced in the UI)

### Notes
- Project structure is now fully documented
- All future changes must be logged here and in DEV-LOG.md

---

## [0.3.0] 2025-06-22 — Backend Specification Complete

### Added
- `backend/api-spec.md` — 12 REST endpoints for Golang backend
  - GET my-website
  - POST create (step 1: profession)
  - PUT update-info (step 3: business details)
  - PUT update-services (step 4: services toggle)
  - PUT update-theme (step 5: colour/template)
  - POST publish (step 6: go live)
  - GET check-subdomain (availability check)
  - GET leads
  - GET analytics
  - DELETE website
  - GET preview
  - GET list-professions
- `backend/database-schema.sql` — MySQL schema with 5 tables and full seed data for all 6 professions

### Tech Decisions
- Backend language confirmed: **Golang**
- Database confirmed: **MySQL**
- Auth: JWT passed from KDK main app — no separate auth system in website builder
- Subdomains: `name.kdksites.in` pattern

---

## [0.2.0] 2025-06-21 — All Three Templates Built

### Added
- `designs/website-published-prestige.html`
  - Dark navy (`#0D1E35`) + saffron gold (`#C4830A`)
  - Target: Chartered Accountants, Senior Advocates
  - Canvas: balance scale + ledger grid texture illustration
- `designs/website-published-clarity.html`
  - White + deep emerald (`#0F6B45`)
  - Target: Tax Consultants, GST Practitioners
  - Canvas: compliance dashboard card visual
- `designs/website-published-heritage.html`
  - Warm parchment (`#F9F4EC`) + cognac brown (`#6B3A1F`)
  - Target: Advocates, Company Secretaries
  - Canvas: ornate scales of justice illustration

### Design Decisions
- All templates share identical HTML structure — only CSS variables differ
- 9 page sections per template: Nav, Hero, Stats Bar, Services, About, Why Us, Testimonials, Contact, Footer
- WhatsApp floating button on all templates
- All icons are inline SVG — no emoji, no external libraries
- Sticky navigation with blur backdrop on scroll

---

## [0.1.0] 2025-06-20 — Builder Admin UI + PRD

### Added
- `designs/website-builder-admin.html` — fully interactive 6-step wizard prototype
  - Step 1: Profession picker (6 cards)
  - Step 2: Template chooser (3 options with live preview)
  - Step 3: Business info form (firm name, tagline, contact, about)
  - Step 4: Services toggle (pre-populated per profession)
  - Step 5: Colour theme picker (6 palettes)
  - Step 6: Subdomain selector + publish button
  - Sidebar live preview that updates as user fills the form
- `docs/PRD - Website Builder.md` — full product requirements document
  - Problem statement
  - 6 target professions + pre-loaded services
  - Phase 1 scope (in/out)
  - 6-step wizard breakdown
  - Template descriptions
  - Lead capture flow
  - Design system spec
  - Tech stack
  - Business model options
  - Success metrics

### Product Decisions
- Build time target: **< 10 minutes** end-to-end
- Wizard completion target: **> 70%** of users finish all 6 steps
- Phase 1 launch target: **100+ websites published** in first month
- Business model: TBD (add-on subscription / one-time / freemium / bundled)

---

## [0.0.1] 2025-06-19 — Project Init

### Added
- `INDEX.html` — project dashboard showing all files, progress stats, template previews
- Project folder created at `App Development/Personalised Website Builder/`
- Folder structure defined: `/designs/`, `/docs/`, `/backend/`

### Context
- Product idea scoped and approved internally at KDK Software
- Phase 1 prioritised: design + prototype before any backend work
- Goal: show stakeholders a clickable prototype first

---

## Upcoming (Planned)

### [0.5.0] — Phase 1 Handoff
- [ ] Final design review of all 3 templates
- [ ] API spec review with Golang backend team
- [ ] Database schema review
- [ ] Stakeholder sign-off on PRD
- [ ] Confirm business model

### [1.0.0] — Phase 1 Development Start
- [ ] React + Vite setup for builder admin
- [ ] Golang API implementation
- [ ] MySQL setup + migrations
- [ ] Subdomain provisioning infrastructure
- [ ] Lead email notification system
- [ ] Internal beta with 10 KDK customers
