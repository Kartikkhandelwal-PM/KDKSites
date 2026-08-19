/* ============================================================
   PUBLIC app config — safe to commit.
   The Supabase URL and the "anon" key are designed to be public
   (they ship to every browser); the real secret keys live only in
   Supabase secrets and Netlify env vars, never here.
   ------------------------------------------------------------
   Loaded BEFORE local-ai-config.js. On your machine, the gitignored
   local-ai-config.js overrides this to add a direct AI provider key
   for local testing. On the deployed site (where local-ai-config.js
   does not exist) these values are what powers auth + publish + AI.
   ============================================================ */
window.KDK_AI = {
  provider: 'openai',                                            // AI provider used via the Supabase Edge Function
  supabaseUrl:     'https://hlhtopqbzfzlxxmolkok.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaHRvcHFiemZ6bHh4bW9sa29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NTMyOTAsImV4cCI6MjA5OTMyOTI5MH0.K5UZ9CbqbNEfMRTMaOVTtlrx9HGi544iy2zf5CVZXww',
  openai:    { model: 'gpt-4o-mini' },
  anthropic: { model: 'claude-opus-5' },

  /* ---------- Profile import ----------
     The AI Writer can read an uploaded firm profile / resume / brochure
     (PDF, DOCX, or a photo of one) and pre-fill the interview from it.

     This runs through OpenRouter so a single key reaches every model, and
     swapping models is a one-line change here. The models below all accept
     files natively, so the PDF goes straight to the model with no OCR fee
     and no client-side parsing library (which the no-CDN rule forbids).

     Rough cost per profile at ~6k in / 800 out tokens:
       google/gemini-3.5-flash-lite   ~₹0.35   <- default: cheapest that can do the job
       google/gemini-3-flash-preview  ~₹0.48   avoid in production, "preview" can vanish
       anthropic/claude-haiku-4.5     ~₹0.90   step up here if Lite invents content
       google/gemini-3.6-flash        ~₹1.32
       google/gemini-3.5-flash        ~₹1.42
       anthropic/claude-sonnet-5      ~₹2.10
       anthropic/claude-opus-5        ~₹4.40   most careful, rarely worth it for this

     Compare them on YOUR documents at frontend/test-profile-import.html before
     changing this. The thing to judge is not who fills the most fields, but who
     correctly leaves one EMPTY when the document never said it - an invented
     "best known for" publishes a claim your user never made. */
  profileImport: {
    provider: 'openrouter',
    model:    'google/gemini-3.5-flash-lite'
  },
  // Where published sites are actually served today (path-based, no custom domain needed).
  // Computed from wherever the builder itself is running, so the share link
  // matches the host that generated it (Netlify build shows a Netlify link,
  // Cloudflare build shows a Cloudflare link) rather than a fixed host — both
  // render the same published site, since they share one Supabase backend.
  // Later, when the domains below have wildcard DNS pointed at a host, switch to subdomain URLs.
  publicBase:   location.origin + '/s/',

  /* ---------- The domain pool ----------
     KDK buys the domains; the user picks one and gets <subdomain>.<domain>.
     ADDING A DOMAIN IS AN EDIT TO THIS ARRAY, nothing else: the publish step
     builds its picker from it, and the picker stays hidden while there is only
     one entry, so the UI does not change until a second domain actually exists.

     Two things must be done outside this file before a new domain works:
       1. Point wildcard DNS (*.<domain>) at the Netlify site.
       2. Add it to the SITE_DOMAINS env var on Netlify, so render.ts will
          answer for it. Leaving it out means the address resolves but 404s.

     `live:false` marks a domain that is bought and listed but not yet wired;
     it renders disabled with a "coming soon" note rather than being offered.
     Order matters: the FIRST entry is the default for new sites.

     ============================================================
     >>> NAMES FINALISED, NOT YET PURCHASED (2026-07-31) <<<
     The four domains below are the real, decided names (replacing the earlier
     casites.in/legalsites.in/taxsites.in placeholders, which were never bought
     either). None of these four are purchased yet, so none have DNS or a
     SITE_DOMAINS entry. Only `kdksites.in` is real end to end, so it is the
     only one marked `live:true`. The other four stay `live:false` ("Coming
     soon", disabled) so the name is visible in the picker without being
     selectable, which would otherwise resolve to nothing.

     TO TURN ONE ON, in this order:
       1. Buy the domain.
       2. Point wildcard DNS (*.<domain>) at the Netlify site (and/or the
          Cloudflare Worker, if that host should serve it too).
       3. Add it to SITE_DOMAINS: the Netlify env var, and `vars.SITE_DOMAINS`
          in wrangler.jsonc (comma-separated), so render.ts / src/index.ts
          answer for it.
       4. Only then flip `live:false` to `live:true` here.
     See backend/README.md, "Adding a domain to the pool".
     ============================================================ */
  siteDomains: [
    { host:'kdksites.in',   label:'Recommended', note:'The general KDK Sites address', live:true  },
    { host:'CAworld.in',    label:'CAworld',      note:'Chartered Accountants',         live:false },  // name finalised, not purchased yet
    { host:'Mycafirm.in',   label:'My CA Firm',   note:'Chartered accountancy firms',   live:false },  // name finalised, not purchased yet
    { host:'caone.ai',      label:'CA One',       note:'Modern, tech-forward practices',live:false },  // name finalised, not purchased yet
    { host:'cadesk.app',    label:'CA Desk',      note:'A clean, app-style address',    live:false }   // name finalised, not purchased yet
  ],

  prettyDomain: 'kdksites.in'   // legacy fallback; siteDomains[0].host wins when present
};

/* ------------------------------------------------------------
   Keep a second reference to these defaults.

   local-ai-config.js loads AFTER this file and ASSIGNS window.KDK_AI outright
   (`window.KDK_AI = {...}`) rather than merging into it, so on a machine that
   has that file every key defined here is wiped: siteDomains, publicBase and
   prettyDomain all vanish. The symptom is subtle and misleading, because the
   builder keeps working on its fallbacks: the domain picker silently
   disappears and share links lose their base URL.

   That file is gitignored, so it cannot be fixed once for everyone. Instead
   index.html backfills from this copy after both scripts have loaded, so a
   local override can only ADD to or REPLACE individual keys, never delete them.
   ------------------------------------------------------------ */
window.KDK_AI_DEFAULTS = window.KDK_AI;
