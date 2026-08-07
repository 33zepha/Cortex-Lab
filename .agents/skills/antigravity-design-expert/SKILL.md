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

The interface must remain recognizably Cortex even if the logo is removed. Desktop is the source of truth for visual quality; mobile is a deliberate recomposition of that language, never a generic iPhone translation.

## Core design language — non-negotiable

### Visual mass
- Preserve strong typography, bold metrics, substantial icons and structured surfaces.
- **Compact, not thinner. Dense, not flatter. Mobile, not generic.**
- Solve density through composition, spacing and prioritization before shrinking font weights.
- Important labels, values and actions must have confident optical weight.

### Buttons
- Buttons must retain desktop-quality physicality: strong type, substantial icons, precise borders, controlled highlights/shadows and a clear pressed state.
- Avoid thin generic outline buttons and tiny system-text actions for important operations.
- Minimum mobile touch target: 44px where practical; compact controls may visually occupy less space while retaining a safe hit target.
- Mobile primary actions must be explicit; never depend on hover to reveal their meaning.

### Iconography
- Prefer Heroicons Solid or equivalent substantial forms for navigation and anchors.
- Lucide icons must use a strong optical stroke, generally `strokeWidth≈2.7–3.2` when paired with solid icons.
- Avoid delicate SF-Symbol-like line work, tiny floating glyphs and inconsistent icon weights.

### Typography
- Boldness is part of Cortex. Do not neutralize it.
- Strong page titles, metric numerals and primary labels are desirable.
- Avoid repeating heavy uppercase + wide tracking everywhere. Reserve uppercase for compact technical eyebrows and section anchors.
- Never truncate primary KPI labels. Use mobile-specific copy or recompose the layout.

## Surfaces, depth and motion

- Use glass/translucency selectively, not as a default treatment for every rectangle.
- Preserve tactile depth with restrained borders, inner highlights and soft shadows.
- Avoid excessive blur, giant shadows, giant radii and nested glass cards.
- Decorative dotted textures, glows and gradients are accents, not wallpaper. They should generally disappear or become quieter on mobile.
- Motion uses calibrated spring/ease curves and subtle press feedback. Avoid cartoon bounce and gratuitous parallax.
- Respect `prefers-reduced-motion`.

## Mobile — genuine recomposition

Mobile is not desktop squeezed into 390px and not a standard iOS CRUD template.

### Layout targets
- Horizontal page padding: ~16–20px.
- Section gaps: ~16–24px depending on hierarchy.
- Common mobile card padding: ~16–18px.
- Bottom control dock: roughly 60–68px visual height plus safe area.
- Content must reserve `dock height + safe-area + >=20px` at the bottom.
- Test at minimum: 375×667, 390×844, 393×852, 430×932.
- Zero horizontal overflow, clipped primary text, dock overlap or modal clipping.

### Page headers
- No giant dead space.
- Decorative watermark icons belong to desktop unless they materially improve mobile hierarchy.
- Mobile title + primary action should usually share the top line when space permits.

### Navigation
- Keep the Cortex control-dock character; do not replace it with a generic iOS tab bar.
- Active navigation state should use integrated geometry/surface treatment, not a decorative status dot.
- Respect safe areas and never cover content.

### Command palette
- Desktop may use a floating command window.
- Mobile must use a deliberate full-screen command surface (`100vw`, `100dvh`, safe-area aware) with no horizontal clipping.
- Search and close controls must remain explicit and tactile.

### Information density
- System/diagnostic cards should usually be 25–40% shorter on mobile than naive desktop stacking.
- Prefer compact status cards and intelligent grids without turning everything into identical list rows.
- Mission information dominates Overview; infrastructure is secondary.
- A mission card must not look like a settings row. A system diagnostic must not look like a mission card.

## Status presentation — banned slop patterns

Do **not** litter Cortex with generic pastel status pills or tiny colored dots:

- `[● ONLINE]`
- `[● ACTIVE]`
- `[● HEALTHY]`
- `[● READY]`
- `[● CONNECTED]`

Status should normally be integrated through:
- strong status text,
- an icon state,
- a border/accent edge,
- local color treatment,
- the data itself,
- or a small structural indicator that is not a decorative sticker.

Colored dots remain acceptable when they are genuine data visualization marks or chart legends, not generic AI-dashboard status decoration.

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
- huge 24–32px pills for every control,
- identical card grids,
- repeated icon + label + chevron rows,
- grey sublabel under every title,
- oversized decorative whitespace,
- indiscriminate rounded rectangles,
- badges used as decoration.

Every visual device must earn its place.

## Mobile screen intent

### Overview
Hierarchy should read roughly:
1. current mission/product situation,
2. KPI cockpit,
3. recent/active missions,
4. recent activity,
5. token usage,
6. compact infrastructure indicators.

It must not feel like a pile of unrelated widgets.

### Missions
- Header exposes the primary creation action explicitly.
- Search is compact.
- Filters are controls, not status pills.
- Mission rows are dense, strong and scannable with integrated status treatment.

### System
- Core, Claude Code and OpenAI retain their distinct branded cards.
- Remove excessive vertical padding and decorative texture on mobile.
- Status is expressed as text/accent, not standalone dots.
- Uptime formatting is human (`16 min`, `1 h 24`, `3 j 4 h`), never misleading `0 h`.
- Ledger, storage and SSE should be compact diagnostics.

## Execution protocol

Before coding:
1. Inspect the current desktop and mobile composition.
2. Identify the root layout problem rather than treating screenshots as isolated styling bugs.
3. Preserve desktop visual quality and product semantics.
4. Recompose mobile rather than merely shrinking CSS values.

After coding:
1. Run typecheck/build/tests relevant to the change.
2. Capture or inspect the target mobile sizes when tooling permits.
3. Verify no horizontal overflow, clipped text or control-dock overlap.
4. Verify primary actions are usable without hover.
5. Ask: **If the Cortex logo disappeared, would this still look like the same product as desktop?** If no, revise.

## Final quality bar

Target:
> a compact, tactile, editorial control instrument derived directly from Cortex's desktop design system.

Not:
> a beautiful generic iPhone app.

Not:
> a clean SaaS mobile dashboard.
