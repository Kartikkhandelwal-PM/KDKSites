# SEO for published client sites
> Written 2026-07-31. Covers only the **published client sites** (`name.kdksites.in`), not the builder tool itself, since nobody needs to find the builder on Google, only the firm's own site.

## How it actually works, in plain terms

Every time someone visits a published site, the request passes through a small piece of server code before the page is sent back (this lives in `src/index.ts` for the Cloudflare-hosted version, and `backend/netlify/edge-functions/render.ts` for the Netlify one, both do the same thing). That code looks up the firm's saved details (name, phone, address, services, etc.) and stamps them into the page automatically:

- The **page title** and a short **description**, using the firm's real name and tagline instead of the template's placeholder text.
- A **preview card** for when the link is shared on WhatsApp, with the firm's actual logo (or their lead partner's photo if there's no logo), so it doesn't show a broken or blank image.
- A **canonical address**: one line that tells Google "this is the one true address for this page," so if the same site can be reached two different ways, Google doesn't get confused about which one to rank.
- A **robots.txt and sitemap.xml file**, the two small files search engines look for to know a site exists and is allowed to be read.
- A hidden **fact-sheet about the business** (name, phone, address, opening hours, founding year, the founder's name, the actual list of services offered, what the firm is best known for, and its social media links), written in a format Google can read directly instead of having to guess by parsing paragraphs. This is what can make a search result show more than just a blue link.

None of this needs a human to fill in a separate form or upload a separate file anywhere. It is generated fresh, automatically, every time the page is requested, straight from whatever the professional typed into the builder. If they update their phone number in the builder and publish again, the very next visit picks up the new number in all of the above, nothing to redo elsewhere.

**One thing was deliberately left out**: star ratings from client reviews. The builder already has testimonials, and it would be easy to add that data to the fact-sheet too, but Google specifically ignores review markup that a business publishes about itself on its own site (that rule exists to stop businesses writing themselves fake five-star reviews). The only way to actually get stars showing in search results is the firm claiming its own **Google Business Profile** and collecting real reviews there, that is a separate action for the professional to take on Google's site, has nothing to do with this codebase, and cannot be automated by us.

## Who needs to do what

**The professional using the builder: nothing extra.** They just fill in the builder normally (firm name, services, contact details, etc.) and publish. Everything above is generated from that automatically. There is no separate SEO step, no file to upload, no setting to turn on.

**KDK (us): a few one-time setup steps**, none of them per-professional, done once for the whole platform:

1. **Wildcard DNS**, already known, not yet done. Right now every published site is only reachable at `.../s/<name>` (a path). The pretty address `name.kdksites.in` only starts working once wildcard DNS for `kdksites.in` is pointed at the hosting provider, and the same for any of the other domain names once one is actually purchased. Until this is done, everything in this document still works, just at the `/s/<name>` address instead of the pretty one.
2. **Tell each host which domains it's allowed to answer for** (the `SITE_DOMAINS` setting, one per host). Already set for `kdksites.in` and covered in [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md).
3. **(Recommended, not yet done) Verify `kdksites.in` in Google Search Console and submit its sitemap.** This is a free, one-time action on Google's own site: prove ownership of the domain (Google gives a DNS record to add), then Google can discover every subdomain under it, all client sites, without waiting to stumble onto them naturally. This step is optional (Google finds public sites eventually on its own) but it's the fastest way to get new sites indexed quickly, and it costs nothing.
4. **Nothing to do for JSON-LD, robots.txt, sitemap.xml, or the preview image**, they are generated automatically per request, as described above. There's no dashboard to configure, no CDN to upload a file to.

## What's still a limitation, not a quick fix

- **A subdomain address carries less search weight than a firm's own domain.** `sharma.kdksites.in` will generally rank a little behind `sharmaassociates.com` for the same content, because Google is cautious by default about subdomains of a shared platform. Every no-code website builder (Wix, Squarespace, etc.) has had this exact issue. It goes away only if/when custom domains become part of the product, that's a future item, not something to fix with a code change today.
- **Every site is one of only 4 templates.** At a handful of live sites this is invisible. At thousands of sites, every firm on the same template has identical headings, layout and footer text, only the name, photos and AI-written paragraphs differ, and Google is good at spotting that pattern and ranking it lower as a result. This only becomes a real problem once there are a lot of live sites, and there's no code fix for it, it's a direct consequence of how a template-based builder works.

## Where this lives in the code

- `src/index.ts` (Cloudflare Worker) and `backend/netlify/edge-functions/render.ts` (Netlify) both generate the title, description, preview image, canonical tag, robots.txt, sitemap.xml, and the JSON-LD fact-sheet (`buildJsonLd()`), on every request. The two files do the same thing but are kept in sync by hand, not automatically, see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md).
- All of the firm data used to fill the above comes from `collectConfig()` in `frontend/index.html`, saved as JSON in Supabase's `wb_websites` table.
