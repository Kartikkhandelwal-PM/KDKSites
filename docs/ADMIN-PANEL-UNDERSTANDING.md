# Admin Panel — Understanding & Spec Reference

> Working understanding of the Website Builder admin panel, grounded in the actual design files in `frontend/design-samples/` and the current prototype `Admin Panel/website-builder-admin-v4.html`.
> Current build state (authoritative) is in §4a. Sections 2–3 below are earlier design context.
> Last reviewed: 2026-07-01

---

## 1. What the Admin Panel Is

A visual editor inside the KDK app where an Indian finance/legal professional builds their own website with zero technical knowledge. The flow:

1. User picks a website **design** (can open the sample in a new tab to see the real thing).
2. User fills in **all their details** (firm, founder, contact, services, stats, testimonials, footer, etc.).
3. The chosen design is **populated** with the user's data.
4. User can **change the colour theme**.
5. User hits a **Preview button** that opens the full website **on the same page** (full-page overlay), with **tablet, desktop, and mobile** view toggles inside it. There is **no** cramped right-side preview rail.
6. User **publishes** to `name.kdksites.in`.

Core principle from the product owner: **every single element must be user-customisable** — hero text and images, services and their descriptions, footer content, colours, stats, everything.

Visual bar for the admin panel itself: **beautiful, excellent-looking, light theme and colours.**

---

## 2. Current State of Assets

### The prototype: `Admin Panel/website-builder-admin-v3.html`
A self-contained HTML/CSS/JS mockup. Three-pane layout: header step dots, left sidebar step nav, centre editor, right live-preview browser.

Wizard is **5 steps**: Template → Business Details → Services → Colour Theme → Publish.

What already works:
- Step navigation, progress bar, animated transitions.
- Template selection updates the preview iframe `src`.
- "Open sample in new tab" links.
- Service toggles, theme card selection, subdomain slug sanitising.

Gaps against the new requirements:
- **Remove the right-side preview rail entirely.** It is too narrow to show the website properly. Replace it with a **Preview button** that opens a **full-page overlay preview on the same page**. The editor becomes full-width.
- The preview overlay needs **three** view toggles: **tablet, desktop, mobile**.
- Preview loads the **static sample**; it does **not** yet reflect the user's own edits.
- Form fields are hardcoded to a single "Sharma & Associates" CA example, not driven by the selected design or profession.
- No real image upload wiring, no per-section customisation for services descriptions, stats, testimonials, process steps, or footer.

### The four website designs: `frontend/design-samples/`
| Design | Folder | Style / Target | Sections |
|---|---|---|---|
| **Apex** | `apex/` | Dark, premium, blue+gold. CA / Tax / Financial consultants | Nav, Hero (SVG art), Stats strip, 8 Services, About+Founder, 3-step Process, 5 Testimonials, Contact, Footer, WhatsApp |
| **Heritage** | `heritage/` | Warm browns/gold/cream, Georgia serif, traditional. Advocates / Legal | Hero, 6 Practice Areas, About+Founder, 4-step Process, Why-Us (4), 5 Testimonials, Contact, Footer, WhatsApp |
| **Nova** | `nova/` | Light, modern, navy+coral. Tax consultants / GST. **Has hero image carousel** | Nav, Hero (image carousel), Stats strip, 8 Services, About+Founder, 3-step Process, 5 Testimonials, Contact, Footer, WhatsApp |
| **Zenith** | `zenith/` | Dark indigo/purple, neon, corporate/fintech. Company Secretaries / Corporate | Hero (canvas particles), 8 Services, About+Founder, 4-step Process, 5 Testimonials, Contact (split), Footer, WhatsApp |

There is also a `frontend/design-samples/zenith-v2/` variant. The earlier prestige/clarity/heritage/meridian set is superseded and no longer in the repo.

---

## 3. Customisable Elements (union across all four designs)

Everything below must be editable from the admin panel. Not every design uses every field, so the editor should adapt to the selected design.

**Branding**
- Firm / practice name
- Tagline
- Logo (upload) and/or monogram letters (e.g. "VS", "PM")

**Founder / Principal**
- Name, designation/role
- Bio paragraph
- Qualifications / credentials (list of bullets)
- Founder photo (upload) with initials fallback

**Hero**
- Eyebrow badge text (e.g. "Accepting new clients for FY 2025-26")
- Main headline (with highlighted phrase)
- Sub-heading / description
- Service tags (approx. 5 short labels)
- Primary + secondary CTA labels
- **Hero image(s)** — required for Nova (4-slide carousel) and any image-based hero

**Stats / counters**
- 3–4 stat pairs (number + label): years of practice, clients served, penalty record, rating, companies served, etc.

**Services**
- Per design: 6 (Heritage) or 8 (Apex/Nova/Zenith) services
- Each service: title + description (+ colour bar / icon)
- Toggle on/off, reorder, add custom service (with description)

**About**
- Founding year, team size, location
- 3 highlight points (title + short text)

**Process / How we work**
- 3 steps (Apex/Nova) or 4 steps (Heritage/Zenith): number + title + description

**Testimonials**
- 5 entries: quote, author name, author role, star rating (photo optional)

**Contact**
- Phone, WhatsApp number, email, office address, office hours
- Contact-form service dropdown options (usually mirrors the services list)

**Footer**
- Firm blurb, registration info (ICAI M.No., FRN, Bar Council, etc.)
- Service links, quick links
- Social links: LinkedIn, Facebook, X, Instagram, YouTube (blank = hidden)
- Copyright line ("Powered by KDK Software" is fixed)

**Colours (theme)**
- Primary colour, accent colour (minimum). Each design maps these onto its own CSS variables.

**WhatsApp**
- Floating button number (`wa.me/<number>`), present on every design.

---

## 4. CSS Variable Map (per design)

The colour theme step must map the user's chosen palette onto each design's own `:root` variables:

- **Apex** — `--blue #1D4ED8`, `--gold #C4830A`, `--emerald #0F6B45`, `--off #F8FAFC`, text `#0F1729`.
- **Heritage** — `--brown #6B3A1F`, `--gold #C4830A`, `--cream #F9F4EC`, `--parch #EDE0CC`, text `#2C1A0E`.
- **Nova** — `--navy #0F1E3C`, `--blue #1A44C0`, `--coral #EA580C`, `--emerald #0F6B45`, `--off #F7F9FC`.
- **Zenith** — `--ink #0D0A14`, `--indigo #7C3AED`, `--ind3 #A78BFA`, text `#F5F0FF`, light card `#F7F9FC`.

Admin-panel UI itself uses its own light token system (see prototype `:root`): `--ground #F4F6FC`, `--surface #fff`, headings `#1A2B4A`, gold `#C4830A`, per-step accent gradients g1–g5.

---

## 4a. Current Build State (as of this session)

- **Admin panel:** `Admin Panel/website-builder-admin-v4.html` — full-width editor (no preview rail), **6-step sequential flow** (see below), full-page Preview overlay with mobile/tablet/desktop toggles. Favicon = `frontend/assets/ca-india-logo.png` (also added to the four `frontend/templates/` renderers; pristine samples untouched).
- **Wizard steps (6; each maps to one page section, top-to-bottom; design + colour are together on Step 1):**
  1. Design & Colours — pick the template, then one of its 6 colour themes (fine-tune pickers removed)
  2. Business & Contact — profession, firm name, tagline, logo, contact, registration, social, footer text
  3. Hero & Stats — badge, **headline (multi-line textarea)**, sub, CTAs, tags, hero images (multiple, for image carousels), key stats
  4. Services — list + descriptions, toggle, add custom
  5. About & Story — about text, founder (name/bio/photo/credentials), highlights, process, **testimonials (editable star rating each)**
  6. Publish — subdomain + launch
- **Colour themes are per-design (6 each):** `THEMES_BY_DESIGN` holds 6 curated, clearly-distinct palettes per design, chosen so text/sections stay legible (dark primaries on the light designs; light accents on the dark Zenith UI). Picking a design refreshes the palette list. Colour changes push to the preview live if it's open (`livePush()`). The old "Fine-tune" custom colour pickers were removed.
- **Theme 0 is the design's ORIGINAL palette:** the config carries `nativeTheme:(S.theme===0)`. When true, each binding **removes** its colour/gradient overrides (`root.style.removeProperty(...)`, empties injected `<style>`s) so the design falls back to its own stylesheet and renders exactly like the pristine `frontend/design-samples/` sample — including Heritage's hero crosshatch/rings. Themes 1–5 recolor the **whole** site.
- **Deep theming (whole-site recolor), because designs hardcode their brand colour in many places:**
  - **Apex** injects a `<style id="kdkTheme">` overriding hero/stats/process/footer/service-bar gradients + the `.hl` highlight.
  - **Nova** overrides `--blue`/`--coral` and retints `--navy` (its dark strips/footer/buttons).
  - **Zenith** was ~60 hardcoded `rgba(124,58,237,…)` + canvas particles + shimmer: converted those to `rgba(var(--ind-rgb),…)`, added `--ind-rgb`/`--ind3-rgb`, retinted the dark backgrounds `--ink/--ink2/--ink3/--g-hero` (via `dk()`), themed `--g-ind`, the canvas (`window.__zParticle`), and the `.hl` shimmer (`<style id="kdkThemeZ">`).
  - **Heritage** had ~32 gold + ~13 brown hardcoded `rgba`: converted to `rgba(var(--gold-rgb),…)`/`rgba(var(--brown-rgb),…)`, so the hero crosshatch, rings, borders and accents follow the theme; hero gradient rebuilt with `dk()` to keep depth so the pattern stays visible.
  - Pattern for adding a new theme-aware design: replace hardcoded brand `rgba(r,g,b,…)` with `rgba(var(--x-rgb),…)`, define `--x-rgb` in `:root`, and set it from `rgbOf(colour)` in the binding (remove it on `nativeTheme`).
- **`.hl` highlight gotcha:** theme it with `background-image` + `background-clip:text` (NOT the `background` shorthand + `!important`, which resets the clip and turns the text into a solid block).
- **Headline:** the admin field is a textarea — each newline becomes a `<br>` on the site (`fmtHeadline` splits on `\n`). Each line's trailing punctuation is kept **inside** the highlight span so no stray period strands. Zenith's `.hl` is `display:block`, so its headline highlight is forced inline (`style="display:inline"`) to avoid double-spacing.
- **Testimonial ratings are editable:** a labelled 5-star control per testimonial (click to set, hover preview, live `N / 5` readout); the value drives the stars shown on the published design.
- **Testimonial carousels** (Apex/Heritage/Nova) re-run their boot function after a short delay (`setTimeout(bootTesti*, 140/420)`) so they compute widths after the preview iframe has laid out — otherwise the cards can render blank until a resize.
- **Hero images support multiple uploads** (Nova rotates through them as its hero carousel; add/remove in a gallery). All uploads (logo/founder/hero) have a remove (×) control.
- **Verification:** jsdom round-trip tests in the scratchpad cover each design + admin (content, theming, native revert, ratings). Current: Apex 33, Heritage 30, Nova 32, Zenith 33, native 6, rating 8 — all passing.
- **Sample templates are pristine and never modified.** `frontend/design-samples/<template>/index.html` are the read-only samples the "Open sample" links point to. They must not contain binding code and must not be mutated by the builder.
- **Customized rendering lives in a separate copy.** Rendered/customized output goes to `frontend/templates/<template>/index.html` — a copy of the pristine sample **plus** a binding script. The admin **Preview** loads the Live copy; it never points at the sample. (In production this maps to the server rendering a per-subdomain instance; the sample template stays untouched.)
- **Data binding:** the panel emits one shared config object (`collectConfig()`) and delivers it two ways: a `postMessage` to the Live preview iframe (primary), and a single `localStorage` key `kdk_wb_config` (fallback). **The panel must never write keys the pristine samples read** (e.g. `kdk_heritage_v2_config`, `kdk_zenith_config`) or the samples change.
- **All four designs are fully wired** (`frontend/templates/apex`, `frontend/templates/heritage`, `frontend/templates/nova`, `frontend/templates/zenith`): each binding populates nav, hero, stats, services, about, founder, process, testimonials, contact, footer, social, WhatsApp, colours, and title from the shared config. Each verified with a jsdom round-trip test (Apex 33, Heritage 30, Nova 30, Zenith 33 checks — all pass). Design-specific handling: Nova's hero image carousel (user image replaces slides) + overlay stats; Zenith's JS-array testimonial rotator (`window.__zTesti` + re-runnable `bootTestiZ()`) and `dl/dt/dd` highlights; Heritage/Apex/Nova DOM testimonial carousels refactored to re-runnable `bootTesti*()` functions.
- **Design switching:** details are entered once into the shared config; switching the template in Step 1 only changes which Live copy renders — all text/services/founder/etc. persist. (Switching does reset the colour palette to the newly chosen design's default; the user can re-tune in Step 6.)
- **Adding a NEW template later:** (1) drop the design in `frontend/design-samples/<key>/`, (2) copy it to `frontend/templates/<key>/` and append a binding `<script>` following the Apex pattern (remap selectors), (3) add one entry to the `DESIGNS` array in the admin with `path` + `live`. No other changes needed.
- **Per-user output (future):** Preview currently renders a single shared `frontend/templates/<key>` copy. Real publishing should render a per-subdomain instance (server-side, or `frontend/templates/<subdomain>/`) so users don't overwrite each other.

## 5. Preview / Data-Binding Mechanism (KEY architectural finding)

**Preview UX (owner decision):** no right-side rail. A **Preview button** opens the populated website as a **full-page overlay on the same page**, with **tablet / desktop / mobile** view toggles inside the overlay and a close button back to the editor. Because the overlay is full-width, each device view can render the site at its true dimensions (or an accurate scale), which the narrow rail could not.

**Binding contract (now implemented for Apex):** the panel sends `{type:'kdk-wb-config', config:{...}}` via `postMessage`; each design listens and calls its `applyConfig(cfg)`. `postMessage` is the reliable channel (the `localStorage` read is a best-effort fallback that browsers block on the `file://` protocol). Config schema keys: `firmName, tagline, about, foundedYear, teamSize, city, founderName, founderRole, founderBio, credentials[], phone, whatsapp, email, hours, address, membershipNo, firmRegNo, hero{badge,headline,highlight,sub,cta1,cta2,tags[],image}, stats[{v,l}], highlights[{t,d}], process[{t,d}], testimonials[{q,n,r,s}], services[{name,desc}], footerBlurb, copyright, social{linkedin,facebook,instagram,youtube}, logo, founderPhoto, primaryColor, accentColor, subdomain`.

The remaining designs are **inconsistent** and need the same binding retrofitted:

- **Heritage** reads `localStorage.getItem('kdk_heritage_v2_config')` and applies a `CONFIG`/`cfg` object.
- **Zenith** reads `localStorage.getItem('kdk_zenith_config')`.
- **Apex** and **Nova** have **no config binding at all** yet.
- **None** of the four use `postMessage`.

**Implication:** before the live preview can reflect edits, all four designs need a **single, standard data-binding contract**. Recommended approach to decide with the owner:
- Adopt one shared config schema (one JSON shape covering all fields in §3), and
- Feed it into the preview iframe via **`postMessage`** (cleaner than localStorage for a cross-frame live preview), with the server-rendered published site reading the same schema from the DB.

This choice affects the backend (see §6 discrepancies) and should be settled before building.

---

## 6. Discrepancies vs Existing Docs (must reconcile)

The prototype and new designs have moved ahead of `CLAUDE.md`, `backend/spec/api-spec.md`, and `backend/spec/database-schema.sql`:

| Area | Docs say | Reality in designs / prototype |
|---|---|---|
| Wizard steps | 6 (Profession is its own Step 1) | 5 (Profession folded into Business Details) |
| Templates | 3: Prestige, Clarity, Heritage | 4: Apex, Heritage, Nova, Zenith |
| DB `template` enum | `prestige','clarity','heritage'` | needs `apex','heritage','nova','zenith'` |
| Founder fields | absent from `wb_business_info` | present (name, role, bio, credentials, photo) |
| Image uploads | not modelled | logo, founder photo, hero images (Nova) |
| Stats / testimonials / process steps | not modelled | present in every design, all editable |
| Preview views | desktop/mobile implied | tablet + desktop + mobile required |

The DB schema and API spec will need new tables/fields for founder details, images, stats, testimonials, and process steps once the data schema (§5) is agreed.

---

## 7. Open Decisions Before Building

1. **Build target:** productionise as React + Vite wired to the Golang API (per tech stack), or keep iterating the single-file HTML prototype first?
2. **Source of truth:** confirm the 5-step / 4-template model is authoritative (then update CLAUDE.md, schema, and API spec to match).
3. **Data-binding contract:** confirm the single shared config schema + `postMessage` preview approach in §5, and retrofit Apex/Nova to it.
4. **Profession → design mapping:** is design free-choice, or suggested per profession (Apex=CA, Heritage=Advocate, Nova=Tax/GST, Zenith=CS/Corporate)?
5. **Colour theme depth:** fixed palette presets (as prototype), or primary+accent colour pickers mapped per design?

---

## 8. Requirements Captured From Owner (verbatim intent)

- Choose a website design; user can open the sample design.
- Enter all details; the user's website updates on that basis.
- Some designs need hero images the user uploads.
- User can edit footer content.
- User can add services and their descriptions.
- Everything must be customisable.
- User can change the colour theme.
- Do **not** show the preview in a right-side pane; it cannot show the website properly at that size.
- Provide a **Preview button**; clicking it opens the preview **on the same page** (full-page overlay), with tablet, desktop, and mobile views.
- The admin panel must be beautiful and excellent-looking, light theme and colours.
