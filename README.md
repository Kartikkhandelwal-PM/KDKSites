# KDK Sites — Professional Website Builder

A website builder product by **KDK Software** that lets Indian finance and legal professionals (CAs, Advocates, Tax Consultants, GST Practitioners, Company Secretaries, Cost Accountants) create a professional website in minutes through a 6-step wizard.

This repository hosts the **Phase 1 prototype** as static HTML, served via GitHub Pages.

## Live prototype

Once GitHub Pages is enabled, the prototype is available at:

**https://kartikkhandelwal-pm.github.io/KDKSites/**

- **Builder wizard:** `Admin Panel/website-builder-admin-v4.html`
- **Published templates:** `Live/apex`, `Live/nova`, `Live/heritage`, `Live/zenith`

## Repository structure

```
index.html          Landing page (links to builder + templates + docs)
Admin Panel/        6-step builder wizard prototype
Live/               Published website templates (apex, nova, heritage, zenith)
New Design/         Template design iterations
backend/            API spec + database schema
docs/               PRD, changelog, dev log
```

## Notes

- All prototypes are self-contained single-file HTML: no build step, no external CDN.
- Open any `.html` file directly in a browser, or view the hosted version above.
