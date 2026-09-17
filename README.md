# The Author's Table: design reference

Design mockups for the PJK book launch site, hosted via GitHub Pages.

These are design mockups created in a visual design tool (an appifact
design canvas), exported as standalone pages. Treat them as REFERENCE
MOCKUPS, not production code: the markup and inline styles carry the
design's precise values (colors, font sizes, spacing, radii, shadows,
layout), which an implementation should replicate faithfully in its own
components and styling system rather than copy wholesale.

## Contents

- `index.html`: the landing page (a Design Component: an `<x-dc>`
  template + a small logic class). The values to replicate live in its
  inline `style="…"` attributes and the `<helmet><style>` block.
- `support.js`, `vendor/react*.js`: the runtime that renders the
  component in a browser; not part of the design.
- `book-discussion/`: the book discussion + quote share mockup, linked
  from the landing page's "Join discussion" buttons. See its own
  README for details.

## Viewing

Serve the repo root (e.g. `python3 -m http.server`) and open
`index.html`; some browsers block the scripts over file://.
