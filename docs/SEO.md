# SEO: what's done, what's not, and why it matters
> Written 2026-07-31, in plain English on purpose. Read this if you want to know how findable a client's published website actually is on Google, WhatsApp, etc.
> Scope: this is about the **published client sites** (`name.kdksites.in`), not the builder tool itself. Nobody needs to find the builder on Google, only the firm's own site.

---

## The one-sentence version

The technical basics (how fast the page loads, whether a shared link shows a nice preview, whether Google can read the page at all, structured business facts for Google) are handled. What's left is mostly structural, not a quick code fix: the subdomain address itself, and the fact that every site is one of only 4 templates.

---

## Glossary (read this first if any of the terms below are unfamiliar)

| Term | What it actually means |
|---|---|
| **SEO** | Search Engine Optimisation. Anything that affects whether, and how well, a page shows up when someone searches Google. |
| **Crawler / bot** | An automated program (Google's, WhatsApp's, Facebook's, etc.) that visits a page to read it, without a human or a browser involved. It only sees the raw HTML unless it specifically runs JavaScript, so anything that only appears after the page "loads and does stuff" may be invisible to it. |
| **Meta description** | A short summary of the page, invisible on the page itself, but shown by Google under the blue link in search results. |
| **Open Graph (OG) tags** | Hidden tags that control the preview card when a link is shared on WhatsApp, Facebook, LinkedIn, iMessage, etc.: the title, description, and image shown. |
| **og:image** | The specific OG tag for the preview image. Needs to be a real image address (a URL), not a photo embedded directly in the page's code. |
| **Canonical tag** | One line telling Google "this exact address is the official version of this page," used when the same content can be reached at more than one URL. |
| **Structured data (JSON-LD)** | A block of hidden, structured facts about the business (name, phone, address, hours, services) written in a fixed format Google can read directly, instead of having to guess by reading sentences. Note: this does **not** get you the star-rating rich snippet, see below. |
| **Sitemap** | A tiny file listing every page on a site, so a crawler knows what exists without having to guess by following links. |
| **robots.txt** | A tiny file at the root of a site telling crawlers what they're allowed to look at. |

---

## What's already working today

| Item | Plain-English explanation | Status |
|---|---|---|
| Page title & description | Every published site gets its own real `<title>` and meta description built from that firm's actual name, tagline and city, not the template's demo text. | ✅ Done |
| Social share preview (text) | Sharing a site's link on WhatsApp shows the real firm name and a short description, not the template's placeholder firm. | ✅ Done |
| Social share preview (image) | The preview card also shows an image now: the firm's own logo, or their lead partner's photo if there's no logo. Sites with neither just show a plain text card, never a broken image. | ✅ Done (2026-07-31) |
| Canonical tag | Each site tells Google which address is its "real" one, so Google doesn't get confused if the same site is reachable at more than one URL. | ✅ Done (2026-07-31) |
| robots.txt / sitemap.xml | Each site (once it has its own subdomain address, e.g. `sharma.kdksites.in`) serves these two small files automatically. | ✅ Done (2026-07-31) |
| Structured data (JSON-LD) | Each site now carries a hidden, structured fact-sheet for Google: business name and type (matched to the actual profession: `AccountingService`, `LegalService`, etc.), phone, email, address, opening hours, founding year, the founder's name and role, the firm's actual service list, its "best known for" points, and its social media links. This is what lets Google potentially build a richer result than a plain blue link. | ✅ Done (2026-07-31) |
| Mobile-friendly | All 4 templates use flexible layouts that work on a phone screen. Google specifically checks for this and ranks mobile-unfriendly sites lower. | ✅ Already in place |
| Fast page load | Every page is one self-contained file, no heavy external scripts or fonts to wait for. Fast-loading pages are also something Google's ranking directly rewards. | ✅ Already in place |
| HTTPS (the padlock) | Both hosts (Netlify and Cloudflare) provide this automatically. Google penalises sites without it. | ✅ Already in place |

### One thing deliberately left out of structured data: reviews / star ratings

The builder already collects client testimonials, and schema.org has fields for exactly this (`review`, `aggregateRating`). They were left out on purpose: Google specifically restricts the star-rating rich snippet from a business's own self-published review markup on its own site, precisely to stop businesses writing five-star reviews about themselves into their own page. Adding this markup would look like it does something, but Google would simply ignore it. The real way to get those stars in search results is a firm claiming and collecting reviews on its **Google Business Profile**, which is a separate, per-firm action outside this codebase entirely, not something the builder can automate.

---

## What's NOT done yet, and what it would actually get you

### The subdomain trade-off (structural, not really fixable right now)

A site at `sharma.kdksites.in` (a subdomain of a shared domain) generally carries less search authority than `sharmaassociates.com` (a domain the firm owns outright), because Google treats subdomains of a shared platform somewhat cautiously by default. This is the same trade-off every "no-code website builder" product has (Wix, Squarespace, etc. all had this exact issue in their early years). It is not a bug, and not something to fix with a code change. It only goes away if/when custom domains become part of the product (already flagged as a future item, not Phase 1).

### Template duplication at scale (a longer-term ceiling)

There are only 4 templates. At a handful of sites, this is invisible. At thousands of sites, every firm using, say, the Heritage template has identical section headings, identical layout, identical footer text, and only the firm's name, photos and AI-written paragraphs actually differ. Google is good at noticing "these thousands of pages are the same template with names swapped in," and tends to rank that kind of content lower, because it reads as mass-produced rather than genuinely distinct. There's no quick fix for this: it's a direct consequence of how a template-based builder works, and only becomes a real problem once there are a lot of live sites.

---

## Where this actually lives in the code

- **Per-site title, description, OG tags, og:image, canonical tag, robots.txt, sitemap.xml, JSON-LD structured data**: all generated on the fly, per request, by the edge functions that serve a published site:
  - `src/index.ts` (Cloudflare Worker, the daily-dev host) — see `buildJsonLd()` for the structured data
  - `backend/netlify/edge-functions/render.ts` (Netlify, mirrors the Cloudflare version by hand: the two are not automatically kept in sync, see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md))
- **The actual firm data used to fill all of the above** (firm name, tagline, city, logo, partner photo, services, socials) comes from the config saved by the builder in `frontend/index.html`'s `collectConfig()`, stored as JSON in Supabase's `wb_websites` table.
