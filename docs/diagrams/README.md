# Diagram sources

The PRD's two flow pictures are generated from these files. Keep them in step.

| Source | Image |
|---|---|
| `user-flow-build.mmd` | `../screenshots/user-flow-build.png` |
| `user-flow-live.mmd` | `../screenshots/user-flow-live.png` |

To rebuild one, from this folder:

    curl -sL -o mermaid.min.js https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js
    node ../render-mermaid.js user-flow-build.mmd ../screenshots/user-flow-build.png

`render-mermaid.js` photographs the SVG itself, so no window size has to be guessed. It
prints the aspect ratio, which is the number that matters: at A4 with 2.2cm margins the
text column is 6.61in and the usable height is 9.96in, so anything taller than about
1.5:1 will run off the bottom of a page in the Word export.

These sources are kept here, and not inside the PRD as HTML comments, because a comment
containing a blank line stops being one comment: Word printed the second half as body
text.
