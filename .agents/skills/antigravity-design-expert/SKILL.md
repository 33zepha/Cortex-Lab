---
name: antigravity-design-expert
description: Cortex-Lab UI/UX engineering skill for premium desktop and mobile product interfaces with strong visual mass, dense information hierarchy, tactile controls and non-generic responsive composition.
risk: safe
source: project
last_updated: "2026-08-07"
---

# Antigravity — Cortex UI/UX Design Expert

## Mission

Build Cortex as a mature **editorial technical instrument**: precise, tactile, calm, dense but breathable, technical and human.

The interface must remain recognizably Cortex even if the logo is removed. Desktop remains the source of truth for visual quality; mobile is a deliberate recomposition of that language, never a generic iPhone translation.

## Systems thinking — highest priority

Cortex is a system, not a gallery of components.

Design information architecture before individual surfaces.

Non-negotiable rules:
- **One piece of information should have one canonical visual home.** Do not repeat the same runtime, status, metric or entity merely to fill another card.
- Prefer relationships, alignment, sequence and separators over containers.
- A card is an exception used for true containment, not the default layout primitive.
- Do not invent a new visual component when an existing row, section, inspector or hierarchy can express the information.
- New engines, agents, workers, storage layers or transports should extend an existing system structure naturally rather than create another dashboard tile.
- If removing borders/backgrounds makes the hierarchy collapse, the hierarchy was not strong enough.
- Design for future scale: 2 engines today may become 12; 1 worker may become a fleet; a mission may produce hundreds of events. Avoid compositions that only look good with fixture-sized data.

Before adding a surface, ask:
1. Is this information already represented elsewhere?
2. Is containment semantically necessary?
3. Could spacing, typography, a divider or column alignment solve this instead?
4. Does this pattern scale when the dataset triples?

## Core design language — non-negotiable

### Visual mass
- Preserve strong typography, bold metrics, substantial icons and deliberate structure.
- **Compact, not thinner. Dense, not flatter. Mobile, not generic.**
- Solve density through composition, spacing and prioritization before shrinking font weights.
- Important labels, values and actions must have confident optical weight.

### Buttons
- Buttons retain desktop-quality physicality: strong type, substantial icons, precise borders and clear pressed states.
- Avoid thin generic outline buttons and tiny system-text actions for important operations.
- Minimum mobile touch target: 44px where practical.
- Primary actions must be explicit; never depend on hover to reveal their meaning.
- Do not use color simply to make an action feel important. Geometry, hierarchy and text should do most of the work.

### Iconography
- Prefer Heroicons Solid or equivalent substantial forms for navigation and anchors.
- Lucide icons generally use `strokeWidth≈2.7–3.2` when paired with solid icons.
- Avoid delicate SF-Symbol-like line work, tiny floating glyphs and inconsistent icon weights.
- Do not automatically place every icon inside a rounded translucent square. Bare icons are often more precise.

### Typography
- Boldness is part of Cortex. Do not neutralize it.
- Strong page titles, metric numerals and primary labels are desirable.
- Avoid repeating heavy uppercase + wide tracking everywhere. Reserve uppercase for compact technical eyebrows.
- Never truncate primary KPI labels. Recompose the layout or shorten the copy.

## Surfaces, depth and motion

- Use glass/translucency selectively, not as a default treatment for every rectangle.
- Default content structure should be typography + spacing + rules/dividers.
- Preserve tactile depth mainly for navigation, dialogs and important actions.
- Avoid excessive blur, giant shadows, giant radii and nested glass cards.
- Decorative dotted textures, glows and gradients are rare accents, never structural scaffolding.
- Do not animate surfaces merely because Framer Motion is available.
- Page entrance motion should normally be opacity-only or extremely subtle.
- Avoid hover/tap scale on ordinary rows and cards; scale implies physical movement and quickly creates prototype/demo aesthetics.
- Respect `prefers-reduced-motion`.

## Mobile — genuine recomposition

Mobile is not desktop squeezed into 390px and not a standard iOS CRUD template.

### Layout targets
- Horizontal page padding: ~16–20px.
- Section gaps: ~18–28px depending on hierarchy.
- Bottom control dock: roughly 60–68px visual height plus safe area.
- Content must reserve dock height + safe-area + >=20px at the bottom.
- Test at minimum: 375×667, 390×844, 393×852, 430×932.
- Zero horizontal overflow, clipped primary text, dock overlap or modal clipping.

### Page headers
- No giant dead space.
- Low-opacity watermark icons are part of Cortex and may remain on mobile when they sit behind hierarchy rather than consume layout space.
- Title + primary action should usually share the top line when space permits.

### Navigation
- Keep the Cortex control-dock character; do not replace it with a generic iOS tab bar.
- Active navigation state uses integrated geometry/surface treatment, not a decorative status dot.
- Respect safe areas and never cover content.

### Command palette
- Desktop may use a floating command window.
- Mobile uses a deliberate full-screen command surface with safe-area support and no horizontal clipping.
- Search and close controls remain explicit and tactile.
- Focus and software-keyboard interactions must never zoom, recenter or shift the whole app.

### Information density
- Prefer canonical lists, streams, tables and timelines over stacking cards vertically.
- Mission information dominates Overview; infrastructure is secondary.
- A mission row must not look like a settings row.
- System data should read like an instrument panel/document, not a bento showcase.

## Status presentation — banned slop patterns

Do **not** litter Cortex with generic pastel status pills or tiny colored dots:
- `[● ONLINE]`
- `[● ACTIVE]`
- `[● HEALTHY]`
- `[● READY]`
- `[● CONNECTED]`

Status should normally be integrated through:
- strong status text,
- icon state,
- local color treatment,
- an edge/rule when semantically justified,
- or the data itself.

Colored dots remain acceptable only when they are genuine data marks or legends.

## Explicit anti-template rules

Avoid:
- Apple Settings clones,
- generic fintech/mobile SaaS layouts,
- page title → search → segmented pills → rounded rows → tab bar as an automatic recipe,
- pastel status pills,
- random colored dots,
- blue/purple AI gradients,
- gradient blobs,
- frosted glass everywhere,
- huge pill radii,
- identical card grids,
- repeated icon + label + chevron rows,
- grey sublabel under every title,
- oversized decorative whitespace,
- indiscriminate rounded rectangles,
- badges used as decoration,
- dashboard sections that repeat data already shown above,
- decorative KPIs whose only purpose is to fill four columns,
- card-per-provider / card-per-agent patterns that collapse when the system scales.

Every visual device must earn its place.

## Screen architecture

### Overview
Overview answers, in order:
1. What requires attention now?
2. What is Cortex executing or what did it execute most recently?
3. What changed recently?
4. What is the current usage/resource situation?

Prefer information bands and canonical mission/activity streams over unrelated widgets.
Overview references System; it does not duplicate the complete System page.

### Missions
- Header exposes creation and search without permanent visual noise.
- Filters are controls, not status pills.
- Mission rows are dense, strong and scannable.
- Mission list and Overview mission stream should share the same semantics and status vocabulary.

### Mission detail
Read as an execution trace:
**objective → state → chronology → outputs → evidence**.

- The mission objective is dominant.
- Timeline is the core narrative.
- Files, tests, evidence and patch are outputs of that narrative, not separate dashboard cards.
- Inspector is contextual, not decorative.
- Avoid nested containers inside tabs; prefer rows and dividers.

### System
System is a canonical infrastructure document.

Structure:
- Runtime
- Engines
- Data / transport
- Incidents

Rules:
- Do not create a separate summary card that repeats the same runtime/engine data again below.
- Engines are comparable rows in one extensible structure, not one branded card per provider.
- Branding may live in the engine mark/icon; structure remains consistent.
- Ledger, storage and SSE are canonical diagnostic rows.
- New engines/workers should append naturally without redesigning the page.
- Human uptime formatting: `16 min`, `1 h 24`, `3 j 4 h`, never misleading `0 h`.

## Execution protocol

Before coding:
1. Inspect current desktop and mobile composition.
2. Map canonical information ownership: which screen/section owns each fact?
3. Identify duplication and container inflation.
4. Verify the structure can scale to more agents, missions, events and providers.
5. Preserve Cortex typography, icon weight, button quality and watermark language.

After coding:
1. Run typecheck/build/tests relevant to the change.
2. Inspect target mobile sizes when tooling permits.
3. Verify no horizontal overflow, clipped text, keyboard zoom or dock overlap.
4. Verify primary actions are usable without hover.
5. Remove any surface whose only purpose is visual decoration.
6. Ask: **If backgrounds, shadows and radii were removed, would the information architecture still make sense?** If no, revise.
7. Ask: **If the Cortex logo disappeared, would this still look like the same product?** If no, revise.

## Final quality bar

Target:
> a compact, tactile, editorial control instrument with a coherent information architecture.

Not:
> a collection of premium-looking components.

Not:
> a beautiful generic iPhone app.

Not:
> a clean SaaS dashboard.
