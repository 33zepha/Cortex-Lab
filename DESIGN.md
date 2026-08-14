---
name: Cortex Visual System
version: 0.2
status: active-reference
sourceOfTruth: existing-pixel-art-blue-hero
colors:
  canvas: "#F7FBFF"
  ink: "#171C2C"
  mutedInk: "rgba(25, 31, 51, 0.74)"
  accent: "#586AF2"
  accentDeep: "#4054E8"
  accentLight: "#AEB7FF"
typography:
  display:
    family: "Cortex Inter"
    weight: 630
    tracking: "-0.068em"
  body:
    family: "Cortex Inter"
    weight: 470
spacing:
  pageGutter: "24px"
  navigationTop: "20px"
  quietScale: ["24px", "48px", "80px", "120px"]
shapes:
  capsule: "999px"
  defaultRadius: "0"
---

# Overview

Cortex is an image-led, light and spacious operating-intelligence brand.

The existing pixel-art blue hero is the absolute visual authority. The rest of the public landing page must be derived from its:

- blue atmospheric pixel material;
- deep ink typography;
- white translucent capsule navigation;
- dark capsule CTA;
- large quiet fields;
- centered, deliberate hierarchy;
- calm reveal motion.

This file is an implementation contract for agents. It does not authorize a hero redesign.

## Source files

- Hero component: `src/screens/HeroLabScreen.tsx`
- Hero and landing shell styles: `src/screens/HeroLabScreen.css`
- Landing section component: `src/landing/LandingSections.tsx`
- Landing section styles: `src/landing/landing-sections.css`
- Existing visual specification: `docs/cortex-visual-language.md`
- Research database: `docs/design-research/reference-database.json`
- Research protocol: `docs/design-research/README.md`

Read the visual specification and research corpus before changing the public landing page.

## Colors

- Canvas is a pale blue-white field, not a stack of competing section backgrounds.
- Primary ink is deep blue-black: #171C2C.
- Cortex blue is the only UI accent family: #4054E8, #586AF2 and #AEB7FF.
- The hero image may contain its own authored blue and white range.
- Use the accent sparingly for emphasis, not as a gradient system.

Do not introduce cyan, emerald, neon green, hot pink, orange or unrelated purple gradients into the landing page.

## Typography

- Use Cortex Inter as the single public landing voice.
- Let scale, line breaks, weight and whitespace create hierarchy.
- Display hierarchy is broad and quiet, close to the hero's 630 weight and tight tracking.
- Supporting copy stays restrained, readable and subordinate.
- Small uppercase labels are metadata only, never the main structure.

The lower landing styles still contain legacy typography that is scheduled for removal. Do not add more fonts or extend that legacy.

## Layout

- One dominant focal point per view.
- One continuous canvas; sections are moments in a single field, not boxes.
- Large empty space is intentional.
- Use an invisible rhythm without exposing a grid.
- Content can be centered or deliberately offset, but never arranged like a dashboard.
- Mobile is a recomposed version of the same language, not a compressed desktop grid.
- Preserve safe-area behavior and avoid horizontal overflow.

## Elevation and depth

Depth comes from the hero image, pixel density, whitespace, opacity and restrained atmospheric drift.

Do not use dashboard panels, heavy shadows, glassmorphism layers, floating metric cards or generic 3D UI to manufacture depth.

## Shapes

The hero establishes an exception-based shape language:

- full capsule for the navigation shell;
- full capsule for the primary CTA;
- small capsule outline for the scroll cue;
- approved Cortex mark geometry.

Everything else should be square, open or shape-free unless a later decision is explicitly recorded in the research corpus.

Do not create a rounded-card system.

## Components

### Navigation

Keep the existing capsule navigation proportion, hierarchy and responsive behavior. It is a quiet orientation device, not a component showcase.

### Actions

Use one clear action per moment. Preserve the hero's dark capsule CTA language when the action is primary. Avoid CTA clusters, status badges and conversion widgets.

### Pixel material

Pixel is a material signature. Use irregular, atmospheric, spatially masked texture with large quiet areas.

Reject uniform dot grids, repeated tiled patterns, indiscriminate noise, scanlines, holograms, glitches and cyberpunk circuitry.

### Motion

Motion should reveal, breathe or guide:

- smooth ease-out;
- low amplitude;
- readable sequencing;
- reduced-motion support.

Do not add motion merely to prove that the page is animated.

## Research corpus

The research database is organized by design job rather than by random inspiration:

- hero and page rhythm;
- mobile composition;
- motion and micro-interaction;
- navigation;
- CTA and forms;
- typography;
- closing and footer;
- agent-readable design context.

Use external references as evidence and constraints. Do not reproduce a source site's layout, copy, screenshots or assets.

## Cortex rejection filter

Reject any element that relies on:

- generic SaaS cards;
- feature grids;
- visible columns;
- separators or decorative rules;
- dashboard-like UI;
- provider or logo rails presented as a UI component;
- generic badges or metric chips;
- arbitrary gradients;
- excessive rounded rectangles;
- AI/cyberpunk visual clichés;
- a second display-font system;
- regular dot grids pretending to be pixel material.

Final test:

> Could this element be dropped into a generic AI SaaS template without changing its meaning?

If yes, re-author it or remove it.

## Preservation rule

Before every public landing change:

1. Keep the hero image, crop, hierarchy, navigation, CTA, logo and responsive behavior unchanged.
2. Derive new primitives from that hero and this file.
3. Document the reference and the Cortex translation.
4. Inspect desktop and mobile output.
5. Stop if the lower section starts competing with the hero.
