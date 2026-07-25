# KDK Sites — Professional Website Builder

A website builder product by **KDK Software** that lets Indian finance and legal professionals (CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, Cost Accountants) create a professional website in minutes through a 6-step wizard.

This repository hosts the **Phase 1 prototype** as static HTML, served via GitHub Pages.

## Live prototype

The prototype is live at:

**https://kartikkhandelwal-pm.github.io/KDKSites/**

The site opens directly on the **6-step website builder** (it is the root `index.html`).

- **Published templates:** `templates/apex`, `templates/nova`, `templates/heritage`, `templates/zenith`

## Repository structure

```
index.html          6-step website builder (the entry point)
app-config.js       Public Supabase config (URL + anon key)
assets/             Brand images (logos, favicon)
templates/          The 4 published site renderers (apex, nova, heritage, zenith)
design-samples/     Pristine design iterations, reference only
supabase/           Migrations + the ai-generate Edge Function
netlify/            render Edge Function, serves published sites at /s/<subdomain>
docs/               PRD, changelog, dev log, backend spec
```

`index.html`, `app-config.js` and `netlify.toml` must stay at the repo root: the
first two are the GitHub Pages entry point and its root-relative script, and
Netlify only reads its config from the root.

## Notes

- All prototypes are self-contained single-file HTML: no build step, no external CDN.
- Open any `.html` file directly in a browser, or view the hosted version above.
