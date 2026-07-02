# CLAUDE.md — Personalised Website Builder
> Project context for Claude Code. Read this before touching any file.

## What This Project Is

A **website builder product** embedded inside the KDK Software desktop/web app. It lets Indian finance and legal professionals (CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, Cost Accountants) create a professional website in under 10 minutes — no technical knowledge required.

- **Product owner:** KDK Software (appadmin@kdksoftware.com)
- **Status:** Phase 1 — In Design (as of June 2025)
- **Goal:** Ship a 6-step wizard that publishes a live site on `name.kdksites.in`

---

## Project Structure

```
Personalised Website Builder/
├── INDEX.html                        # Project dashboard — open in browser
├── CLAUDE.md                         # This file
├── docs/
│   ├── PRD - Website Builder.md      # Full product requirements
│   ├── CHANGELOG.md                  # Version history & change log
│   └── DEV-LOG.md                    # Detailed daily dev log
├── designs/
│   ├── website-builder-admin.html    # 6-step wizard UI (interactive prototype)
│   ├── website-published-prestige.html   # Template: Prestige (dark navy/gold)
│   ├── website-published-clarity.html    # Template: Clarity (white/emerald)
│   └── website-published-heritage.html   # Template: Heritage (parchment/brown)
└── backend/
    ├── api-spec.md                   # 12 REST endpoints (Golang)
    └── database-schema.sql           # MySQL schema — 5 tables + seed data
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Golang |
| Frontend (Builder UI) | React + Vite |
| Database | MySQL |
| Published Website Rendering | Server-rendered (dynamic per visit) |
| Hosting | KDK infrastructure; subdomains `name.kdksites.in` |

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
2. **Template** — Choose Prestige / Clarity / Heritage
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
- 6-step wizard, 3 templates, 6 colour themes
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

- **To view designs:** Open any `.html` file directly in a browser
- **To understand the product:** Read `docs/PRD - Website Builder.md`
- **To track changes:** See `docs/CHANGELOG.md` and `docs/DEV-LOG.md`
- **To browse everything:** Open `INDEX.html` in a browser
