# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One site, four audiences. The site has to hold up for all of them at once:

- **Recruiters and hiring leads** judging Belhal for senior ML and technical-leadership roles. They look at industry impact, the resume and scope of work.
- **Researchers and academics** looking up papers, talks, software and teaching. They want Scholar-grade credibility and working links to PDFs, code and proceedings.
- **Founders and startups** judging Belhal as an advisor. They look at advisory roles and the exits (Monk AI → ACV Auctions, Brainattic → Master The Monster).
- **People who already know Belhal.** The site is also a personal home base, so personality (basketball, Nike, music) matters as much as credentials.

## Product Purpose

The personal site of Belhal Karimi, Principal Data Scientist at Nike, Inc. (Portland, OR). It is the one canonical, current record of his research, industry work, advisory, software, talks, teaching, education, awards and music. Success means each audience finds its evidence quickly, and the site comes across as professional and distinctly his.

## Positioning

The site connects three things: a research career (Ph.D. at Ecole Polytechnique and INRIA, 15+ papers at ICLR, NeurIPS, UAI, COLT, ACML and others), principal-level industry ML leadership at Nike (GenAI for footwear and product design, Search Match & Rank), and advisory roles that ended in acquisitions. A personal basketball/Nike identity runs through all of it.

## Operating Context

- Static multi-page site built with Vite and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `master` (the `dist` output is not tracked).
- Pages: home (`index.html`, with a Three.js courtside/basketball piece in `src/basketball.js` and a Kobe Bryant GLB model) plus section pages under `public/`: research, talks, industry, advisory, software, awards, teaching, education, music. Shared assets: `public/site.css` and `public/site.js`, hashed at build time by `scripts/hash-shared-assets.mjs`.
- `/resume/` is a data-driven resume rendered from `public/resume/data/*.json`.
- `src/` (the React app and data modules) is kept on purpose. Do not treat it as dead code.
- `/bath/` and `/flowerbed/` are private home-project utilities hosted on the same domain. They are outside the portfolio's product and design scope.
- `legacy_site/` is the old site, kept for history.

## Capabilities and Constraints

- Every piece of existing content and every outbound link stays: papers, talks, entries, PDFs, Scholar/GitHub/LinkedIn/SoundCloud/Instagram/Twitter.
- Never show a photo or avatar of the owner, anywhere.
- The existing theme is the user's. Refinements should standardize and professionalize it, not replace it.
- Validation: `npm run build`, `npm run lint`. There are no automated tests.

## Brand Commitments

- Name: Belhal Karimi. Role line: Principal Data Scientist at Nike, Inc.
- The basketball/courtside motif, the Kobe 3D piece and the Nike identity (script logo, Air favicon) are intentional personal signatures and stay.
- The current theme, including its palette and overall look, is binding. The user has asked for a fully standardized type system (consistent font families and a disciplined size scale) and small UI refinements that make the site feel more professional, without changing the theme.

## Evidence on Hand

- Bio, news and about blurbs: `src/data/bio.js`, plus the section data in `src/data/*.js`.
- Resume data: `public/resume/data/*.json`.
- Paper PDFs and thumbnails: `public/assets/downloads/`, `public/assets/paperthumb/`. Company logos: `public/assets/industry/`.
- The site has no testimonials, quotes or metrics beyond those already in the resume and bio data, and none should be invented.

## Product Principles

1. **Evidence first.** Every claim links to its proof: a paper, a talk, a repo or a company.
2. **One site, four readers.** Credentials stay easy to scan for recruiters, researchers and founders, and the personal side stays.
3. **Preserve, then polish.** Content, links and theme are fixed. Improvements come from consistency and precision.
4. **Personal signature, professional finish.** The basketball/Nike identity is a feature and should be executed with care, not hidden.
