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
| `templates/` | The 4 renderers that get published. |
| `design-samples/` | The pristine originals. See below. |

## `templates/` vs `design-samples/`

These hold the same four designs at two different stages.

**`design-samples/<key>/index.html`** is the pristine design as originally built:
hard-coded demo firm, demo copy, no builder wiring at all.

**`templates/<key>/index.html`** is that same file **plus a binding script** that
defines `window.__applyConfig(config)`. That function rewrites the nav, hero,
stats, services, about, founder, process, testimonials, contact, footer, social
links, WhatsApp button, colours and title from the user's saved config. For Apex
that binding is roughly 360 added lines.

`templates/` is what gets served. `backend/netlify/edge-functions/render.ts`
fetches `/templates/<key>/index.html`, injects the saved config, and calls
`__applyConfig`.

### `design-samples/` is currently loaded by nothing

Each entry in the `DESIGNS` array in `index.html` carries two paths:

```js
{key:'apex', …, path:'design-samples/apex/index.html', live:'templates/apex/index.html'}
```

Both places that consume them resolve `d.live || d.path` — the Step 2 preview
iframe, and `openPreview()`. All four designs have a `live:`, so `path:` never
wins. Even the magnifier button on a design card, which calls
`openPreview(key, true)` ("sample mode"), loads the **live** template; sample mode
only changes the label to "(sample design)" and skips applying the user's edits.

So `design-samples/` is a **fallback that never fires**. Its remaining value is as
a reference original: the design's native look without builder instrumentation,
and the file you would copy when adding a fifth design.

### Caveat: the samples have drifted

Fixes have been landing in `templates/` only. For Apex, ~75 lines differ beyond
the binding script, so the "pristine original" is no longer a faithful copy of
what ships. Either re-sync the samples from `templates/` (stripping the binding
script) or retire the folder and delete the dead `path:` field. This is tracked as
an open question in [../docs/DEV-LOG.md](../docs/DEV-LOG.md).

## Adding a fifth design

1. Drop the design in `design-samples/<key>/`.
2. Copy it to `templates/<key>/` and append a binding `<script>` following the
   Apex pattern, remapping selectors.
3. Add one entry to the `DESIGNS` array in `index.html` with `path` + `live`.
4. Add `<key>` to the template allow-list in `render.ts`, which currently hard-codes
   `["apex", "nova", "heritage", "zenith"]` and silently falls back to `apex`.
