# Cortex — Visual language

Version: 0.1  
Status: reference specification only. This document does not authorize a redesign of the hero.

## 1. Source of truth

The existing pixel-art hero is the visual authority for the public landing page.

Reference implementation:

- Route: \`/\` and \`/hero-lab\`
- Component: \`src/screens/HeroLabScreen.tsx\`
- Hero styles: \`src/screens/HeroLabScreen.css\`
- Approved mark: \`src/components/brand/CortexLogo.tsx\`
- Production reference commit: \`092d041664b8edbafb437b5027f7744f99bccffd\`

The hero must remain visually unchanged while the rest of the landing page is brought into alignment.

## 2. The Cortex principle

Cortex is defined by one authored visual field, one clear message and one controlled signal.

The language is:

- image-led rather than interface-led;
- light, spacious and editorial;
- precise without looking sterile;
- technological through structure and restraint, not through science-fiction decoration;
- pixelated as a material quality, not as a decorative grid;
- calm in motion, with no visual noise competing with the message.

Every future section must feel like it belongs to the same world as the hero before it is considered for implementation.

## 3. Canonical palette

| Role | Canonical value | Rule |
|---|---|---|
| Canvas | #FFFFFF | Default landing surface. |
| Soft canvas | #F7F8FC | Use only for a quiet tonal shift, never as a generic panel. |
| Primary ink | #171C2C | Headlines, primary actions and high-contrast controls. |
| Muted ink | rgba(25, 31, 51, 0.74) | Supporting copy. |
| Deep accent | #4054E8 | Start of the approved logo/accent range. |
| Core accent | #586AF2 | Main Cortex blue. Use sparingly. |
| Light accent | #AEB7FF | Highlight and atmospheric transition only. |
| Logo treatment | #4054E8 → #586AF2 → #AEB7FF | Approved gradient, reserved for the Cortex mark or derived material. |

The landing page must not introduce a second accent family. In particular, cyan, emerald, neon green, hot pink, orange and purple gradients are not part of the Cortex hero language.

The existing global application tokens are not automatically canonical for the landing page. New public landing work must follow this palette even when older app tokens still exist elsewhere in the product.

## 4. Typography

The public Cortex landing uses one typographic voice:

- Font family: Cortex Inter.
- Display weight: approximately 630.
- Hero display size: clamp(52px, 5.8vw, 88px).
- Hero display tracking: -0.068em.
- Hero display line-height: 0.94.
- Supporting copy: 15–16px, weight around 470, line-height around 1.55.
- Supporting copy width: approximately 466px on desktop.
- Small labels: 10–12px, restrained uppercase tracking when needed.

Do not introduce Syne, Rubik, Unbounded, mono labels or a second display font into the public landing. The hierarchy must come from scale, weight, line breaks and whitespace — not from switching typefaces.

## 5. Composition and spacing

The hero establishes these layout rules:

- One dominant focal point per view.
- Content is centered or deliberately offset; it is never arranged as a visible dashboard.
- Large empty fields are intentional and must remain visible.
- Desktop navigation: maximum width 576px, 50px minimum height, approximately 20px from the top.
- Desktop page gutters: approximately 24px.
- Hero copy enters around the upper-middle of the viewport, with the image remaining the primary visual mass.
- Body copy sits roughly 20–26px below the heading.
- CTA sits roughly 24–32px below the body.
- Responsive spacing uses viewport-aware values and safe-area insets.
- Sections may align to a common invisible rhythm, but that rhythm must not become visible columns or a grid.

The preferred scale is broad and quiet: 24px, 48px, 80px, 120px and larger breathing spaces. Dense repeated spacing belongs to the authenticated product, not to the public landing.

## 6. Shapes and components

The hero contains only a few rounded forms:

- Navigation shell: full capsule.
- Primary CTA: full capsule.
- Scroll cue: small capsule outline.
- Cortex mark: approved inline SVG geometry, never a masked rectangle or fallback box.

This is an exception-based system, not a rounded-card system.

Allowed:

- full-radius capsules inherited from the hero;
- a restrained shadow on a floating capsule;
- functional focus states.

Not allowed as default landing language:

- rounded feature cards;
- floating dashboard panels;
- stacked white rectangles;
- status pills and metric badges;
- decorative borders;
- section separators;
- visible vertical or horizontal rules;
- heavy card shadows.

## 7. Pixel material

The hero pixel texture is authored material: irregular, image-based, atmospheric and spatially composed.

Future pixel treatments must follow these constraints:

- prefer real pixel artwork or a carefully composed material layer;
- vary density, scale, opacity and direction;
- use masks so the texture dissolves into the canvas;
- keep the texture subordinate to the message;
- preserve large quiet areas.

Reject:

- uniform dot grids;
- repeated radial-gradient patterns with an obvious tile;
- regular 9px/10px/12px spacing used as decoration;
- pixel noise applied indiscriminately to every section;
- glitch effects, scanlines, holograms or cyberpunk circuitry.

Pixel is Cortex's material signature. It is not an excuse to add ornament.

## 8. Motion

The hero establishes restrained motion:

- smooth ease-out movement;
- soft opacity and position transitions;
- slow atmospheric drift;
- one simple scroll cue;
- reduced-motion support that removes decorative animation without destroying hierarchy.

Future motion should reveal, breathe or guide. It must not shake, glitch, flash, rotate aggressively or behave like a demo of animation technology.

## 9. Responsive behavior

Mobile is the same visual language under tighter conditions, not a separate component system.

Hero rules already established:

- below 720px, hide secondary navigation links;
- retain the capsule navigation and primary action;
- use the image crop around 50% 46%;
- reduce the title to approximately 43–60px;
- keep supporting copy around 14px;
- enlarge the CTA to approximately 48px high;
- below 380px, reduce title and copy again without introducing horizontal scrolling;
- respect safe-area insets;
- preserve the same light canvas, ink, blue accent and pixel material.

Future sections must reflow as compositions. They must not collapse a desktop card grid into a smaller card grid.

## 10. Immediate rejection criteria

A proposed landing element is outside the Cortex language if it relies on:

- a generic SaaS card;
- a feature grid;
- visible columns;
- a dashboard mockup;
- a provider/logo rail presented as a UI component;
- a decorative separator;
- a status badge or metric chip;
- an unrelated gradient;
- a second font system;
- excessive rounded rectangles;
- regular dot grids;
- neon cyberpunk, sci-fi or AI-startup clichés.

The test is simple: if the element could be dropped into any generic AI SaaS template without changing its meaning, it is not yet Cortex.

## 11. Preservation rule

Before any later landing work:

1. Preserve the hero image, crop, hierarchy, navigation, CTA, logo and responsive behavior.
2. Derive new visual primitives from those references.
3. Remove visual inventions that compete with the hero.
4. Validate the result at desktop, tablet and mobile sizes.
5. Do not modify the hero to make an incompatible section fit.

This specification defines the direction for subsequent audits. It does not itself change the visual implementation.
