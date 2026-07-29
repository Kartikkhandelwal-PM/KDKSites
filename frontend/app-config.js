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
  anthropic: { model: 'claude-opus-4-8' },
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
     >>> PLACEHOLDERS, kept on purpose (2026-07-28) <<<
     Only `kdksites.in` is real. The other three are not bought, have no DNS and
     are not in SITE_DOMAINS, so a site published to one of them would sit at an
     address that never resolves.

     They stay in the list because the picker is worth showing, but every one of
     them is `live:false`, which renders it as "Coming soon" and DISABLED. That
     matters more now than it did: a published site can change its address, and a
     selectable dead domain would let someone move a working site to nowhere and
     release their old address at the same time.

     TO TURN ONE ON, in this order:
       1. Buy the domain.
       2. Point wildcard DNS (*.<domain>) at the Netlify site.
       3. Add it to the SITE_DOMAINS env var on Netlify, so render.ts answers for it.
       4. Only then flip `live:false` to `live:true` here.
     See backend/README.md, "Adding a domain to the pool".
     ============================================================ */
  siteDomains: [
    { host:'kdksites.in',   label:'Recommended',   note:'The general KDK Sites address', live:true  },
    { host:'casites.in',    label:'For CAs',       note:'Chartered Accountants',         live:false },  // not bought yet
    { host:'legalsites.in', label:'For Advocates', note:'Advocates and legal practices', live:false },  // not bought yet
    { host:'taxsites.in',   label:'For Tax Pros',  note:'Tax consultants and GST',       live:false }   // not bought yet
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
