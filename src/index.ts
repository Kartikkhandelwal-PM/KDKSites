// Cloudflare Workers port of backend/netlify/edge-functions/render.ts — same
// logic, ported line-for-line where possible. Renders a published KDK site at
// /s/<subdomain>. Reads the saved config from Supabase (service key,
// server-side) and injects it into the chosen templates/ renderer, which
// applies it via window.__applyConfig.
//
// Env vars required (set with `wrangler secret put <NAME>` for the two
// secrets, or as [vars] in wrangler.jsonc for the non-secret ones):
//   SUPABASE_URL          e.g. https://hlhtopqbzfzlxxmolkok.supabase.co
//   SUPABASE_SERVICE_KEY  the "service_role" key (Supabase -> Settings -> API)  [SECRET]
//   SUPABASE_ANON_KEY     the "anon" public key — injected into the page so the
//                         contact form can insert leads (RLS restricts anon to
//                         inserting into wb_leads only). Optional: if unset, the
//                         form still works but shows a confirmation without saving.
//   SITE_DOMAINS          comma-separated pool of KDK-owned domains, e.g.
//                         "kdksites.in,casites.in". The FIRST is the default.
//                         Optional; defaults to "kdksites.in".
//
// ADDRESSING. A site is identified by the PAIR (domain, subdomain), because the
// same name may legitimately exist on two domains. Two ways in:
//
//   1. Host mode   sharma.casites.in           <- the real address, once wildcard
//                                                 DNS for that domain points here
//   2. Path mode   /s/sharma  or  /s/casites.in/sharma
//                                                 works with no DNS at all, which
//                                                 is how the prototype is shared
//
// The bare /s/<sub> form predates multi-domain, so it has to keep working. It
// resolves against the DEFAULT domain only. That is deliberate: silently falling
// through to some other domain's site would serve a stranger's page at a link a
// user believes is theirs.

export interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  SITE_DOMAINS?: string;
}

const DEFAULT_DOMAINS = "kdksites.in";
const siteDomains = (env: Env): string[] =>
  (env.SITE_DOMAINS || DEFAULT_DOMAINS)
    .split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

/** Split a request hostname into (domain, subdomain) if it sits under a known
 *  domain from the pool. Returns null for the Workers host, localhost, or any
 *  domain we do not serve. */
function fromHost(hostname: string, domains: string[]): { domain: string; subdomain: string } | null {
  const host = hostname.toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "");
  for (const domain of domains) {
    if (host === domain || host === `www.${domain}`) return null;   // apex is the marketing site, not a client site
    if (host.endsWith(`.${domain}`)) {
      const sub = host.slice(0, -(domain.length + 1));
      if (sub && !sub.includes(".")) return { domain, subdomain: sub };   // one label only; no a.b.domain
    }
  }
  return null;
}

const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9-]/g, "");

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const domains = siteDomains(env);
    const isSitePath = url.pathname === "/s" || url.pathname.startsWith("/s/");

    // ---- Resolve which site was asked for -------------------------------
    let domain = "";
    let subdomain = "";
    // og-image is a real per-site asset (referenced by the meta tags below), so
    // it works in both addressing modes. robots.txt/sitemap.xml are host-mode
    // only: crawlers only ever fetch them from the true origin root, and in
    // path mode (/s/<sub>) there is no origin of the site's own to answer for.
    let wantsOgImage = false;
    let wantsRobots = false;
    let wantsSitemap = false;

    const viaHost = fromHost(url.hostname, domains);
    if (viaHost) {
      domain = viaHost.domain;
      subdomain = clean(viaHost.subdomain);
      if (url.pathname === "/og-image") wantsOgImage = true;
      else if (url.pathname === "/robots.txt") wantsRobots = true;
      else if (url.pathname === "/sitemap.xml") wantsSitemap = true;
      // On a client domain, only the site itself is served here. Its own assets
      // (/templates/..., /assets/...) still come from the static build.
      else if (url.pathname !== "/") return env.ASSETS.fetch(request);
    } else if (isSitePath) {
      // Path mode: /s/<subdomain> or /s/<domain>/<subdomain>, optionally with a
      // trailing /og-image.
      const parts = url.pathname.split("/").filter(Boolean);   // ["s", ...]
      let rest = parts.slice(1);
      if (rest[rest.length - 1] === "og-image") { wantsOgImage = true; rest = rest.slice(0, -1); }
      const a = (rest[0] || "").toLowerCase();
      const b = (rest[1] || "").toLowerCase();
      if (b && domains.includes(a)) { domain = a; subdomain = clean(b); }
      else { domain = domains[0]; subdomain = clean(a); }
    } else {
      return env.ASSETS.fetch(request);   // not ours — let the static site answer
    }
    if (!subdomain) return page("Site not found", "Missing subdomain.", 404);

    const SB_URL = env.SUPABASE_URL;
    const SB_SERVICE = env.SUPABASE_SERVICE_KEY;
    if (!SB_URL || !SB_SERVICE) return page("Not configured", "The server is missing Supabase env vars.", 500);

    // Look up the site (service key bypasses RLS). Matched on the PAIR.
    const q = `${SB_URL.replace(/\/+$/, "")}/rest/v1/wb_websites` +
      `?subdomain=eq.${encodeURIComponent(subdomain)}` +
      `&domain=eq.${encodeURIComponent(domain)}` +
      `&select=id,template,config,status&limit=1`;
    let rows: any[] = [];
    try {
      const r = await fetch(q, { headers: { apikey: SB_SERVICE, authorization: `Bearer ${SB_SERVICE}` } });
      if (!r.ok) return page("Lookup failed", `Supabase returned ${r.status}.`, 502);
      rows = await r.json();
    } catch {
      return page("Lookup failed", "Could not reach Supabase.", 502);
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return page("Site not found", `No site at ${subdomain}.${domain}.`, 404);
    }

    const site = rows[0];
    // Covers both 'draft' and 'unpublished'. Taking a site offline is a supported
    // action now, so the wording must not imply the owner simply never finished.
    if (site.status !== "published") {
      return page("Site unavailable", "This site is not published right now.", 404);
    }

    const template = ["apex", "nova", "heritage", "zenith"].includes(site.template) ? site.template : "apex";
    const config = site.config || {};

    const esc = (s: unknown) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    // Canonical share link: the real address in host mode, the path form otherwise.
    const shareUrl = viaHost ? `https://${subdomain}.${domain}` : `${url.origin}/s/${subdomain}`;

    // The firm's own logo, falling back to the lead partner's photo, is what a
    // shared link's preview card shows. Both are stored as base64 data: URLs
    // inside the config (see readScaledImage() in frontend/index.html) rather
    // than as files with their own address, so they need a real URL of their
    // own before a social crawler (which does not run JS and cannot fetch a
    // data: URL) can use one as og:image. This route decodes and re-serves it.
    const ogImageSrc = String((config as any).logo || (config as any).founderPhoto || "");
    if (wantsOgImage) return imageResponse(ogImageSrc);
    if (wantsRobots) return robotsResponse(shareUrl);
    if (wantsSitemap) return sitemapResponse(shareUrl, esc);

    // Fetch the template from this same deploy's static assets.
    let html = "";
    try {
      const tpl = await env.ASSETS.fetch(new Request(new URL(`/templates/${template}/index.html`, url)));
      if (!tpl.ok) return page("Template missing", `Could not load the ${template} template.`, 502);
      html = await tpl.text();
    } catch {
      return page("Template missing", "Could not load the template.", 502);
    }

    // --- SEO / social-share metadata ---------------------------------------
    // The templates ship with demo <title>/text. Rewrite the title and inject
    // Open Graph + Twitter tags from the firm's config so a shared link previews
    // the real firm name (not the template's demo firm). Applies to every template.
    const firm = String((config as any).firmName || "").trim();
    const tagline = String((config as any).tagline || "").trim();
    const city = String((config as any).city || "").trim();
    const about = String((config as any).about || "").trim();
    const brand = firm || "Professional Services";
    const titleText = brand + (tagline ? " | " + tagline : "") + (city ? (tagline ? ", " : " | ") + city : "");
    const descText = (tagline || about || (firm ? firm + " — professional services" : "")).slice(0, 180);
    const hasImage = /^data:image\//.test(ogImageSrc);
    const imageUrl = hasImage ? `${shareUrl}/og-image` : "";
    const metaTags =
      `<meta property="og:type" content="website">` +
      `<meta property="og:site_name" content="${esc(brand)}">` +
      `<meta property="og:title" content="${esc(brand)}">` +
      `<meta property="og:description" content="${esc(descText)}">` +
      `<meta property="og:url" content="${esc(shareUrl)}">` +
      (imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}">` : "") +
      `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}">` +
      `<meta name="twitter:title" content="${esc(brand)}">` +
      `<meta name="twitter:description" content="${esc(descText)}">` +
      (imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}">` : "") +
      `<meta name="description" content="${esc(descText)}">` +
      `<link rel="canonical" href="${esc(shareUrl)}">` +
      buildJsonLd(config, shareUrl, imageUrl, brand, descText);
    if (/<title>[\s\S]*?<\/title>/i.test(html)) {
      html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(titleText)}</title>${metaTags}`);
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `<title>${esc(titleText)}</title>${metaTags}</head>`);
    }

    // Expose the anon key + this site's id so the contact form can insert leads
    // straight into wb_leads (RLS lets anon insert leads only). Safe to embed: the
    // anon key is a public key. Injected before applyConfig so it's ready early.
    const kdk = {
      supabaseUrl: SB_URL.replace(/\/+$/, ""),
      supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
      websiteId: site.id || null,
      subdomain,
    };
    const kdkJson = JSON.stringify(kdk).replace(/</g, "\\u003c");
    const kdkScript = `<script>window.__KDK=${kdkJson};</script>`;

    // Apply the saved config after the template's own script defines __applyConfig.
    const json = JSON.stringify(config).replace(/</g, "\\u003c");
    const apply = `<script>(function(){try{var c=${json};if(window.__applyConfig)window.__applyConfig(c);}catch(e){}})();</script>`;
    const tail = kdkScript + apply;
    html = html.includes("</body>") ? html.replace("</body>", tail + "</body>") : html + tail;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
    });
  },
};

// Decodes a stored `data:<mime>;base64,<...>` image and re-serves it as a real
// image response, so it has a URL a social-share crawler can actually fetch.
function imageResponse(dataUrl: string): Response {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return new Response("Not found", { status: 404 });
  const [, mime, b64] = m;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { "content-type": mime, "cache-control": "public, max-age=3600" } });
}

function robotsResponse(shareUrl: string): Response {
  const body = `User-agent: *\nAllow: /\nSitemap: ${shareUrl}/sitemap.xml\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}

// One page per site, so the sitemap is just that one URL.
function sitemapResponse(shareUrl: string, esc: (s: unknown) => string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${esc(shareUrl)}</loc></url>\n` +
    `</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

// Structured data (JSON-LD): machine-readable facts about the firm, so Google
// can build a rich result (phone, hours, services) instead of guessing from
// prose. Deliberately excludes review/aggregateRating markup: Google does not
// grant the star-rating rich snippet for a business's own self-published
// review markup on its own site (that requires Google Business Profile
// instead), so shipping it here would look like it works but wouldn't.
function buildJsonLd(config: any, shareUrl: string, imageUrl: string, brand: string, descText: string): string {
  const schemaType = (profession: string) => {
    if (profession === "advocate") return "LegalService";
    if (profession === "company_secretary") return "ProfessionalService";
    return "AccountingService";   // ca, tax_consultant, gst_practitioner, cost_accountant
  };
  const city = String(config.city || "").trim();
  const address = String(config.address || "").trim();
  const phone = String(config.phone || "").trim();
  const email = String(config.email || "").trim();
  const hours = String(config.hours || "").trim();
  const founderName = String(config.founderName || "").trim();
  const founderRole = String(config.founderRole || "").trim();
  const foundedYear = String(config.foundedYear || "").trim();
  const social = config.social || {};
  const sameAs = Array.from(new Set(
    [social.linkedin, social.facebook, social.instagram, social.youtube]
      .map((s: unknown) => String(s || "").trim()).filter(Boolean)
  ));
  const highlights = Array.isArray(config.highlights) ? config.highlights : [];
  const knowsAbout = highlights.map((h: any) => String((h && h.t) || "").trim()).filter(Boolean);
  const services = Array.isArray(config.services) ? config.services : [];

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType(String(config.profession || "")),
    name: brand,
    url: shareUrl,
  };
  if (imageUrl) ld.image = imageUrl;
  if (descText) ld.description = descText;
  if (phone) ld.telephone = phone;
  if (email) ld.email = email;
  if (address || city) {
    ld.address = {
      "@type": "PostalAddress",
      ...(address ? { streetAddress: address } : {}),
      ...(city ? { addressLocality: city } : {}),
      addressCountry: "IN",
    };
  }
  if (city) ld.areaServed = city;
  if (foundedYear) ld.foundingDate = foundedYear;
  if (hours) ld.openingHours = hours;
  if (sameAs.length) ld.sameAs = sameAs;
  if (founderName) {
    ld.founder = { "@type": "Person", name: founderName, ...(founderRole ? { jobTitle: founderRole } : {}) };
  }
  if (knowsAbout.length) ld.knowsAbout = knowsAbout;
  if (services.length) {
    ld.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((s: any) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: String((s && s.name) || ""),
          ...(s && s.desc ? { description: String(s.desc) } : {}),
        },
      })),
    };
  }
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}

function page(title: string, msg: string, status: number): Response {
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title>` +
    `<body style="font-family:system-ui,-apple-system,sans-serif;background:#F4F6FC;color:#33475b;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center">` +
    `<div><h1 style="color:#0D1E35;margin:0 0 8px">${title}</h1><p style="margin:0">${msg}</p></div></body>`;
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}
