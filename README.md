# KDK Sites — Professional Website Builder

A website builder product by **KDK Software** that lets Indian finance and legal professionals (CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, Cost Accountants) create a professional website in minutes through a 6-step wizard.

This repository hosts the **Phase 1 prototype** as static HTML, served via GitHub Pages.

## Live prototype

The prototype is live at:

**https://kartikkhandelwal-pm.github.io/KDKSites/**

The site opens directly on the **6-step website builder** (`frontend/index.html`).

- **Published templates:** `frontend/templates/` — apex, nova, heritage, zenith

## Repository structure

```
frontend/           Everything the browser downloads = the published site root
  index.html          The 6-step website builder
  app-config.js       Public Supabase config (URL + anon key)
  assets/             Brand images (logos, favicon)
  templates/          The 4 published site renderers
backend/
  supabase/           BUILT: Postgres migrations + the ai-generate Edge Function
  netlify/            BUILT: render Edge Function, serves published sites at /s/<subdomain>
  spec/               NEVER BUILT: the planned Golang + MySQL backend
docs/               PRD, changelog, dev log, admin notes
netlify.toml        Pinned to the repo root; Netlify reads it from nowhere else
index.html          Not the builder. Fallback redirect to frontend/ (see below)
```

`frontend/` is served as the **site root** on both hosts, so paths inside it need
no rewriting: GitHub Pages uploads it via `.github/workflows/pages.yml`, and
Netlify publishes it via `publish = "frontend"`.

## Setup notes

- **GitHub Pages needs one settings change:** Settings -> Pages -> Source ->
  **GitHub Actions**. Pages' branch mode can only serve the repo root or `/docs`,
  which is why the workflow exists. The root `index.html` redirects to `frontend/`
  so the live URL keeps working until you flip that setting; delete it afterwards.
- **Supabase CLI:** `config.toml` now lives at `backend/supabase/`, so run
  `cd backend && supabase …` or `supabase --workdir backend …`.

## Notes

- All prototypes are self-contained single-file HTML: no build step, no external CDN.
- Preview locally with `cd frontend && python3 -m http.server 8765`.
