# Page sections

What this repo serves, and what it keeps but does not serve. Last checked 2026-11-01 against a local `npm run build`, not the live VPS.

Status:

- **Live, linked:** served, and in the site navigation.
- **Live, unlinked:** served, but only reachable by knowing the URL. Nothing here is password protected.
- **Not served:** kept in the repo, but not in the build.

## Personal page

`/` is **Live, linked**. Source: `index.html`.

| Page | Status | Source |
| --- | --- | --- |
| `/research/` | Live, linked | `public/research/` |
| `/talks/` | Live, linked | `public/talks/` |
| `/industry/` | Live, linked | `public/industry/` |
| `/advisory/` | Live, linked | `public/advisory/` |
| `/software/` | Live, linked | `public/software/` |
| `/awards/` | Live, linked | `public/awards/` |
| `/teaching/` | Live, linked | `public/teaching/` |
| `/education/` | Live, linked | `public/education/` |
| `/music/` | Live, linked | `public/music/` |
| `/resume/` | Live, linked | `public/resume/` |

## Bath

`/bath/`: **Live, unlinked**. Source: `public/bath/`.

## Flowerbed

`/flowerbed/`: **Not served**. Source: `apps/flowerbed/`.

To re-enable it, move the folder back to `public/flowerbed/` and add `flowerbed` to the page list in `vite.config.js`.

## My Bento

`/my-bento/`: **Live, unlinked**. Source: `apps/my-bento/`.

## Model:Cycles Studio

`/modelcycle/`: **Live, unlinked**. Source: `apps/modelcycle/`.

Saving projects on the VPS is deferred: see `PLAN-modelcycle-backend.md`.

## Other served paths

These are side effects of the build rather than sections of the site.

| Path | Status | Notes |
| --- | --- | --- |
| `/public/<page>/` | Live, unlinked | Duplicate of each of the nine section pages, which excludes `/resume/`. Created because the build uses their `public/` paths as inputs |

## Not served

| Path | Notes |
| --- | --- |
| `legacy_site/` | The old site, kept for history |
| `src/` React app | Kept on purpose. The home page only loads `src/basketball.js` from this folder |
