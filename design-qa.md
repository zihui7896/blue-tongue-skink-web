# Design QA — Transparent Stage With Falling Sakura

**Source visual truth**

- User direction: remove the flower-stage background and add falling cherry-blossom petals generated with Image 2.
- Web motion reference: `assets/screenshots/reference-web-sakura-storm.jpg` (640 × 480 px), sourced from the Yodoyabashi Seasonal Flowers sakura-storm photograph.
- Generated front-facing petal: `assets/effects/shared/sakura-petal-v1.png` (256 × 256 px, RGBA).
- Generated curled petal: `assets/effects/shared/sakura-petal-curled-v1.png` (256 × 256 px, RGBA).
- The web reference establishes a real sakura shower: mostly near-white blush petals, irregular individual silhouettes, different apparent sizes, varied rotation, and a mixture of sharp foreground and softer background petals.

**Implementation evidence**

- Peony with transparent stage and sakura: `assets/screenshots/effects-peony-transparent-sakura-final.png` (1265 × 712 px).
- Rose with transparent stage and sakura: `assets/screenshots/effects-rose-transparent-sakura-final.png` (1265 × 712 px).
- Rose temporal frame A: `assets/screenshots/effects-rose-transparent-sakura.png` (1265 × 712 px).
- Rose temporal frame B, 1.7 seconds later: `assets/screenshots/effects-rose-transparent-sakura-later.png` (1265 × 712 px).
- Combined source/render comparison: `assets/screenshots/design-qa-transparent-sakura-comparison.png` (1300 × 820 px).
- Browser viewport: 1265 × 712 CSS px, device scale factor 1; screenshot pixels equal CSS pixels.

**State and normalization**

- Both final captures were taken during the settled half of the bloom cycle while the sakura layer continued moving.
- Temporal frames A and B use the same rose card, viewport, scroll position, flower state, and density. Their different petal positions verify continuous falling and lateral flutter.
- The comparison board uses four equal 640 × 400 regions: real sakura-storm reference, rendered rose frame A, the two transparent Image 2 petal sprites, and rendered rose frame B.
- The web photo is used only for petal color, density, depth, and motion character; its trees and park background are intentionally excluded because the user explicitly requested no stage background.

**Full-view comparison evidence**

- The former dark green radial stage has been removed. Browser-computed `.effect-stage` background is `rgba(0, 0, 0, 0)`.
- The transparent canvas now blends directly into the existing white effect card while retaining a very light rose edge for stage boundaries.
- Peony and rose remain readable because their original alpha, petal texture, natural shadows, and green stems are preserved.
- The right directory, replay button, speed selector, left navigation, and card layout remain unchanged and functional.

**Focused region comparison evidence**

- Two distinct generated petal silhouettes alternate across 32 seeded particles, avoiding an obviously repeated single shape.
- Background petals are smaller, softer, and lower-opacity; foreground petals are larger, sharper, and more opaque.
- Each petal has independent seeded start position, fall speed, lateral drift, phase, spin, rotation, and vertical flutter.
- Petals are rendered both behind and in front of the flower, creating depth while keeping the flower as the primary subject.
- The pale blush color and low saturation match the real sakura-storm reference without introducing purple, neon magenta, or cartoon outlines.

**Required fidelity surfaces**

- Fonts and typography: Segoe UI / Microsoft YaHei hierarchy, weights, line height, wrapping, and small control labels are unchanged and remain readable on the light card.
- Spacing and layout rhythm: stage size, 16:10 ratio, card padding, metadata boundary, directory track, radii, and vertical rhythm are unchanged. No new overflow is visible.
- Colors and visual tokens: the dark stage fill and Canvas backdrop glow are disabled. Sakura uses near-white blush and soft rose shadows; existing natural flower colors are preserved.
- Image quality and asset fidelity: both 256 px RGBA particle sprites come from high-resolution Image 2 outputs. Their alpha edges remain clean at the 9–30 px rendered sizes. No emoji, CSS petal drawing, handcrafted SVG, or placeholder shape is used.
- Copy and content: the theme is now “花与樱落”; the intro explains the transparent stage and front/back sakura layers; both code overlays now reference `sakura.drift(depth)`.

**Primary interactions tested**

- Reloaded `workspace.html#effects` in the in-app browser.
- Replayed the peony and inspected the transparent opening/mid-bloom stage.
- Used the directory to navigate from peony to rose and confirmed the rose item became active.
- Captured two rose frames 1.7 seconds apart and confirmed the petal positions changed.
- Verified the rendered stage computed background is transparent.
- Checked browser warnings and errors: none.
- Ran JavaScript syntax checks on the shared renderer, peony configuration, rose configuration, and QA-board script: passed.

**Comparison history**

1. Previous natural-flower pass retained a deep botanical-green stage and simple procedural petal-like particles. Result: blocked for the new request because the background remained visible and the particles were not real sakura assets.
2. Initial transparent-stage pass removed the backdrop and replaced procedural shapes with one generated petal. Web research then showed that convincing sakura rain depends on irregular orientations and depth variation. Result: P2 repetition risk.
3. Final Image 2 pass added a second curled petal generated from the real sakura-storm reference, alternated both sprites across 32 particles, separated foreground/background opacity and blur, added independent spin/flutter/drift, removed the dark CSS and Canvas backdrops, updated copy, and verified two temporal frames. Post-fix evidence: `assets/screenshots/design-qa-transparent-sakura-comparison.png`.

**Findings**

- No actionable P0/P1/P2 issue remains for transparent background treatment, sakura subject accuracy, sprite quality, depth, motion variation, flower readability, directory navigation, or console stability.
- P3: the two petal sprites repeat by design, but seeded scale, rotation, curl silhouette, opacity, blur, drift, and flutter prevent obvious tiling at the current 32-particle density.

**Open Questions**

- None blocking. Petal density and wind speed can be tuned later without changing the approved assets or layout.

**Implementation Checklist**

- [x] Remove the dark CSS stage background.
- [x] Disable the Canvas radial backdrop glow.
- [x] Search real sakura-fall references on the web.
- [x] Generate two transparent Image 2 sakura petal sprites.
- [x] Render front and back sakura layers with independent falling, spin, drift, and flutter.
- [x] Preserve peony and rose bloom animations and controls.
- [x] Update visible theme copy and code overlays.
- [x] Verify screenshots, directory navigation, transparent computed style, syntax, and console logs.

**Follow-up Polish**

- If requested, expose petal density and wind as user controls.

final result: passed
