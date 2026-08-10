# Inside Cortex — architecture journey plan

## Intention

The landing should explain Cortex by making the visitor travel through the system itself:

> One objective enters. Hermes coordinates the available intelligence. Purposeful agent teams execute. The work is reviewed in a loop. A human receives a verified result and gets time back.

This is a visual explanation of the product, not a fake AI conversation, a dashboard demo or a decorative sci-fi tunnel.

## Five checkpoints

### 01 — Cortex

**Role:** explain the product in a few words before showing its machinery.

**Suggested copy**

- Eyebrow: `THE OPERATING LAYER`
- Title: `One objective. Every capability aligned.`
- Body: `Cortex turns complex work into one directed, inspectable system.`

**Visual**

The approved Cortex mark is alone at the centre. The camera slowly enters the negative space between its two forms. That negative space becomes the continuous architectural path used by the following frames.

### 02 — Hermes

**Role:** show the control layer that coordinates access to the model and CLI ecosystem.

**Suggested copy**

- Eyebrow: `THE CONTROL LAYER`
- Title: `Hermes routes the right intelligence.`
- Body: `One operating layer coordinates Claude, Codex, DeepSeek, Gemini, Mistral and the rest of the stack around the mission.`

**Visual**

Hermes sits at the centre of the same path. The real provider marks appear as a small, calm ring around it:

- Claude / Anthropic
- Codex / OpenAI
- DeepSeek
- Gemini / Google
- Mistral

The marks must be official or brand-provided SVG assets, reduced to one consistent monochrome treatment. They should be recognisable without becoming a logo wall. The scene must also distinguish connected providers from planned integrations in the product copy; displaying a logo must not imply unsupported production functionality.

### 03 — Teams

**Role:** make clear how a CLI command, API request or connected key becomes organised work.

**Suggested copy**

- Eyebrow: `THE WORKFORCE`
- Title: `A brief becomes a team.`
- Body: `CLI and API access feed one mission. Hermes selects the capabilities, assigns clear roles and gives each agent the context it needs.`

**Visual**

One objective enters the centre and unfolds into a deliberately small team around it:

- Planner — defines the route and dependencies
- Researcher — gathers and checks context
- Builder — produces the work
- Reviewer — challenges the result

The agents should appear as architectural positions on the contour, not as floating chatbot avatars. Every connection needs a meaning: assignment, dependency, hand-off or return. No random swarm of dots.

### 04 — Review loop

**Role:** show why the output is more reliable than a one-shot generation.

**Suggested copy**

- Eyebrow: `THE QUALITY LOOP`
- Title: `Every result is challenged before it ships.`
- Body: `Cortex compares the work with the objective, constraints and evidence, then sends it back through the loop when something is missing.`

**Visual**

The team converges into one visible review loop:

`produce → inspect → test → revise → inspect`

The loop must be readable as a sequence, not just a glowing circle. Show one controlled return path and one clear quality gate. The final state should feel ship-ready and inspectable, not “magically perfect”. Human validation remains visible wherever the decision is sensitive.

### 05 — Human result

**Role:** finish on the value delivered to the person who owns the work.

**Suggested copy**

- Eyebrow: `THE HANDOFF`
- Title: `You get the result — and the time back.`
- Body: `Cortex returns the work, its evidence and the decisions that matter, so people spend less time coordinating and more time moving the business forward.`

**Visual**

All paths resolve into one calm deliverable at the centre: a result, a concise summary and its evidence. The architecture folds back into the Cortex mark. Show value through labels such as `time recovered`, `coordination reduced` and `cost avoided`; do not invent numerical savings before the product has real measurements.

## Motion and composition rules

1. Keep the composition central. No left-copy/right-visual split.
2. Keep the approved logo as the visual anchor, not a repeated decorative stamp.
3. Preserve one continuous path between checkpoints so the visitor understands that each stage is the next state of the same system.
4. Use one dominant motion per frame: enter, route, assign, review, resolve.
5. Prefer camera scale, masking, material growth and controlled morphing over particles, neon beams, orbiting UI or fake terminal metadata.
6. Keep the centre calm. Complexity belongs to the contour and only appears when the explanation requires it.
7. Replace the current generic left progress rail with a quiet bottom-centre chapter index. It should show `01 Cortex · 02 Hermes · 03 Teams · 04 Review · 05 Result` and remain usable as a direct navigation control.
8. On mobile, rebuild the composition vertically: the path remains continuous, provider marks become a compact stack, and no label is allowed to become microscopic.

## Implementation sequence

### Phase A — brand and content foundation

- Use `cortex-mark.svg` as the single landing and favicon source.
- Add a provider-mark asset folder with the approved monochrome SVGs and explicit attribution/source notes.
- Replace the current five-stage copy with the checkpoint content above.
- Model each stage as data: title, body, visual state, accessible explanation and provider marks when relevant.

### Phase B — one architectural scene

- Replace the current collection of unrelated SVG layers with one shared scene graph.
- Define a stable centre, contour, path, roles, review gate and output surface.
- Make each checkpoint reveal or transform that same graph instead of swapping to an unrelated illustration.

### Phase C — controlled scroll choreography

- Keep the sticky journey, but give each checkpoint a real interval and transition window.
- Scrub the scene from scroll progress; do not rely only on five abrupt `activeStage` swaps.
- Add keyboard and click navigation for the five checkpoints.
- Keep `prefers-reduced-motion` fully readable as five static frames.

### Phase D — responsive and credibility pass

- Validate 1440px desktop, 1024px tablet, 390px mobile and a short-height laptop viewport.
- Verify every provider mark remains legible and correctly named.
- Check that the copy never promises unsupported integrations or guaranteed perfection.
- Verify focus states, screen-reader stage changes and no horizontal overflow.

## Acceptance criteria

- A visitor can explain Cortex, Hermes, the team formation, the review loop and the human handoff after one pass.
- The five stages feel like one continuous architecture, not five cards.
- The provider logos are real, legible and visually subordinate to the system.
- The centre remains the focal point at every viewport size.
- No decorative element exists without an explanatory function.
- The landing still loads without the waitlist endpoint and never fakes a successful request.
- Typecheck, tests, production build and desktop/mobile visual checks pass before publication.
