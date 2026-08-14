# Cortex design research corpus

This directory is the working research layer for the public Cortex landing-page refonte.

It is not a copied moodboard and it is not a license to reproduce external websites. It records:

- where to look;
- what each source is useful for;
- which patterns are relevant to Cortex;
- which patterns must be rejected;
- how references become original Cortex decisions.

## Source of truth

The existing pixel-art blue hero remains the absolute visual reference:

- implementation: `src/screens/HeroLabScreen.tsx`;
- active hero styles: `src/screens/HeroLabScreen.css`;
- visual contract: `docs/cortex-visual-language.md`;
- machine-readable corpus: `docs/design-research/reference-database.json`;
- agent-facing contract: `DESIGN.md`.

The research corpus can enrich the rest of the landing page. It cannot authorize a hero redesign or a second visual language.

## What was researched

The initial pass covered the galleries supplied in the brief:

- [Inspora](https://inspora.design/) — kept as a candidate source because the current crawl was unavailable.
- [posts.design](https://posts.design/) — social and announcement composition.
- [loadmo.re](https://loadmo.re/) — alternative mobile-web composition.
- [Refero Styles](https://styles.refero.design/) — agent-readable visual systems.
- [Recent](https://recent.design/) — daily design, web, branding, typography and motion curation.
- [60fps](https://60fps.design/) — interaction and motion references.
- [Supahero](https://supahero.io/) — hero-section references, now part of ScreensDesign.
- [Navbar Gallery](https://www.navbar.gallery/) — navigation patterns.
- [CTA.gallery](https://www.cta.gallery/) — action, form and conversion patterns.

The research layer also adds sources that close important gaps:

- [Refero](https://refero.design/) and [Mobbin](https://mobbin.com/) for real product screens and flows;
- [designmd.app](https://designmd.app/) for the DESIGN.md format and agent-readable context;
- [Landing.Gallery](https://www.landing.gallery/about) and [Land-book](https://land-book.com/) for complete landing-page rhythm;
- [Footer Design](https://www.footer.design/) for closing compositions;
- [SiteInspire](https://www.siteinspire.com/) and [Typewolf](https://www.typewolf.com/) as secondary candidates for web layout and typography research.

## How to use the database

Before changing public landing UI:

1. Read `DESIGN.md`.
2. Read `docs/cortex-visual-language.md`.
3. Search `reference-database.json` by design job: hero, nav, CTA, motion, mobile, typography, rhythm or closing.
4. Extract a principle and a reason, not a screenshot or a template.
5. State the Cortex translation before coding.
6. Check the result against the rejection filters and the unchanged hero.

Useful design jobs:

- hero composition and message/image balance: Supahero, Land-book, Landing.Gallery;
- mobile composition: loadmo.re, Mobbin, Refero;
- motion: 60fps, Recent;
- navigation: Navbar Gallery, Refero;
- CTAs and forms: CTA.gallery;
- typography: Recent, Land-book, Typewolf;
- section rhythm: Landing.Gallery, Land-book;
- closing and footer: Footer Design;
- persistent agent context: Refero Styles, designmd.app.

## Research policy

The repo stores links, metadata, tags and original analysis. It does not mirror the galleries or download their screenshots by default.

External screenshots and site assets remain the property of their original creators. If a future reference has an explicit reusable license, record that license and attribution beside the extracted material. The DESIGN.md examples on designmd.app are reported as CC BY 4.0 in its terms; any copied file must retain attribution.

## Working rule

The corpus exists to prevent visual drift and generic AI output.

The result still has to be Cortex:

- one authored visual field;
- light, spacious, image-led composition;
- Cortex Inter hierarchy;
- precise capsules only where inherited from the hero;
- irregular pixel material;
- calm, purposeful motion;
- no generic SaaS cards, feature grids, visible columns, separators, dashboard chrome, arbitrary gradients or cyberpunk clichés.
