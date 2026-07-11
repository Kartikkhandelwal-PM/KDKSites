// Renders a published KDK site at /s/<subdomain>.
// Reads the saved config from Supabase (service key, server-side) and injects
// it into the chosen Live/ template, which applies it via window.__applyConfig.
//
// Netlify env vars required (Site settings -> Environment variables):
//   SUPABASE_URL          e.g. https://hlhtopqbzfzlxxmolkok.supabase.co
//   SUPABASE_SERVICE_KEY  the "service_role" key (Supabase -> Settings -> API)  [SECRET]

export default async (request: Request) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["s", "<subdomain>"]
  const subdomain = (parts[1] || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!subdomain) return page("Site not found", "Missing subdomain.", 404);

  const SB_URL = Deno.env.get("SUPABASE_URL");
  const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_KEY");
  if (!SB_URL || !SB_SERVICE) return page("Not configured", "The server is missing Supabase env vars.", 500);

  // Look up the site (service key bypasses RLS)
  const q = `${SB_URL.replace(/\/+$/, "")}/rest/v1/wb_websites` +
    `?subdomain=eq.${encodeURIComponent(subdomain)}&select=template,config,status&limit=1`;
  let rows: any[] = [];
  try {
    const r = await fetch(q, { headers: { apikey: SB_SERVICE, authorization: `Bearer ${SB_SERVICE}` } });
    if (!r.ok) return page("Lookup failed", `Supabase returned ${r.status}.`, 502);
    rows = await r.json();
  } catch {
    return page("Lookup failed", "Could not reach Supabase.", 502);
  }
  if (!Array.isArray(rows) || rows.length === 0) return page("Site not found", `No site at /s/${subdomain}.`, 404);

  const site = rows[0];
  if (site.status !== "published") return page("Not published", "This site is not published yet.", 404);

  const template = ["apex", "nova", "heritage", "zenith"].includes(site.template) ? site.template : "apex";
  const config = site.config || {};

  // Fetch the template from this same deploy
  let html = "";
  try {
    const tpl = await fetch(`${url.origin}/Live/${template}/index.html`);
    if (!tpl.ok) return page("Template missing", `Could not load the ${template} template.`, 502);
    html = await tpl.text();
  } catch {
    return page("Template missing", "Could not load the template.", 502);
  }

  // --- SEO / social-share metadata ---------------------------------------
  // The templates ship with demo <title>/text. Rewrite the title and inject
  // Open Graph + Twitter tags from the firm's config so a shared link previews
  // the real firm name (not the template's demo firm). Applies to every template.
  const esc = (s: unknown) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const firm = String((config as any).firmName || "").trim();
  const tagline = String((config as any).tagline || "").trim();
  const city = String((config as any).city || "").trim();
  const about = String((config as any).about || "").trim();
  const brand = firm || "Professional Services";
  const titleText = brand + (tagline ? " | " + tagline : "") + (city ? (tagline ? ", " : " | ") + city : "");
  const descText = (tagline || about || (firm ? firm + " — professional services" : "")).slice(0, 180);
  const shareUrl = `${url.origin}/s/${subdomain}`;
  const metaTags =
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="${esc(brand)}">` +
    `<meta property="og:title" content="${esc(brand)}">` +
    `<meta property="og:description" content="${esc(descText)}">` +
    `<meta property="og:url" content="${esc(shareUrl)}">` +
    `<meta name="twitter:card" content="summary">` +
    `<meta name="twitter:title" content="${esc(brand)}">` +
    `<meta name="twitter:description" content="${esc(descText)}">` +
    `<meta name="description" content="${esc(descText)}">`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(titleText)}</title>${metaTags}`);
  } else if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `<title>${esc(titleText)}</title>${metaTags}</head>`);
  }

  // Apply the saved config after the template's own script defines __applyConfig.
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  const apply = `<script>(function(){try{var c=${json};if(window.__applyConfig)window.__applyConfig(c);}catch(e){}})();</script>`;
  html = html.includes("</body>") ? html.replace("</body>", apply + "</body>") : html + apply;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
  });
};

function page(title: string, msg: string, status: number) {
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title>` +
    `<body style="font-family:system-ui,-apple-system,sans-serif;background:#F4F6FC;color:#33475b;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center">` +
    `<div><h1 style="color:#0D1E35;margin:0 0 8px">${title}</h1><p style="margin:0">${msg}</p></div></body>`;
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}
