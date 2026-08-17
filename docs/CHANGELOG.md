# CHANGELOG — Personalised Website Builder
> All notable changes, additions, and decisions are documented here.
> Format: `[version] YYYY-MM-DD — Summary`

---

## [0.9.12] 2026-08-17: The PRD brought up to date, and requirements separated from delivery status

> Documentation only; no product code changed. Full detail in [docs/DEV-LOG.md](DEV-LOG.md) 2026-08-17 (Sessions 23 and 24).

### Changed
- **The PRD now carries requirements only, never build status.** Profile import is written into section 5.5 (it is a way into the AI Writer, not a separate feature) with its rules in 6.13; the enquiry email alert is written into 5.6 with its rules in 6.14, including the wording of the email itself. Open questions sit inline with the feature they belong to.
- **`REQUIREMENTS-PENDING.md` was rewritten as the delivery-status file**: what is live, what is built but unreleased, what is specified only, every open decision and what it blocks, and the screenshot retake list. It no longer duplicates any requirement.
- **Step 6 (Publish) rewritten**: four states, not five. "Change address" and the whole address-change sub-section are gone, along with the flow-diagram branch and the screenshot. The permanence rule is stated with its reasoning, and the new pre-launch warning is recorded.
- **User-flow diagram regenerated** from Mermaid source now kept beside the image in the PRD, adding the profile-upload branch and the enquiry-alert step, and dropping change-address.
- The AI Writer's partner field **"What do they handle?"** added to sections 5.5 and 6.10.

### Fixed (documentation that described code which does not exist)
- **There is no Delete anywhere in the product.** CLAUDE.md and the requirements note both claimed the publish step offered one, and an open question rested on it ("Delete is the bypass"). Unpublish is the only way down.
- **Profile import is not blocked on its API key.** `OPENROUTER_API_KEY` is set and `mode:"extract"` is deployed, verified by probe.

---

## [0.9.11] 2026-08-13: Profile upload — AI reads an uploaded profile and pre-fills the interview

> New requirement from management. This ships the **AI half only**; the builder UI is not wired up yet and is expected to change. Full detail and reasoning in [docs/DEV-LOG.md](DEV-LOG.md) 2026-08-13 (Session 22).

### Added
- **`mode:"extract"` on the `ai-generate` Edge Function.** Send `{mode:"extract", model, file:{name,type,data}}` and get back a schema-validated profile object. The existing text-prompt path is untouched.
- **PDF and images go straight to the model, unparsed.** Current models read both natively, so nothing is parsed in the browser — which is what makes this possible at all, since the no-CDN rule forbids pdf.js and every OCR library.
- **DOCX extraction inside the function**, in ~50 lines on Deno's built-in `DecompressionStream`, with **no third-party dependency** in a function that holds API keys. Reads the ZIP central directory rather than local headers, because Word often zeroes the local header and defers sizes to a trailing data descriptor. Verified against a real .docx.
- **OpenRouter as the provider for profile import** (`OPENROUTER_API_KEY`), so one key reaches Gemini, Claude and the rest and swapping models is a config change. `provider:"anthropic"` still works if that key is ever set.
- **`frontend/test-profile-import.html`** — standalone harness that touches nothing in the builder. Upload a file, pick a model, see every field's found/empty state, token counts, and the actual USD spent.
- **`profileImport` block in `frontend/app-config.js`** — the production model, plus the per-model cost table and how to choose between them.

### Changed
- `anthropic.model` was pinned to the superseded `claude-opus-4-8`; now `claude-opus-5`.
- `backend/README.md` documents all three function secrets and which are actually set.

### Technical notes
- **The extraction prompt's job is restraint, not coverage.** It forbids inference by name (do not turn a job title into an expertise claim, do not turn past employers into a client list, never estimate a number). Any field the document does not state comes back empty, which is what lets `screenErr()` route it into the interview as a real question. This is the 2026-07-28 "no demo data on live sites" rule applied one layer earlier: an invented "best known for" publishes a claim the user never made, and for ICAI/Bar-regulated professionals that is their liability.
- **`plugins:[{id:"file-parser",pdf:{engine:"native"}}]` is load-bearing.** Without it OpenRouter defaults to `mistral-ocr`, billing $2/1,000 pages on top of tokens and flattening the layout first.
- Default model is `google/gemini-3.5-flash-lite` (~₹0.35/profile); escalate to `anthropic/claude-haiku-4.5` (~₹0.90) if it invents content. Avoid `gemini-3-flash-preview` in production — a *preview* model can be retired without notice and would break the feature silently. Model IDs and prices were read from OpenRouter's live `/api/v1/models`, not from memory.

### Blocked
- ~~Needs `supabase secrets set OPENROUTER_API_KEY=...` and `supabase functions deploy ai-generate`.~~ **Both done. Verified live on 2026-08-17:** `mode:"extract"` is deployed and the key is set — a probe with a blank 1x1 image returns a wholly empty profile, which is the never-guess rule behaving correctly. What remains is a UI that is functional rather than final, and the untested published-site-plus-upload path.

---

## [0.9.10] 2026-07-29: A second host on its own branch — Cloudflare Workers alongside Netlify

> On a new `cloudflare` branch (forked from `feature/ai-website-writer`, which keeps deploying to Netlify unchanged). Full detail in [docs/CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md).

### Added
- **The app now also runs on Cloudflare Workers**, deployed via the `wrangler` CLI to `kdksites.kartik-khandelwal.workers.dev`, so daily iteration doesn't spend Netlify's usage limits. Netlify remains the primary deploy.
- **`src/index.ts`** — the published-site renderer (`/s/<subdomain>`), ported from `backend/netlify/edge-functions/render.ts` to Cloudflare's Worker API. Both hosts render identically, since they share one Supabase backend.
- **`frontend/.assetsignore`** — excludes local-only gitignored files from the Workers static-asset upload (Cloudflare's deploy reads straight from disk, unlike Netlify's git-based build).

### Fixed
- **The "changes are live" share link always read `kdksites.netlify.app`, even when the builder was served from Cloudflare.** `publicBase` is now computed from `location.origin` instead of hardcoded, so the link matches whichever host actually served the builder.
- **A live OpenAI key was briefly served publicly.** The first Cloudflare deploy uploaded the gitignored `frontend/local-ai-config.js` as a public static file, because Cloudflare's deploy reads local disk rather than a git clone. Fixed within the same session via `.assetsignore`; confirmed the key was never committed to git history and no other copy exists in the repo.

### Technical notes
- Cloudflare's dashboard "Create a Worker" Git-integration flow has no branch picker in its setup wizard, so it would have deployed from `main` (which has none of this). Deploys are done via local `wrangler deploy` instead.
- `SUPABASE_SERVICE_KEY` is set as a Cloudflare Worker secret (`wrangler secret put`), not committed anywhere; `SUPABASE_URL`/`SUPABASE_ANON_KEY` are committed as plain `vars` in `wrangler.jsonc`, since they're already public in `frontend/app-config.js`.
- The `cloudflare` and `feature/ai-website-writer` branches do not sync automatically — a fix on one has to be deliberately re-applied to the other.

---

## [0.9.9] 2026-07-28: Live-site polish, a confirmation before going offline, and palettes you can tell apart

> On branch `feature/ai-website-writer`. Everything here came from looking at the running builder and reporting what was wrong.

### Added
- **Unpublish now asks before taking your site down.** It is the only action in the builder a stranger can notice, and it was a single click. The dialog names the link people actually hold, says what survives (your address, content and every enquiry are all kept), and starts with the focus on **Keep it online**, so a double-click or a habitual Enter cannot take your site offline. Escape, clicking outside and Cancel all mean no.
- **The builder header now shows the KDK Sites mark and name.** It read "KDK | Software | KDK Sites", three fragments for one name, where only the greyed-out tail said what the product is. The wordmark is drawn as text in the brand's own navy and coral, sampled from the logo file, so it stays crisp at any size. The second line says "Website Builder".
- **A proper favicon.** The builder was borrowing the generic CA logo; it now uses the product mark, with a 1.7 KB tab icon and a separate Apple touch icon flattened onto white so it does not disappear on a dark iOS background.

### Fixed
- **The colour swatches under each design never changed when you picked a colour.** They were hardcoded to the design's factory palette, so choosing a theme recoloured the preview and left the three squares showing the old colours. The one thing on that screen whose job is to report the colour was the only thing that never reported it.
- **The selected-design tick sat on top of the website preview,** so on a dark hero a white tick on a blue disc had almost nothing to separate it from the page behind. Both it and the colour-theme tick now sit in the white strip below.
- **Heritage's six colour themes were nearly four.** Four of the six primaries were the same warm dark red-brown, and three of the six accents were the identical gold, so cards with different primaries still read as the same palette. Measured properly in CIELAB, the closest two were less than half the distance apart that counts as "different". Rebuilt to six distinct hue families with six distinct accents.
- **Apex, nova and zenith had the same problem** and got the same treatment. All 24 accents across the four designs are now distinct values, and no two palettes within a design look alike.
- **"Charcoal & Bronze" was not charcoal.** It was a dark brown, which is also why it collided with Walnut. It is now an actual neutral slate.
- **The first unpublish dialog named an address that does not resolve** (`sharma.kdksites.in` needs wildcard DNS that is not set up yet). It now names the working link. A dialog that warns about an address the visitor never had is worse than no dialog.
- One Escape used to both answer the unpublish question and close the publish screen behind it.

### Technical notes
- Every palette change respects a contrast floor **measured from the set it replaced**, so each is a no-regression guarantee rather than a standard invented after the fact. The floors differ per design and assuming otherwise would have shipped unreadable text: apex never uses its accent as a text colour, heritage uses it once, nova three times, and zenith **twenty-one times on a dark background**, which inverts the constraint entirely. Two candidate palettes that measured better on separation were rejected for failing their design's floor.
- Where measurement and taste disagreed, taste won: a raw search on apex hit a separation score three times higher by pairing it with pink and lime accents, which look wrong on a chartered accountant's website.
- Eight jsdom suites cover all of it, with palette separation and both contrast floors written as assertions so a future edit cannot quietly undo them.

---

## [0.9.8] 2026-07-28: The AI Writer starts from the website you already have

> On branch `feature/ai-website-writer`. Answers "does an existing user have to retype everything?" The answer was yes, and now it is no.

### Added
- **The AI Writer prefills the facts from your published site.** Firm name, city, years practising (worked out from your Founded Year), phone, email, office address, office hours, social links, and every partner's name, role and photo now arrive already filled in. Those answers are tinted and the screen says where they came from, so nothing looks invented, and you can change any of them. For a firm with a live site, three of the seven screens now pass without typing a single character.
- The tint clears as soon as you edit a prefilled answer, because at that point it is yours.

### Changed
- **What is NOT prefilled, on purpose:** what you are best known for, your typical clients, your key numbers, how you work, and your review notes. The builder only stores the polished copy the AI wrote from those answers, never the rough notes you gave it. Putting that copy back in as a brief would have the AI rewriting its own output, and the writing gets blander every time round.
- **Skipping the reviews screen now keeps the reviews already on your site,** and the screen says so. This was already true but invisible. It is also why reviews are not prefilled: the interview needs a note for each review, so prefilling names alone would have forced you to rewrite notes for reviews that are already live.
- "Clear all answers" now brings your own facts straight back from your site rather than leaving you with an empty form, and opens with 3 workflow and 3 review rows, matching a fresh interview.

### Fixed
- **Prefilling would have skipped the interview entirely.** Three separate places decided whether to jump you to the review list based on "are any answers present", and prefilled answers are present before you have typed anything. Any user with a published site would have been dropped onto a summary of questions they had never been asked. There is now one resume test, and it distinguishes answers **you** gave from facts we filled in for you.

### Technical notes
- `seedFromSite()` runs once per interview, tracked by a persisted flag, and only fills fields that are still blank, so a saved draft always wins per field and a field you deliberately cleared stays cleared.
- Verified with two new jsdom suites plus the five from 0.9.7, all green: a returning user with a full published config (everything prefilled and tinted, three screens passing with no input, judgement fields confirmed empty), and two regression halves covering a brand new user seeing an untouched interview, and an existing user's two live testimonials surviving a full writer run with their names, ratings, partner name and office hours intact.

---

## [0.9.7] 2026-07-28: Mandatory answers in the AI Writer, and no more demo data on live sites

> On branch `feature/ai-website-writer`. Found while checking whether the AI Writer collects everything a good site needs: it did not, and what was missing was being filled in by the template's own sample content.

### Fixed
- **A skipped field left the design's demo text live on a real website.** All four templates bound their content as "replace only if a value was given", with no else branch, so a firm that skipped the office address published a contact card reading "302, Barakhamba House, Connaught Place / New Delhi, 110001". Missing contact rows now remove themselves.
- **Office hours were never asked anywhere in the AI Writer,** yet every template renders them in the contact card and the footer. Every AI-written site therefore showed the design's placeholder hours. There is now a required, prefilled Office Hours field.
- **Skipping client reviews served the design's sample quotes,** attributed to people who were never that firm's clients. The testimonials section now hides entirely when there are no reviews, and Zenith hides its nav and footer links into that section with it.
- **Zenith opened on a hardcoded demo quote for 180ms** even with a correct config, because the first testimonial was painted inside the cross-fade timer. The first paint is now synchronous.
- **The interview allowed phone and email to be skipped while Step 2 required both,** so "Write my website" succeeded and then dropped the user onto two red validation errors on questions they had just been allowed to skip.
- **"Required" was advisory.** The per-screen checks lived only in the Continue handler, and the step rail can jump straight to the summary, where the generate action verified only the firm name and city. Every screen is now re-checked when you press Write, and it lands on the first incomplete one.
- **The footer copyright used the raw answer while the firm name was title-cased,** so typing "sharma & associates" on a phone gave "Sharma & Associates" in the header and "(c) 2026 sharma & associates" in the footer of the same page.
- **The stats cap silently discarded the 5th and 6th figure** a user had typed. It now carries all 6.
- Clicking a required pill field's label did nothing: it pointed at an element id that does not exist for pill fields.

### Changed
- **The AI Writer now has mandatory answers**, chosen so the model gets a brief it can write from rather than guess around:
  - Years practising is required: it sets the Founded Year and is the only real figure the stats fallback has.
  - "What you are best known for" and "Your typical clients" need at least 2 entries each. These drive the highlights and the audience tags, and are what stop the copy reading like every other firm.
  - "How you work" needs at least 3 steps. The strip is numbered cards with connector arrows drawn between them, so two read as unfinished.
  - At least one founder or partner, with both a name and a role. The role is what makes each AI-written bio differ instead of four near-identical paragraphs.
  - Phone, email (format checked), office address and office hours are required.
- **Two sections are "all or nothing at 3":** Key Numbers (3 to 6) and Client Reviews (3 to 6). Leaving either out entirely is fine; a half-filled one is not, because a stats strip holding one figure and a carousel holding one card both read as broken. Key Numbers stays optional on purpose, since forcing it invites an invented client count on a chartered accountant's own website.
- The "How you work" and "Client reviews" screens open on 3 blank rows rather than 1, so the screen does not quietly suggest that one will do and then reject it. Blank rows never count, so reviews stay skippable.
- The review screen now distinguishes **incomplete** (red, with the reason and a Fix action) from **skipped** (fine). Previously the two looked identical, so the Write button appeared to fail for no reason.

### Technical notes
- Completeness is one function, `screenErr(q)`, run by both the Continue handler and the generate action. Floors come in two kinds: hard (`req` + `min`) and conditional (`min` alone, where zero is allowed but one is not). The rejection message only offers "or none at all" on a conditional floor.
- Verified with five jsdom suites against the real code: 33 validator cases, the interview driven through the DOM (including that Write from the summary refuses **without calling the API**), the full happy path, an end-to-end run with a stubbed Edge Function response, and both template cases (no demo string survives when data is absent; every contact row still renders when present).

---

## [0.9.6] 2026-07-27 — Crop & adjust for portraits, and photo controls that clear the frame edge

> On branch `feature/ai-website-writer`. Fixes the reported remove button on the founder/partner portrait and adds the crop step the published card always needed.

### Added
- **Crop & adjust for every portrait.** Picking a photo now opens a framing dialog straight away, before anything is stored: drag to pan, slider or scroll to zoom 1x to 4x, Rotate for a photo held sideways by a phone, Reset, Cancel, Use photo. The outline drawn is the shape the chosen design actually clips to, a circle for Heritage and Zenith and a rounded square for Apex and Nova, with the discarded area dimmed. There is **no separate crop button** on a photo already in place: framing belongs to the upload, and clicking the frame re-picks the photo, which opens the dialog again.
- **The crop is why this mattered.** All four templates render the portrait as a **square** with `object-fit:cover`, but uploads were bounded to 600x800. The browser was therefore throwing away the sides of every portrait with no way to choose which part survived, which is how a head standing off-centre came out clipped. The stored photo is now the exact 640px square the user framed.

### Fixed
- **The remove button on the founder/partner portrait was partly cut off and hard to see.** The frame is a circle for Heritage and Zenith, and the cross was pinned to a corner inside a clipping frame: on a 92px circle a 26px badge at a 6px inset reaches about 40px from the centre against a 32px radius, so roughly a third of it was cut away by the round edge, and the remainder sat on a bright rim of the photo under a top-only gradient that gave a white glyph almost no contrast. Remove is now a **centred** button over an even scrim, which clears the edge in every frame shape. It stays visible on touch, where there is no hover at all and the photo was otherwise stuck.
- **The same defect in the AI Writer's row portrait** (a 19px badge at a 2px inset inside a 64px circle) fixed the same way, with the same crop on pick.
- **The AI Writer's photo button could open the file picker underneath a dialog.** It fired on `onmousedown`, which only works because Remove re-renders synchronously and tears the button out before the click lands on the frame behind it. That is too fragile to rely on, so it moved to `onclick`, which stops the event properly.
- **Escape closed the whole AI interview from under the crop dialog.** It now belongs to whichever layer is on top.

### Technical notes
- The on-screen CSS transform and the export canvas transform reduce to the same expression, so the saved square is what the stage showed. Rotation is always a multiple of 90 degrees, so the rotated rectangle is its own bounding box and clamping the pan to the overhang guarantees no white gap at any zoom. Resizing the window mid-crop re-measures the stage and scales the pan with it.
- An image with no intrinsic size (an SVG without dimensions) cannot be framed, so it is accepted as uploaded rather than dropped.
- **Testimonial reviewer photos were deliberately left alone.** `.rep-av-rm` has the same class of bug and is arguably worse, but it is not the founders image that was reported.
- Verified: 5/5 inline script blocks parse, CSS braces balanced, crop geometry checked numerically at 0 and 90 degrees. **Not** click-tested in a browser: no browser automation was available in this environment.

---

## [0.9.5] 2026-07-27 — Domain pool, real availability checking, and site lifecycle

> On branch `feature/ai-website-writer`. Closes two of the gaps found in the "what did we skip" audit: **subdomain availability** and **unpublish/delete**. Also lays the data model for the planned pool of KDK-owned domains, so buying one becomes a config edit rather than a migration.

### Added
- **A domain pool.** A site's address is now the pair `(domain, subdomain)`, not a bare subdomain, so `sharma` can exist independently on two domains. The domain is chosen from a **dropdown inside the address field**, where the suffix already sits, built from `KDK_AI.siteDomains` in `frontend/app-config.js`. A `live:false` domain appears as a disabled `(coming soon)` option. With one domain configured the suffix stays plain text, since a dropdown with a single option is a control that does nothing.
- **The publish step now states the address once, and sets it large.** It briefly stated it four times: an availability sentence repeating the full address, a hint sentence, a "Live at" URL and a "Permanent address" line. The address is now the display element on the step, at up to 28px, with the name carrying a dashed underline to mark the part you type and the domain beside it in the same type, muted. Below it: one word, "Available", and one line saying which half is editable. The working link moved to where it is actually useful, the success screen and the live card, which both already showed it.
- Chosen from five directions built and compared side by side. The two runners-up were labelled form fields and a browser-window preview.
- **Real availability checking.** A new `wb_subdomain_available(domain, subdomain)` Postgres function validates length, format and a **83-name reserved list** (`www`, `admin`, `mail`, `s`, …) and reports whether the name is free. The publish step calls it on a 420ms debounce and shows available / taken / reserved / too short inline.
- **Launch is now gated on a confirmed-free address.** The button is disabled until the server says yes, and re-disables the moment the typed name stops matching the verdict it was granted for.
- **Site lifecycle controls.** Once a site exists, the publish step shows a live/offline card with **Take offline**, **Put back online** and **Delete website**.
- **`SITE_DOMAINS`** Netlify env var: the comma-separated pool `render.ts` will answer for. First entry is the default.

### Changed
- **A refused publish no longer looks like a success.** `saveSiteToSupabase()` used to resolve a bare `false` and only `console.warn`, so the animation still ended on "your site is live" over a save that never happened. It now resolves `{ok, reason}`, the success screen waits on it, and a failure closes the overlay and says why. A 403/409 is reported as "that address was just taken", which is what it actually means under RLS.
- **`render.ts` resolves a site by Host**, so `sharma.casites.in` works once wildcard DNS is pointed at Netlify. The path forms `/s/<sub>` and `/s/<domain>/<sub>` both still work with no DNS at all. The bare `/s/<sub>` resolves against the **default domain only**; it deliberately does not fall through to another domain's site.
- **The edge function is registered on `/*`** instead of `/s/*` (host mode requests `/`, not `/s/...`). It returns `undefined` for anything it does not own, so the builder and every static asset pass straight through.
- A **draft save can no longer knock a live site offline.** It used to write `status:'draft'` unconditionally; it now preserves `published`/`unpublished`.
- The builder **restores its site's identity** (id, status, domain, subdomain) on login even when a fresher local draft wins on content. Without it the publish step could not offer Unpublish or Delete, and would have inserted a second row instead of updating the first.
- Taking a site offline returns "Site unavailable / not published right now" rather than wording that implied the owner never finished.

### Fixed
- **The share link was wrong on any non-default domain.** `siteUrl()` always produced `/s/<sub>`, which `render.ts` resolves against the **default** domain, so a site published on `casites.in` got a "Live at" link that 404s. It now emits `/s/<domain>/<sub>` for non-default domains and keeps the short form for the default one, so every existing link stays valid.
- **The address no longer clips or overflows at any usable width.** Three separate faults, each found by measuring rather than by eye: the native select took its width from the widest option (`.taxsites.in (coming soon)` sizing a field showing `.kdksites.in`); the name input was allowed to shrink below its own text, scrolling what the user had just typed out of sight while the row still "fitted"; and the type was sized against the viewport, which is a poor proxy because the fixed 235px sidebar makes the card far narrower than the window. Now the select is measured against its *selected* option, neither half shrinks, and the type is keyed to the card via a container query (with the viewport rule kept as a fallback). Verified with a 17-character and a 30-character name at 1400 / 1180 / 900 / 800 / 700 / 640 / 600 / 560 / 520px.
- **`local-ai-config.js` was silently deleting committed config.** It assigns `window.KDK_AI = {...}` outright instead of merging, and loads *after* `app-config.js`, so on any machine that has it (it is gitignored, so it varies per machine) `siteDomains`, `publicBase` and `prettyDomain` all vanished. The visible symptom was the domain picker never appearing. `app-config.js` now keeps a `KDK_AI_DEFAULTS` reference and `index.html` backfills missing keys after both scripts load, so a local override can add or replace a key but never remove one. Deliberate local overrides still win, and the restore is logged to the console.
- **A missing RPC no longer reports itself as a network problem.** Before the migration is pushed, `wb_subdomain_available()` returns 404, which was shown as "Could not check availability. Check your connection." and sent testers hunting the wrong fault. A 404 now reads "Availability checking is not set up on the server yet" and logs the exact fix (`supabase db push`); genuine transport failures keep the connection message.
- Sample domains (`casites.in`, `legalsites.in`, `taxsites.in`) added to the pool so the picker can be seen and tested. **None is bought or wired** and the config carries a prominent warning to strip them before real users.
- The auto-mirrored address could be cut at 30 characters mid-hyphen and display `gupta-verma-sharma-associates-` while the line beneath it confirmed `gupta-verma-sharma-associates`. `siteSlug()` already stripped it before anything was sent, so nothing was ever published wrong, but the field now shows exactly what goes live.

### Technical notes
- **Uniqueness moved** from the inline `subdomain text unique` to a partial unique index on `(domain, subdomain) where subdomain is not null`. The upsert's conflict target changed to match; a mismatch there is rejected by Postgres.
- `wb_subdomain_available` is `SECURITY DEFINER` **by necessity**: RLS exposes only rows that are published or owned by the caller, so a browser-side check reports "available" for another user's draft and the publish then 403s. The function sees every row but returns only `{available, reason}` — no ids, owners or config. A name the caller already owns counts as available.
- **A delete policy was added** (`wb_websites_delete_own`). There was none, which under RLS meant every delete was silently refused.
- Delete is **hard** and `wb_leads` cascades, so it is gated behind typing the exact address, with the lead loss stated in the dialog. Unpublish is **soft**: the row, the leads and the reserved address all survive.
- Verified: 4/4 inline script blocks parse; 54/54 builder assertions in jsdom (picker, debounce, race, stale-verdict, upsert target, lifecycle, typed-confirm, failure paths); 18/18 routing cases against `render.ts` including the same subdomain on two domains and the builder never being intercepted; and every slug the builder can generate validates against the Postgres regex. **The migration is applied** to `hlhtopqbzfzlxxmolkok` and the RPC was checked against the live database over REST: free, `reserved`, `too_short`, `invalid_format` and `taken` all return correctly, and the same name is free on a second domain, which proves uniqueness moved to the pair.

---

## [0.9.4] 2026-07-27 — The AI Writer opens on a screen that shows what it does

> On branch `feature/ai-website-writer`. The AI button used to drop you straight onto the first question, so nobody was told that an AI writes the whole site or that thin answers produce thin copy.

### Added
- **Intro screen for the AI Writer** (`frontend/index.html`). Shown when the modal opens with no answers saved, and reachable any time from a new **How this works** button in the step rail's footer. One CTA leaves it, and a saved draft skips it entirely.
- **A navy panel with drifting aurora light**, centred, with a gradient headline, one short paragraph and a gold call to action. The panel replaces the modal's footer band on this screen.
- **A demonstration instead of a description.** Four answer chips ("12 years in Jaipur", "GST notices", "We reply in 2 hours", "300+ filings a year") pop in one at a time, then drop into a blank page which writes itself: nav, a hero headline typed character by character with a pen nib riding the caret, sub-lines, buttons, three service cards and a "Ready to publish" badge. The page then **scrolls inside the browser frame**, revealing the about band, a dark stats band and the footer. A three-step strip, `You answer` / `AI writes` / `You go live`, lights up in time behind a filling gradient track.
- One sentence carries the lesson: **"The more you tell us, the better it writes."**

### Changed
- The first cut of this screen explained the feature in three headed paragraphs and a note. Rewritten after review as "content heavy, no one reads the content": prose is down from roughly 120 words to 45, and everything cut is now shown.

### Technical notes
- Pure CSS keyframes. No GIF, video or external asset, per the project's no-CDN rule.
- The whole loop is 11s and **every** animation is `11s infinite`, phased by `animation-delay` alone, so the pieces cannot drift apart however long the modal is open. The percentage map is documented above the stylesheet block.
- The three step circles share a single keyframe pair; their colour is a per-step CSS variable and their moment is a delay.
- The typing reveal (`clip-path`) and the caret (an absolutely positioned bar) run off identical stepped percentages, so the caret sits on the last shown character regardless of font metrics.
- Implemented as a card state (`.aiw-card.intro`), not an extra entry in `QS`, so step indices, the rail, progress and validation are untouched.
- `prefers-reduced-motion` shows the finished frame rather than a frozen half-typed one.

---

## [0.9.3] 2026-07-25 — Removed the unused design-samples/ folder

> Closes the "retire or sync `New Design/`" question open since Session 3. No user-visible change.

### Removed
- **`frontend/design-samples/`** (apex, nova, heritage, zenith, zenith-v2) — a second copy of every design without the binding script. **Nothing loaded it:** each `DESIGNS` entry had a `path` (samples) and a `live` (templates), both consumers resolved `d.live || d.path`, and all four designs had a `live`. It had also drifted from the shipping renderers by ~75 lines for Apex, so it was no longer a faithful original.
- The dead `path` field on all four `DESIGNS` entries in `frontend/index.html`.
- A dead branch in the preview URL label that could only fire for a design with no `live` renderer.

### Changed
- The Step 2 thumbnail `src` and `openPreview`'s target now read `d.live` directly instead of `d.live || d.path`.
- Stale comments in the heritage/nova/zenith renderers that pointed at the old sample location.
- `frontend/README.md` rewritten; `CLAUDE.md`, `README.md` and `docs/ADMIN-PANEL-UNDERSTANDING.md` updated. The admin notes' "sample templates are pristine" rule is struck through and marked SUPERSEDED rather than deleted, since it was a stated design principle.

### Unaffected
- **"Sample mode" still works.** The magnifier button on a design card loads the normal `templates/<key>` renderer and deliberately sends it no config, so it shows its own demo content. It never used the deleted folder.

---

## [0.9.2] 2026-07-25 — frontend/ + backend/ split

> Structure only. No product behaviour, UI, or feature change. **Zero application code paths changed** — the browser-facing tree moved as a unit and is served as the site root, so all its relative paths still resolve.

### Added
- **`.github/workflows/pages.yml`** — publishes `frontend/` as the GitHub Pages site root via `actions/upload-pages-artifact@v3`. This is what makes a real `frontend/` folder possible: Pages' branch mode can only serve the repo root or `/docs`.
- **`frontend/README.md`** — documents `templates/` vs `design-samples/`, including that `design-samples/` is currently loaded by nothing and has drifted from what ships.
- **`backend/README.md`** — what is built (`supabase/`, `netlify/`) vs never built (`spec/`), the Supabase CLI working-directory change, and the required Netlify env vars.

### Changed
- **`frontend/`** — `index.html`, `app-config.js`, `local-ai-config.js`, `assets/`, `templates/`, `design-samples/`.
- **`backend/`** — `supabase/`, `netlify/edge-functions/`, and `spec/` (moved back out of `docs/`, now that a real backend folder exists to hold it).
- **`netlify.toml`** — `publish = "frontend"`, `edge_functions = "backend/netlify/edge-functions"`. Still at the repo root, which Netlify requires.
- **Root `index.html`** is no longer the builder; it is a fallback redirect to `frontend/`, so the live URL survives until the Pages source is switched. Safe to delete afterwards.

### Action required
- **GitHub Pages:** Settings -> Pages -> Source -> **GitHub Actions**, otherwise Pages keeps serving the branch root and visitors take a redirect hop to `/frontend/`.
- **Supabase CLI:** run `cd backend && supabase …` or `supabase --workdir backend …`; `config.toml` is no longer at the repo root.

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
