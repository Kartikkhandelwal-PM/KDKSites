# frontend/

Everything the browser downloads. This folder **is** the published site root, on
both hosts: GitHub Pages uploads it via `.github/workflows/pages.yml`, and Netlify
serves it via `publish = "frontend"` in the root `netlify.toml`.

Because the whole tree moved as a unit in the 2026-07-25 reorg, every relative
path inside it is unchanged and must stay relative. Do not introduce paths
starting with `/` here: they would break local `python3 -m http.server` previews
opened from the repo root.

| Path | What it is |
|---|---|
| `index.html` | The 6-step builder wizard. Self-contained: all CSS/JS inline, no build step, no CDN. |
| `app-config.js` | Public Supabase URL + anon key. Committed on purpose; the anon key is public. |
| `local-ai-config.js` | Local AI overrides. **Gitignored, contains a real key.** `index.html` loads it after `app-config.js`, and tolerates its absence. |
| `assets/` | `ca-india-logo.png` (favicon for the builder and all templates), `kdk-sites-logo.png`. |
| `templates/` | The 4 renderers that get published. See below. |

## `templates/`

One folder per design: `apex`, `nova`, `heritage`, `zenith`. Each is a
self-contained page **plus a binding script** that defines
`window.__applyConfig(config)`. That function rewrites the nav, hero, stats,
services, about, founder, process, testimonials, contact, footer, social links,
WhatsApp button, colours and title from the user's saved config.

These are what get served. `backend/netlify/edge-functions/render.ts` fetches
`/templates/<key>/index.html`, injects the saved config, and calls
`__applyConfig`.

The builder uses them in two places, both via the `live` field on each entry in
the `DESIGNS` array in `index.html`:

- the scaled thumbnail iframe on each Step 2 design card
- the full-page Preview overlay

### There used to be a `design-samples/` folder

Deleted on 2026-07-25. It held a second copy of all four designs: the pristine
original of each, without the binding script. Nothing ever loaded it. Each
`DESIGNS` entry carried both a `path` (samples) and a `live` (templates) field,
and both consumers resolved `d.live || d.path` — so with all four designs having
a `live`, the samples path never won. It had also drifted, with roughly 75 lines
of Apex differing beyond the binding script, so it was no longer a faithful
original either. The dead `path` field was removed from `DESIGNS` at the same
time.

**"Sample mode" is a separate thing and still works.** The magnifier button on a
design card calls `openPreview(key, true)`, which loads the normal
`templates/<key>` renderer but deliberately sends it **no config**, so it shows
its own built-in demo content and native palette. That never depended on the
deleted folder.

## Adding a fifth design

1. Put the design in `templates/<key>/index.html`.
2. Append a binding `<script>` following the Apex pattern, remapping selectors to
   this design's markup. It must define `window.__applyConfig(config)`.
3. Add one entry to the `DESIGNS` array in `index.html`: `key`, `name`, `desc`,
   `badge`, `badgeBg`, `live:'templates/<key>/index.html'`, `sw` (3 swatches),
   `primary`, `accent`.
4. Add `<key>` to the template allow-list in `render.ts`, which hard-codes
   `["apex", "nova", "heritage", "zenith"]` and silently falls back to `apex`.
5. Add its colour palettes to the per-design theme list in `index.html`.

Keep a copy of the design *before* you add the binding script if you want one for
reference, but keep it outside the repo. That is what the old `design-samples/`
folder was for, and it rotted because nothing loaded it.
