# DEV-LOG — Personalised Website Builder
> Day-by-day record of what was built, what was decided, what's blocked, and what's next.
> Most recent entries at the top.

---

## 2026-07-25 — Session 14b (frontend/ + backend/ split)

### Session Summary
Second pass on the reorg, at the user's request: an explicit `frontend/` + `backend/` + `docs/` split. In Session 14a I had said a literal `frontend/` folder was not possible because GitHub Pages only serves the repo root or `/docs` from a branch. The user asked for it anyway, and there **is** a clean way: Pages' GitHub Actions source can publish any directory. Done that way. No product behaviour changed.

### What Was Done
- **`frontend/`** now holds everything the browser downloads: `index.html` (the builder), `app-config.js`, `local-ai-config.js`, `assets/`, `templates/`, `design-samples/`.
- **`backend/`** now holds all server-side code: `supabase/` (migrations + `ai-generate`), `netlify/edge-functions/render.ts`, and `spec/` (the never-built Golang + MySQL design, moved back out of `docs/`).
- **`.github/workflows/pages.yml`** (new) uploads `frontend/` as the Pages artifact via `actions/upload-pages-artifact@v3`, making it the **site root**.
- **`netlify.toml`**: `publish = "frontend"`, `edge_functions = "backend/netlify/edge-functions"`. Stays at the repo root; Netlify reads it from nowhere else.
- **Root `index.html`** is now a small fallback redirect to `frontend/`, not the builder.
- **New `frontend/README.md`** and **`backend/README.md`** documenting each area (see below).

### Why zero code paths needed rewriting
The whole browser-facing tree moved **as a unit**, and `frontend/` is served as the site root on both hosts. So every relative path inside it still resolves untouched:
- `index.html` favicon `assets/ca-india-logo.png` — unchanged
- `<script src="app-config.js">` — unchanged
- `DESIGNS` array `templates/<k>/index.html` + `design-samples/<k>/index.html` — unchanged
- each template's `../../assets/ca-india-logo.png` — unchanged
- `render.ts` fetching `${url.origin}/templates/<k>/index.html` — unchanged, because Netlify's publish root is now `frontend/`

Only two config files changed. **Keep paths inside `frontend/` relative** — a leading `/` would break local `python3 -m http.server` previews served from the repo root.

### Answering "what does design-samples do?"
Investigated properly and documented in `frontend/README.md`. Short version: **it is loaded by nothing.**
- Each `DESIGNS` entry has `path:` (design-samples) and `live:` (templates). Both consumers resolve `d.live || d.path` — the Step 2 preview iframe (`index.html:1141`) and `openPreview()` (`index.html:1694`). All four designs have a `live:`, so `path:` never wins.
- Even the magnifier button, which calls `openPreview(key, true)` ("sample mode"), loads the **live** template. Sample mode only relabels the URL bar to "(sample design)" and skips applying the user's edits (`if(pvSample) return;`).
- What it *is*: the pristine original of each design. `templates/<k>` = that same file **plus a binding script** defining `window.__applyConfig(config)` (~360 added lines for Apex).
- **It has drifted.** For Apex, ~75 lines differ *beyond* the binding script, so the "pristine original" no longer matches what ships. Still unresolved: re-sync from `templates/` (stripping the binding) or retire the folder and delete the dead `path:` field.

### Verification
- Grepped all HTML/JS/TS/TOML/YML for `New Design`, `New%20Design`, `CA%20India`, `Live/` → zero hits.
- **Prod layout:** served `frontend/` as root → `/`, `/assets/ca-india-logo.png`, `/app-config.js`, all four `/templates/<k>/index.html`, `/design-samples/apex/index.html` → all **200**. Those `/templates/` 200s are exactly what `render.ts` fetches.
- **Fallback layout:** served the repo root → `/` returns the redirect page (target `url=frontend/`), and `/frontend/`, `/frontend/assets/...`, `/frontend/templates/apex/index.html` → all **200**. So the live URL survives even with Pages left on branch mode.
- Parsed `netlify.toml` and confirmed `publish` dir exists, `edge_functions` dir contains `render.ts`, and the `/s/*` route maps to `render`.
- Structurally checked `pages.yml`: permissions, `path: frontend`, and `environment.url` correctly referencing step id `deployment`.
- Confirmed the Supabase CLI exposes `--workdir`, so `backend/supabase/` is workable.

### Blockers / Next Steps (IMPORTANT)
1. **GitHub Pages source must be switched by hand:** repo Settings -> Pages -> Build and deployment -> Source -> **GitHub Actions**. Until then Pages serves the branch root and visitors get one redirect hop to `/frontend/`. Delete the root `index.html` once switched. Note this branch is not merged to `main`, so the live site is unaffected for now.
2. **Netlify:** still needs connecting (repo access + `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_ANON_KEY`). It will pick up `publish = "frontend"` automatically.
3. **Supabase CLI invocation changed:** `cd backend && supabase …` or `supabase --workdir backend …`. Bare `supabase db push` from the repo root no longer finds the project.
4. Still open: the drifted `design-samples/` (see above).

---

## 2026-07-25 — Session 14a (Repo reorganisation: folder cleanup + renames)

### Session Summary
Housekeeping only, no product behaviour changed. Deleted a stale duplicate folder, renamed the two confusingly-named template folders, grouped loose assets, and folded paper-only specs into `docs/`. All moves used `git mv` so file history follows. Branch `feature/ai-website-writer`.

### What Was Done
- **Deleted `New Design copy/`** — verified byte-identical to `New Design/` (only `.DS_Store` differed), untracked and already gitignored. It was the leftover Finder duplicate flagged as an open question back in Session 3.
- **`Live/` → `templates/`** — these are the four published renderers. Updated the three places that reference them: the `live:` fields in the `DESIGNS` array (`index.html`), the server fetch in `netlify/edge-functions/render.ts`, and the `netlify.toml` comment.
- **`New Design/` → `design-samples/`** — matches the "pristine sample" language already used in the docs and template comments. `zenith V2/` → `zenith-v2/`. Updated the `path:` fields in `DESIGNS`.
- **Killed the `%20` escaping** — folder and asset names no longer contain spaces. `CA India Logo.png` → `assets/ca-india-logo.png`, `KDK Sites.png` → `assets/kdk-sites-logo.png`. Updated the favicon link in `index.html` and in all four templates (`../../assets/ca-india-logo.png`).
- **`Admin Panel/`** held one notes file → moved to `docs/ADMIN-PANEL-UNDERSTANDING.md`, empty folder removed. Its internal path references were updated too.
- **`backend/` → `docs/backend-spec/`** — see the decision note below.
- **`.gitignore`**: replaced the now-dead `New Design copy/` line with the general patterns `* copy/` and `* copy */` so future Finder duplicates are ignored automatically.
- Removed all `.DS_Store` files from the working tree.

### Decisions
- **`backend/` was renamed to `docs/backend-spec/` rather than kept at the root.** It contained only never-built paper: a Golang REST spec and an unapplied **MySQL** schema. Meanwhile the schema that actually runs is `supabase/migrations/` (**Postgres**). Having an unbuilt MySQL schema sitting at the top level next to the live Postgres migrations was the single most misleading thing in the tree. Now `docs/` = paper, `supabase/` + `netlify/` = running backend code.
- **A literal `frontend/` folder is not possible here.** GitHub Pages only serves the repo root or `/docs`, so `index.html` must stay at the root, and `app-config.js` / `local-ai-config.js` must stay beside it because it loads them with root-relative `<script src>`. `netlify.toml` is root-only by Netlify's design, and the Supabase CLI resolves its project from a root-level `supabase/config.toml`. These four are now marked `[PINNED]` in the CLAUDE.md structure diagram so nobody tries to move them later.

### Verification
- Grepped all `.html`/`.js`/`.ts`/`.toml` for `New Design`, `New%20Design`, `CA%20India`, `KDK Sites.png`, `Live/` → zero hits remaining.
- Served the repo on `python3 -m http.server 8791` and curled every path: `/`, `/assets/ca-india-logo.png`, `/app-config.js`, all four `/templates/<key>/index.html`, and `/design-samples/...` → all **200**. Old paths `/Live/apex/index.html` and `/CA%20India%20Logo.png` → **404** as expected.
- Confirmed each template's `../../assets/ca-india-logo.png` resolves from its own directory.

### Notes / Next Steps
- **Historical entries below were deliberately left unedited** — they describe the tree as it was on the day, so `Live/` and `New Design/` still appear in them. Only living documents (`CLAUDE.md`, `README.md`, `docs/ADMIN-PANEL-UNDERSTANDING.md`) were rewritten to the new paths.
- Netlify still needs connecting by the user (repo access + `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_ANON_KEY` env vars). **When it is connected, re-check `/s/<subdomain>`** — `render.ts` now fetches `/templates/<key>/index.html`, so a deploy serving the old `Live/` layout would 502 with "Template missing". Deploy the renamed tree and the function together.
- Still open from earlier sessions: `design-samples/` copies have drifted from `templates/` (the four renderers carry fixes the samples do not). Decide whether to re-sync them or retire the folder.

---

## 2026-07-13 — Session 13 (Enquiries table: Jira-style grid, filters, pagination, Excel)

### Session Summary
Iterated the Enquiries page into a polished Jira "List"-style table based on live feedback. All in `index.html` (the auth IIFE's enquiries module + its injected CSS). No backend change. Branch `feature/ai-website-writer`.

### What Was Done
- **Jira-style grid** in a rounded card: column-header icons, vertical + horizontal gridlines, zebra-free clean rows, checkbox column with select-all (+ indeterminate).
- **Light header** (was dark, clashed) merged into a single bar: Back button (replaces ✕), title, search, Export. Removed the top count, the "Show" status dropdown, and the Refresh button.
- **Columns:** Lead (name + phone + email), **Enquiry** (bold service + message, 2-line clamp, click to expand), **Status** (uppercase colour lozenge `<select>`), **Received** (single date chip), **Notes** (text with pencil; click to edit inline, saves on blur), **Actions** (brand-coloured call/WhatsApp/email icons).
- **Column filter:** funnel on the Status header opens a menu to filter by status (highlights when active).
- **Sorting:** click the Received header to toggle newest↔oldest (arrow indicator).
- **Pagination + count in the footer:** "Showing X to Y of Z", Prev / Page n of m / Next (10/page).
- **Bulk actions:** selecting rows shows a contextual blue bulk bar (Mark as / Export selected / Clear); also, changing any one selected row's status applies to all selected.
- **Excel export:** replaced CSV with a styled HTML `.xls` — navy header, borders, zebra rows, colour-coded status cells, and a **frozen header row**.
- **Reload persistence:** the page persists across refresh via `#enquiries` in the URL; a pre-paint cover (`html.enq-boot::before`) prevents the builder from flashing before the overlay reopens.

### Verified
- Headless Chrome throughout (seeded session + stubbed Supabase): status/notes PATCH, column filter, date sort (desc→asc), pagination (page 2 of 14), bulk status on selected rows, and reload-with-hash reopening the page. Screenshots confirmed the layout.

### Blockers / Next Steps (user)
- Unchanged: `supabase db push` (status/notes columns + update policy) and set `SUPABASE_ANON_KEY` in Netlify for live data.
- **Going live:** this is on `feature/ai-website-writer`; merge to `main` (GitHub Pages) or point the host at the branch.

---

## 2026-07-13 — Session 12 (Enquiries UI: table view + status dropdown)

### Session Summary
Per feedback that the master/detail layout still didn't look good, switched the Enquiries page to a **tabular view** and replaced the status pill/segmented buttons with a **dropdown `<select>`** per row. Kept the full-page shell, top bar, filter chips, search, export. Same data/RLS/PATCH. Branch `feature/ai-website-writer`.

### What Was Done
- **Table layout:** columns Lead (name + "via subdomain"), Contact (click-to-call / mailto links), Service (chip), **Status (colour-coded dropdown select)**, Received (full date+time, relative, and "updated" line), and an expand chevron. Sticky header, horizontal scroll on narrow screens, a "N leads" count strip.
- **Status dropdown:** native `<select>` styled per status (blue/amber/purple/green/grey); `change` → optimistic recolour + PATCH; if the current filter no longer matches, the row animates out.
- **Expandable detail row:** clicking a row (or the chevron) reveals a full-width panel with the full message + Call/WhatsApp/Email actions and the private-notes editor (Save → PATCH). Editing a note no longer collapses on status change because status updates the select in place.
- Removed the master/detail markup, CSS, and helpers (side list, detail pane, segmented status buttons, avatars). Export CSV unchanged.

### Verified
- Headless Chrome (http, seeded session + stub): table renders 4 rows with 4 status selects; changing a row's status → `PATCH {"status":"converted"}`; expanding a row shows message + notes; saving a note → `PATCH {"notes":"…"}`; the Converted filter narrows to the converted rows. Screenshots (collapsed + expanded) confirm a clean tabular layout.

### Blockers / Next Steps (user)
- Unchanged: `supabase db push` (status/notes columns + update policy) and set `SUPABASE_ANON_KEY` in Netlify.

---

## 2026-07-13 — Session 11 (Enquiries UI redesign: full-page master/detail)

### Session Summary
Reworked the Enquiries UI from a centered modal with stacked cards into a proper **full-page master/detail app screen**, per feedback that the dialog/cards/filters looked unorganised. No new backend — same data, RLS, and edit flow as Session 10. Branch `feature/ai-website-writer`.

### What Was Done
- **Full-page layout:** dark top bar (title + search + Export + Refresh + close), a full-width **filter bar** (All + per-status chips, each with a colour dot and live count), and a **master/detail split** below.
- **Left list:** compact lead rows — avatar initials, name, service/message snippet, relative time, and a colour-coded status badge; selected row highlighted with a blue rail.
- **Right detail pane:** big name + avatar, full date/time (+ "updated" note), source site, a **status segmented control** (click to change), prominent **Contact actions** (Call / WhatsApp / Email), the service chip, the full message in a card, and a large **private-notes** editor with Save.
- **Interactions:** status changes update in place (buttons + list badge + filter counts) without wiping an unsaved note; note save and status change both PATCH to Supabase; search + filter combine and auto-adjust the selection. Responsive: on narrow screens the list is full-width and the detail slides over with a "Back to list" control.
- Hides the AI-writer floating button while the Enquiries page is open (`body.enq-open`).
- Rewrote the render module (buildEnqOverlay/renderEnquiries/renderFilters/renderList/rowHtml/renderDetail/onStatusChange/onNoteSave); dropped the old card/select markup. Export CSV unchanged.

### Verified
- Headless Chrome (http, seeded session + stub): top bar + 6 filter tabs + 4 rows render; first lead auto-selects; clicking a row swaps the detail; the 5 status buttons show; changing status → `PATCH {"status":"converted"}`, saving a note → `PATCH {"notes":"…"}`; filtering to "New" narrows the list to the one matching lead. Screenshot confirmed the layout reads cleanly in both list and detail.

### Blockers / Next Steps (user)
- Unchanged from Sessions 8/10: run `supabase db push` (status/notes columns + update policy) and set `SUPABASE_ANON_KEY` in Netlify.

---

## 2026-07-13 — Session 10 (Enquiries: status, notes, date/time)

### Session Summary
Made the Enquiries inbox a real lead-management view. Each lead now has a **status** the owner can change (New / Contacted / In Progress / Converted / Closed), a **private note** field, and a clear **date + time**. Added status **filter tabs** with counts. Requires a small DB migration. Branch `feature/ai-website-writer`.

### What Was Done
- **Migration `20260713090000_lead_status_notes.sql`:** adds `status` (default `new`, checked enum), `notes`, and `updated_at` to `wb_leads`; adds the `trg_wb_leads_touch` trigger (reusing `wb_touch_updated_at`); adds RLS policy **`wb_leads_update_owner`** so an owner can UPDATE their own leads (insert stays public, select stays owner-only). **Must be applied: `supabase db push`.**
- **Status:** each card has a colour-coded `<select>` pill (blue/amber/purple/green/grey). Changing it optimistically updates the pill + counts and `PATCH`es `{status}` to Supabase; on failure it reverts. If a filter is active and the lead no longer matches, the card animates out.
- **Notes:** an inline note box per card with a Save button (`PATCH {notes}`), shows "Saved"; note text is searchable and included in CSV.
- **Date/time:** full localized date + time plus relative "x ago"; an "Updated x ago" chip appears when the lead was edited after creation.
- **Filter tabs:** All + one per status, each with a live count; combine with search. Empty/error/no-match states retained.
- **CSV export** now includes Status, Notes, and Last-updated columns.
- Fetch now selects `status,notes,updated_at`; leads with no status fall back to `new` in the UI.

### Verified
- Headless Chrome over `http://` with seeded session + stubbed Supabase: 6 tabs with correct counts (All 2 / New 1 / Contacted 1 / …), status select reflects value, full date/time renders. Changing a status sends `PATCH {"status":"converted"}`; saving a note sends `PATCH {"notes":"…"}`; filtering by Contacted after re-statusing correctly narrows the list to the matching lead.

### Blockers / Next Steps (user)
- **Apply the migration:** `supabase db push` (project `hlhtopqbzfzlxxmolkok`). Status/notes editing will error until the columns + update policy exist.
- Still pending from Session 8: set `SUPABASE_ANON_KEY` in Netlify so the public form actually writes leads.

---

## 2026-07-13 — Session 9 (Enquiries inbox in the builder)

### Session Summary
Added an **Enquiries** page to the builder so a signed-in professional can see every lead their published site received. New "Enquiries" item in the account menu (alongside Profile / Settings / Subscription) opens a full overlay that reads `wb_leads` from Supabase, scoped to the owner by the existing `wb_leads_select_owner` RLS policy. Branch `feature/ai-website-writer`.

### What Was Done
- **Account menu:** added an **Enquiries** item (inbox icon) in `buildPop()`; it closes the popover and calls `openEnquiries()`. Profile / Settings / Subscription remain placeholders.
- **Enquiries overlay** (all self-contained in the auth IIFE in `index.html`, reusing its `authFetch` / `getSession` / `esc`):
  - Fetches `GET /rest/v1/wb_leads?select=id,name,email,phone,message,created_at,wb_websites(subdomain)&order=created_at.desc&limit=500` with the user's access token. RLS returns only the owner's leads; the embedded `wb_websites(subdomain)` shows which site each lead came from.
  - **Lead cards:** name + relative time (with exact timestamp on hover), a service/matter chip parsed from the message's `Service:`/`Matter:` prefix, the message body, and one-tap contact chips — **Call** (`tel:`), **WhatsApp** (`wa.me`), **Email** (`mailto:`) — plus the source site.
  - **Search** (name / phone / email / message), a live **count**, **Refresh**, and **Export CSV** (BOM + CRLF, service split into its own column).
  - **States:** loading spinner, empty ("No enquiries yet"), no-search-match, and error with a Try-again button; expired session prompts re-login.
  - Navy-gradient header matching the design tokens; responsive (full-screen on mobile, labels collapse). Closes on overlay-click, ✕, or Esc.
- No schema/policy changes needed — the table and owner-read policy already existed from Session 6.

### Verified
- Headless Chrome over `http://` (localStorage needs a real origin): seeded session + stubbed Supabase. Opening via the account-menu item renders 2 sample leads (service chip parsed, 2 WhatsApp chips, correct embedded query), search "priya" filters to 1, and the empty-leads case shows "No enquiries yet". Menu item present and wired.

### Blockers / Next Steps (user)
- Same as Session 8: set `SUPABASE_ANON_KEY` in Netlify so published forms actually write leads; then leads will appear in this inbox.
- Profile / Settings / Subscription are still placeholders (unchanged).

---

## 2026-07-13 — Session 8 (enquiry form actually captures leads)

### Session Summary
Fixed the **"Send Enquiry" / contact form on published sites** — it did nothing usable before (apex/nova had no click handler at all, heritage only faked a success, zenith just swapped in a success panel without submitting). None of the four templates ever wrote to the `wb_leads` table that already existed. Now every template's contact form submits a real lead to Supabase when the page has credentials, with a graceful visible-confirmation fallback for static/preview contexts. Branch `feature/ai-website-writer`.

### What Was Done
- **`netlify/edge-functions/render.ts`** now injects `window.__KDK = { supabaseUrl, supabaseAnonKey, websiteId, subdomain }` into every published page (added `id` to the site lookup `select`, reads a new **`SUPABASE_ANON_KEY`** env var). The anon key is a public key and RLS (`wb_leads_insert_any`) restricts anon to inserting leads only.
- **All four `Live/` templates** wired the contact form to `POST` to `…/rest/v1/wb_leads` (`{ website_id, name, phone, email, message }`, service/matter folded into `message`) when `window.__KDK` is present; otherwise they resolve to a visible "Enquiry Sent!" / success-panel confirmation so the form always responds. Name + mobile are validated before sending.
  - apex/nova: added a self-contained enquiry IIFE (they had no handler).
  - heritage: replaced the simulated `setTimeout` with the real submit (kept its animated button feedback).
  - zenith: rewrote `handleSubmit()` to validate + submit, and only reveal `#formOk` on success.
- **Enquiry dropdown now follows the professional's ROLE, not the visual template.** Before, the "Service Required / Area of Law" `<select>` showed each template's hardcoded demo options — so a CA who chose the heritage (advocate) design still saw legal-matter options. Only apex repopulated it (from the chosen-services subset); nova/heritage/zenith never touched it. Added a `ROLE_SERVICES` catalog + `populateEnquiryOptions()` helper to all four templates; `applyConfig()` now rebuilds the dropdown from `cfg.profession`'s full service catalog (falls back to `cfg.services`, then to the template default if profession is unknown). Also **expanded the option lists** (full role catalog + a few extra role-relevant services) and appended universal "General Consultation" + "Other" choices. Verified headless: apex→advocate, nova→CS, heritage→CA, zenith→GST all render the correct role's options regardless of template.

### Verified
- Headless Chrome drove the fallback path on all four templates: valid submit → apex/nova/heritage show "Enquiry Sent!" and clear the fields; zenith reveals its success panel. Empty submit on apex → `alert()` fires and the button stays "Send Enquiry" (no send). All inline scripts parse clean.
- **Not** exercised locally: the live Supabase insert path (needs a published `/s/<sub>` page with the env var set).

### Blockers / Next Steps (user)
- **Set `SUPABASE_ANON_KEY`** in Netlify env vars (Site settings → Environment variables) — same anon key that's in `app-config.js`. Without it, published forms still confirm to the visitor but do not save the lead.
- After setting it, submit a test enquiry on a live `/s/<subdomain>` and confirm the row lands in `wb_leads` (owner can read it via RLS).
- (Pre-existing) the in-form "Chat on WhatsApp" button on apex/nova has no `onclick` — only the floating WA button is wired. Out of scope here; note for later.

---

## 2026-07-11 — Session 7 (Netlify live, real share URLs, draft persistence)

### Session Summary
Netlify is **deployed and verified end-to-end** — the builder is live at `https://kdksites.netlify.app/` and the render Edge Function serves published sites at `/s/<subdomain>` (env vars confirmed set: hitting a missing site returns "Site not found", not "Not configured"). Wired the builder to show the **real, working share URL** instead of the not-yet-real `.kdksites.in`, and fixed draft persistence + the last demo-data leftover. Branch `feature/ai-website-writer`.

### What Was Done
- **Real share URLs in the builder.** Added `publicBase` (`https://kdksites.netlify.app/s/`) + `prettyDomain` (`kdksites.in`) to `app-config.js`, and `siteSlug()` / `siteUrl()` / `prettyUrl()` helpers in `index.html`. The subdomain step, publish animation, "Visit" button (now opens the real URL in a new tab), and preview URL all use the working `netlify.app/s/<sub>` link, while still showing the future `<sub>.kdksites.in` as the "permanent address once the domain is live".
- **Publish auto-derives a subdomain** from the firm name if none is chosen (e.g. "Mehta & Co" → `mehta-co`).
- **Demo data fully cleared:** removed the last `sharma-associates` defaults (subIn value, urlLive, pvUrl) — 0 matches remain in `index.html`. Also **deleted the leftover published `sharma-associates` row** (an "Iyer & Iyer" test site) from Supabase `wb_websites` (via service_role; table now empty), and `applyConfigToBuilder()` now **scrubs known demo subdomains** (`sharma-associates`, `iyer-iyer`, `your-site`) when restoring an old draft so they never reappear in the field.
- **Draft persistence fixed** (from Session 6 handoff): `saveDraft()` writes localStorage + a Supabase draft row; `applyConfigToBuilder()` + init-restore read it back so a saved draft actually reloads.

- **Web address mirrors the firm name** with a clean slug: the Publish subdomain auto-tracks `fFirmName` (via `subManual()`/`window._subEdited` — stops when the user types their own, resumes if they clear it), and `siteSlug()` collapses any run of non-alphanumerics into a single hyphen ("Kartik & Associates" → `kartik-associates`, not `kartik---associates`).
- **Splash flash on refresh removed:** a `<head>` script marks `<html class="has-session">` from `localStorage` *before* the splash paints, and CSS hides `.splash` from the first frame (plus `runSplash()` bails when a session exists). Logged-out users still see it.
- **Share-preview shows the real firm (all templates):** the render Edge Function now rewrites `<title>` and injects Open Graph + Twitter meta (`og:title`/`og:description`/`og:url`) from the site's config, so a shared `/s/<sub>` link previews the real firm name. The four `Live/` templates' hardcoded demo `<title>` values were also neutralized to "Professional Website | KDK Sites".

### Verified
- `kdksites.netlify.app/` → 200; `/s/test-123` → "Site not found / No site at" (Supabase reached, RLS + env OK); `app-config.js` + `Live/apex` reachable on the deploy.

### Blockers / Next Steps (user)
- Publish a real site while **logged in** (auth is required for the row to save under `user_id`), then open `kdksites.netlify.app/s/<subdomain>` to confirm the live render.
- Still pending: **rotate the OpenAI key** pasted during setup.
- When `kdksites.in` is owned: point wildcard DNS at Netlify and flip `publicBase` to the subdomain form.

---

## 2026-07-11 — Session 6 (Auth + Supabase backend + Netlify publishing)

### Session Summary
Added user **login/auth**, wired up a **Supabase backend**, and set up **Netlify** so published sites can actually go live (no domain needed). The AI key is now server-side. Continues on branch `feature/ai-website-writer`. Targeted release [0.9.0].

### What Was Done
- **Auth (Supabase Auth via REST, no CDN library):** a dark, animated split-screen login/signup gates the builder; sign-up captures name+email; session persists with token refresh; the splash is **skipped for returning users** on refresh. Signed-in state shows the real user in the sidebar; clicking the profile opens an **in-place account menu** (Profile / Settings / Subscription placeholders that do not navigate, + working **Sign Out**).
- **Supabase backend (project `hlhtopqbzfzlxxmolkok`):**
  - `wb_websites` (config as JSONB) + `wb_leads` tables and **RLS policies** applied (`supabase db push`).
  - `ai-generate` **Edge Function deployed** + `OPENAI_API_KEY` secret set → the **AI key is now server-side**, never in the browser. The builder's `callLLM()` routes through it (verified working).
- **Publishing / hosting (Netlify):** `netlify.toml` + `netlify/edge-functions/render.ts` serve each published site at **`/s/<subdomain>`** by reading its config from Supabase and injecting it into the `Live/` template (via `window.__applyConfig`). **Save-on-Publish** writes the config to `wb_websites`. `app-config.js` holds the **public** Supabase URL + anon key so the *deployed* builder has auth/publish (gitignored `local-ai-config.js` isn't deployed).
- **Design:** the splash was re-skinned to the dark premium look to match the login; login got animated mesh gradient, drifting orbs, a "website-building" browser mockup, and a waving 👋 on "Welcome back".

### Decisions Made
- **No domain needed to go live:** sites are served at `kdksites.netlify.app/s/<subdomain>` (path-based). The day `kdksites.in` is owned, point wildcard DNS at Netlify → `sharma.kdksites.in`, no rebuild.
- Anon key + Supabase URL are **public by design** and committed in `app-config.js`; the `service_role` key lives **only in Netlify env**, the OpenAI key **only in Supabase secrets**.

### Blockers / Next Steps (user)
- **Netlify (user action):** grant the Netlify GitHub app access to `KDKSites` ("Configure the Netlify app on GitHub"), import the repo on branch `feature/ai-website-writer`, and set env vars `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (service_role). Then Publish → live at `/s/<subdomain>`.
- Rotate the OpenAI key that was pasted during setup.

---

## 2026-07-11 — Session 5 (AI Website Writer)

### Session Summary
Added an **"AI Website Writer"** to the builder: a floating button opens a short guided interview, then an LLM drafts the whole site and fills the builder fields for review. Also removed the leftover fake demo data that was polluting real sites, and fixed several bugs found along the way. Branch: `feature/ai-website-writer`. Targeted release [0.8.0].

### What Was Done
- **AI Writer feature (all in `index.html`, appended as a self-contained script + styles):**
  - Morphing sparkle FAB (bottom-right) that expands on hover; opens a modal interview.
  - Interview steps: profession, firm name, years, differentiator, typical clients, **key numbers** (→ stats), **how you work** (→ How We Work), **client reviews** (repeatable list: name/role/rough note), **location + contact** (city/phone/email/address in one group), founder, and free-text "anything else". Most steps are skippable.
  - On submit it calls the LLM and fills: tagline, hero (badge/short slogan headline with line breaks + accent highlight/sub), CTAs, audience tags, key stats, About highlights, How-We-Work steps (title + desc), testimonials, credentials, about, founder bio, footer, and every service description.
  - **Provider-agnostic**: OpenAI or Anthropic (Claude), switchable via a **gitignored `local-ai-config.js`** that holds the API key. Both browser-CORS-verified.
  - "Building your site" animated loading (shimmering site skeleton + cycling status), tinting removed per request.
- **Killed the demo-data trap (P1):** cleared all Sharma-&-Associates fake defaults (firm/contact/address/copyright/hero/about/founder copy) → empty fields with guiding placeholders; emptied fabricated stats & testimonials; empty stats/highlights/process/testimonials are filtered out at publish/preview.
- **Anti-fabrication rules in the prompt:** stats use only real numbers the user gives (else qualitative); testimonials are AI-*written* from the user's rough notes but never invented when skipped.
- **UX polish:** light placeholder colour; `smartTitle()` auto-capitalisation on typed proper-noun fields (firm/city/address/founder, acronym-aware: GST/ITR/CA…); `capFirst()` on email; symbol inserter (₹ ★ + % ✓) for stats; services sorted active-on-top; FAB hidden while preview/publish overlays are open; added `<meta charset="utf-8">` (fixed ₹/★/© mojibake).

### Bugs Fixed
- **`window.S` was undefined** — state is `const S`, which does not attach to `window`, so every AI array section (stats/highlights/process/testimonials/tags/service-descriptions) was silently skipped. Fixed with `window.S = S;`. This was masked until the demo defaults were cleared.
- **Heritage template watermark** leaked the literal "HERITAGE" behind testimonials → now bound to the firm name (default "TESTIMONIALS"). (`Live/heritage/index.html`)
- **Publish step (Step 6)** 2nd checklist bullet showed a lone "," when firm/city were empty → now handles empties gracefully.

### Decisions Made
- **AI Writer is a Phase-2 (backend) feature.** Calling the provider directly from the browser exposes the API key, so it is **local-demo only**; production must call the LLM **server-side** (planned Golang/Supabase backend) and never ship a key to the browser.
- **No fabricated content for finance/legal sites** — testimonials and stats are only produced from user-provided input.
- Provider not finalised (OpenAI vs Claude); code supports both.

### Blockers / Security
- Local testing used a real OpenAI key placed in the gitignored `local-ai-config.js` (never committed). **That key was pasted in chat during setup and must be rotated/revoked.**
- To see generation run, a funded API key (OpenAI or Anthropic) must be in `local-ai-config.js`.

### Next Steps
- Move AI calls **server-side** for production; decide the provider.
- Optional UX follow-ups discussed but not done: P3 (relayout each step into "your details" vs "AI draft") and P4 (a per-step "needs your input" cue).
- Stop sending the unused `profession` field in the published config (templates never read it).

---

## 2026-07-03 — Session 4 (GitHub hosting + persistence setup)

### Session Summary
- Put the prototype under Git, pushed to GitHub, and made it live on GitHub Pages. Made the builder the site entry point and set up docs so work is resumable from the repo alone (survives switching Claude accounts). Released as [0.7.0].

### What Was Done
- [x] `git init`, connected remote `https://github.com/Kartikkhandelwal-PM/KDKSites`, committed and pushed to `main`.
- [x] Installed `gh` CLI (Homebrew); user authenticated via `gh auth login`; `gh auth setup-git` for HTTPS pushes.
- [x] Enabled **GitHub Pages** via API (source: `main` / root). Live at https://kartikkhandelwal-pm.github.io/KDKSites/ and verified (builder + all 4 templates + logo return 200).
- [x] Added `README.md` and `.gitignore` (excludes `.claude/`, `New Design copy/`, `.DS_Store`).
- [x] **Made the builder the root:** moved `Admin Panel/website-builder-admin-v4.html` to `index.html` at repo root and rewrote its `../` asset paths to root-relative. Removed the intermediate dashboard so the root URL opens straight on the 6-step builder. Old long `/Admin Panel/...` URL now 404s (expected).
- [x] Reconciled `CLAUDE.md` (Current State, Deployment, Session Handoff Protocol, corrected structure/tech/templates) and updated `CHANGELOG.md`.
- [x] Trialled a header logo swap (`KDK Sites.png` in place of the text logo), previewed locally on `python3 -m http.server 8765`, then **rolled it back** at user request. No header change shipped.

### Decisions Made
- **Repo is the single source of truth.** Claude per-account memory does not move between accounts/machines, so every session must update DEV-LOG + CHANGELOG + CLAUDE "Current State" and push. Documented as the Session Handoff Protocol in CLAUDE.md.
- **GitHub Pages is for the prototype only.** Its terms forbid commercial hosting; wildcard subdomains are painful. For production, favour **Supabase (Postgres) + Cloudflare Pages** (commercial-friendly, native `*.kdksites.in`), deploying from this same repo. Not committed yet.
- Root entry file must be lowercase `index.html` (Pages requirement; macOS is case-insensitive so it looks identical to the old `INDEX.html` locally).

### Blockers
- None. (For an even shorter URL: add a custom domain like `builder.kdksites.in`, which needs access to `kdksites.in` DNS.)

### Open Questions
- Do we commit to Supabase + Cloudflare Pages for production, and when?
- Custom domain for the prototype: who controls `kdksites.in` DNS?
- Still open from Session 3: hide connector arrows on wrapped process rows; retire or sync the `New Design/` folder.

### Next Session Goals
- Decide production hosting (Supabase + Cloudflare Pages vs original Golang + MySQL).
- Optionally set up a custom domain.
- Reconcile the PRD to the 4-design lineup (CLAUDE.md is done; PRD still lists the older 3 templates).

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
