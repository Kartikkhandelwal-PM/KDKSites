# DEV-LOG — Personalised Website Builder
> Day-by-day record of what was built, what was decided, what's blocked, and what's next.
> Most recent entries at the top.

---

## 2026-07-02 — Session 3 (Builder Admin UX overhaul)

### Session Summary
- Iterative UX pass on the builder admin (`Admin Panel/website-builder-admin-v4.html`) plus "How We Work" alignment fixes across the four `Live/` templates. Released as [0.6.0].

### What Was Done
- [x] **Step 1 live previews**: replaced identical wireframe thumbnails with scaled iframes of the real `Live/` sites.
- [x] **Hover Preview** button on each design card, opening the in-app overlay on the same page; `openPreview(key)` can now target any design.
- [x] **Live colour reflection**: theme changes recolour the selected design's thumbnail via colour-only postMessage.
- [x] Removed design-card badge pills (were covering the hero) and the new-tab "Open sample" link.
- [x] **Process step validation** (min 3 / max 5): disabled add/delete states, live counter, toasts.
- [x] **Hero Images field gated to Nova** only.
- [x] Educational info callouts added; em dashes removed from user-facing copy.
- [x] Visual polish: gradient form-card icons, refined inputs/upload zones/publish globe, redesigned sidebar footer, redesigned row delete button.
- [x] **"How We Work" alignment**: `apex`/`nova`/`heritage` process grids switched to centered flex so 3, 4, or 5 steps stay centered; `zenith` timeline unchanged.
- [x] Verified all changes by headless Chrome screenshots (3/4/5-step layouts, Nova vs non-Nova, min/max states).

### Decisions Made
- **Thumbnails render pristine per-design defaults, not the user's edits** (only colour is pushed). Keeps the design chooser a clean showcase.
- **Config flows by postMessage only** — `pushConfig()` no longer writes `localStorage`; stale render keys are cleared on admin load. Prevents thumbnails/samples being polluted by old saved config (which had flattened a multi-line headline).
- **Process steps constrained to 3–5** so the row stays visually balanced on every template.

### Blockers
- None.

### Open Questions
- Should the small connector arrows on the last card of a wrapped process row (4–5 steps) be hidden? Currently they can point toward the next row.
- Do we mirror these Live-template fixes into the unused `New Design/` sample copies, or retire that folder?

### Doc / Structure Drift (needs reconciling)
- CLAUDE.md and the PRD still reference 3 templates (Prestige/Clarity/Heritage) and `designs/website-builder-admin.html`. Reality: 4 designs (Apex/Heritage/Nova/Zenith) under `New Design/` + `Live/`, admin at `Admin Panel/website-builder-admin-v4.html`, published sample at `website-published-meridian1v.html`. These reference docs have not been updated.

### Next Session Goals
- Decide on the arrow / `New Design` questions above.
- Reconcile CLAUDE.md + PRD with the current 4-design structure and file paths.

---

## 2026-06-23 — Session 2 (Monday)

### Session Summary
- Critical content audit: all 3 templates had hardcoded regional/personal data that would not apply to most users
- Fixed all templates to use universal, profession-generic defaults

### What Was Done
- [x] **Heritage (Advocate)** template:
  - Hero badge: removed "Chennai" city reference
  - Hero paragraph: removed "Tamil Nadu" → "across India"
  - About story: removed "Madras High Court", "Tamil Nadu, Karnataka, Andhra Pradesh" → generic
  - About badges: "Madras High Court Enrolled" → "High Court Enrolled"; "Bar Council Reg. No. TN/1234/1993" → "State Bar Council Registered"
  - Team section: removed "Bar Council TN · Reg. TN/XXXX/XXXX" → "State Bar Council · Enrolled"
  - Team spec: removed "Madras High Court" → "High Court"
  - Testimonials: removed "in Chennai", removed "Adyar" suburb name
  - Credentials section: replaced all 5 Tamil Nadu–specific cards with universal advocate credentials
  - Footer description: removed "from Chennai, serving all of South India" → "serving clients across India"
  - Footer registration: "Bar Council Reg. No. TN/1234/1993 · Madras High Court" → "State Bar Council Registered · High Court Enrolled"
  - Footer contact: replaced specific Egmore/Chennai address with placeholder

- [x] **Clarity (Tax Consultant)** template:
  - Hero badge: removed "Mumbai"
  - Hero paragraph: removed "Maharashtra" → "India"
  - About story: removed "Mumbai's Andheri", "Maharashtra" → generic
  - About bullet: removed "Maharashtra" reference
  - About credential badges: removed specific M.No. and FRN numbers → "ICAI Member", "ICAI Registered"
  - Contact: removed specific Andheri West/Mumbai address → placeholder; removed state-coded GST number (27AADPV1234K1Z9) → "Your GST Number"
  - Footer: removed ICAI M.No., FRN, GST number → profession descriptors only

- [x] **Prestige (CA)** template:
  - Hero eyebrow: removed "New Delhi"
  - About story: removed "Delhi NCR, Maharashtra" → "across India"
  - About credential badges: removed specific ICAI numbers → "ICAI Member", "ICAI Registered Firm"
  - Contact: removed "Connaught Place, New Delhi 110001" → placeholder
  - Footer: removed specific ICAI/FRN numbers → profession descriptors only

### Principle Established (Important)
**Universal defaults + user-configurable specifics.**
- Credentials that ALL practitioners of a type have → show as defaults (High Court Enrolled, Bar Council Member, AIBE Certified, ICAI Member)
- Credentials that are firm-specific (which court, which bar council, registration numbers, city/address, years since founding) → either shown as generic label or left as placeholder for user to fill in the admin builder
- Geographic references removed from all hero/nav sections — user's city comes from admin settings, not template
- This principle must carry into the Wix-style admin redesign: fields like address, registration numbers, founding year must be clearly "fill in yours" inputs

### Design Decision: What NOT to pre-fill
| ❌ Too Specific | ✅ Universal |
|---|---|
| Madras High Court | High Court Enrolled |
| Bar Council TN | State Bar Council Member |
| TN/1234/1993 | (user fills in) |
| 27AADPV1234K1Z9 | Your GST Number |
| Mumbai, Andheri | Your Office Address |
| "since 1993" | Years of Practice |
| "across Maharashtra" | across India |

### Next Session Goals
- Resume Wix-style admin redesign (3-panel WYSIWYG editor)
- Admin must have clear "fill in your details" UX for personal fields
- Credential section in admin must be add/edit/remove per card

---

## 2026-06-23 — Session 1 (Monday)

### Session Summary
- Added project documentation infrastructure: CLAUDE.md, CHANGELOG.md, DEV-LOG.md
- Goal: ensure every future session (human or AI-assisted) has full context on what was built, why, and what the rules are

### What Was Done
- [x] Wrote `CLAUDE.md` — project bible for AI-assisted development. Covers folder structure, tech stack, design rules, colour tokens, scope boundaries, what NOT to do
- [x] Wrote `docs/CHANGELOG.md` — versioned history of every addition from project init (v0.0.1) through today (v0.4.0)
- [x] Wrote `docs/DEV-LOG.md` — this file; daily log going forward

### Decisions Made
- All future work sessions must add an entry to this DEV-LOG
- All feature additions or design changes must be logged in CHANGELOG.md with a version bump
- CLAUDE.md is the single source of truth for "how to work on this project"

### Open Questions
- Business model still TBD — needs internal discussion before Phase 1 dev starts
- No timeline set for Phase 1 development kickoff

### Next Session Goals
- Final review pass on all 3 HTML templates for polish/consistency
- Begin Phase 1 handoff checklist

---

## 2025-06-22 (Sunday)

### Session Summary
- Completed backend specification — API and database both done
- Project is now fully documented at the design/spec level

### What Was Done
- [x] Wrote `backend/api-spec.md`
  - 12 REST endpoints documented with full request/response examples
  - Auth strategy decided: JWT passed from KDK main app
  - Base URL: `/api/v1/website-builder/`
- [x] Wrote `backend/database-schema.sql`
  - 5 tables: `websites`, `website_business_info`, `website_services`, `website_leads`, `website_analytics`
  - Full seed data for all 6 professions (services pre-populated)
  - Indexes on subdomain, kdk_user_id, lead created_at

### Decisions Made
- **Backend language: Golang** — confirmed, consistent with rest of KDK platform
- **Database: MySQL** — consistent with rest of KDK platform
- **Auth: reuse KDK JWT** — website builder is an embedded module, not standalone
- **Subdomains: `name.kdksites.in`** — need DNS wildcard setup on KDK infra

### Blockers
- None currently — design + spec phase is complete

### Tomorrow's Goals
- Review PRD once more for gaps
- Begin INDEX.html dashboard cleanup

---

## 2025-06-21 (Saturday)

### Session Summary
- Built all 3 published website templates
- Major milestone: the product is now visually complete end-to-end

### What Was Done
- [x] Built `designs/website-published-prestige.html`
  - Navy/gold colour scheme
  - Canvas: balance scale with ledger grid texture (pure JS canvas, no images)
  - Sections: Nav, Hero, Stats Bar, 6 Services, About, Why Us, 3 Testimonials, Contact Form, Footer
  - WhatsApp floating CTA button
  - Sticky nav with blur backdrop on scroll

- [x] Built `designs/website-published-clarity.html`
  - White/emerald scheme
  - Canvas: compliance dashboard card illustration
  - Same 9-section structure, different colour tokens

- [x] Built `designs/website-published-heritage.html`
  - Parchment/brown scheme
  - Canvas: ornate scales of justice
  - Same 9-section structure, different colour tokens

### Design Decisions
- **Shared HTML structure across all 3 templates** — only CSS custom properties differ. This means future templates can be created by just overriding `--primary`, `--accent`, `--bg` etc.
- **Canvas illustrations are pure JavaScript** — no SVG images, no external assets, fully self-contained
- **Testimonials are static placeholder content** — dynamic testimonials are Phase 2
- **"Powered by KDK Software"** in every footer — brand awareness play
- **WhatsApp button** uses wa.me deep link format for mobile compatibility

### Notes
- Each template file is completely self-contained (~800–1000 lines HTML+CSS+JS)
- Tested in Chrome and Safari — looks consistent

### Tomorrow's Goals
- Write backend API spec
- Write database schema

---

## 2025-06-20 (Friday)

### Session Summary
- First real build session
- Built the entire builder admin wizard UI and wrote the full PRD

### What Was Done
- [x] Built `designs/website-builder-admin.html` — 6-step interactive wizard
  - Step 1: 6 profession cards with icons (CA, Advocate, Tax Consultant, GST, CS, CMA)
  - Step 2: 3 template cards with mini colour previews
  - Step 3: Business info form with all required fields (firm name, tagline, phone, WhatsApp, email, city, address, about, years exp, clients count, team size, membership number)
  - Step 4: Services toggle — loads different service list based on profession selected in Step 1
  - Step 5: 6 colour theme swatches (Navy/Gold, Navy/Crimson, Forest Deep, Charcoal Gold, Royal Blue, Walnut)
  - Step 6: Subdomain input with availability indicator + Publish button
  - Sidebar: live preview panel that updates as user types/selects
  - Progress bar and step indicators at top

- [x] Wrote `docs/PRD - Website Builder.md`
  - Problem statement (cost/complexity/time barriers for professionals)
  - 6 target professions with pre-loaded services
  - Phase 1 scope definition
  - 6-step wizard breakdown with time estimates
  - Template descriptions
  - 9-section page layout spec
  - Lead capture flow
  - Design system (colours, typography, icons)
  - Tech stack decisions
  - Business model options
  - Success metrics with targets

### Key Product Decisions Made Today
- **Target audience is India-specific** — professions, regulatory references (ICAI, ICSI, ROC, GSTIN etc.) are Indian
- **6 professions only in Phase 1** — keeps services manageable; more can be added later
- **Pre-loaded services are a core UX differentiator** — user doesn't have to type their services from scratch
- **Time target: < 10 minutes** — this is the marketing headline
- **Subdomain is `name.kdksites.in`** — custom domain is Phase 2

### Tomorrow's Goals
- Build all 3 published website templates
- Test wizard flow end-to-end

---

## 2025-06-19 (Thursday)

### Session Summary
- Project kickoff — folder structure, INDEX.html dashboard

### What Was Done
- [x] Created project folder: `App Development/Personalised Website Builder/`
- [x] Created subfolders: `/designs/`, `/docs/`, `/backend/`
- [x] Built `INDEX.html` — internal project dashboard
  - Project progress stats (templates built, professions, API endpoints, DB tables)
  - Cards linking to builder admin and all 3 templates
  - File listing table
  - Links to docs and backend files

### Context & Motivation
- **Why this product?** Most CAs and Advocates in India don't have websites — cost (₹15k–₹80k), time (4–8 weeks), and technical complexity are the blockers
- **Why KDK?** KDK already serves these professionals. Adding a website builder increases ARPU without requiring them to switch tools.
- **Why Phase 1 starts with design?** Need stakeholder buy-in before committing engineering resources. Clickable prototype is more persuasive than a spec doc alone.

### Project Constraints
- Must work within KDK's existing Golang + MySQL + React tech stack
- Must be an embedded module inside KDK app — not a standalone product
- No external dependencies in prototype phase (no CDN, no build tools)
- Must be mobile-responsive from day 1

---

## Log Format Reference

Each entry should cover:
- **Session Summary** — 1–2 sentences on what this session accomplished
- **What Was Done** — checkbox list of completed items
- **Decisions Made** — product/tech/design decisions with brief rationale
- **Blockers** — anything blocking progress
- **Open Questions** — things that need answers before proceeding
- **Next Session Goals** — what to tackle next

Keep entries factual and brief. This is a reference log, not a diary.
