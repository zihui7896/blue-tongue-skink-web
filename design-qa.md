# Design QA — Natural Botanical Flower Palette

**Source visual truth**

- User direction: replace the rejected purple, blue-edged, neon-glass palette with colors found on real flowers.
- User-provided flower framing reference: `assets/screenshots/reference-flower.png` (571 × 534 px).
- Built-in ImageGen visual target, natural peony: `assets/effects/blooming-flower/flower-natural-v2.png` (1254 × 1254 px, RGBA).
- Built-in ImageGen visual target, matching natural peony bud: `assets/effects/blooming-flower/flower-bud-natural-v2.png` (1254 × 1254 px, RGBA).
- Built-in ImageGen visual target, natural rose: `assets/effects/blooming-rose/rose-natural-v2.png` (1254 × 1254 px, RGBA).
- The actual-color target is pale shell pink, soft rose, cream highlights, warm yellow peony stamens, and natural green stems under diffused daylight. Purple petals, blue rims, cyan, fluorescence, internal glow, and crystal/glass material are out of scope.

**Implementation evidence**

- Natural peony opening: `assets/screenshots/effects-peony-natural-opening.png` (369 × 725 px).
- Natural peony final desktop view: `assets/screenshots/effects-peony-natural-final-v2.png` (1265 × 712 px).
- Natural rose final desktop view: `assets/screenshots/effects-rose-natural-final.png` (1265 × 712 px).
- Focused source/render comparison: `assets/screenshots/design-qa-natural-flower-comparison.png` (1300 × 820 px).
- Desktop browser viewport: 1265 × 712 CSS px, device scale factor 1; screenshot pixels therefore match CSS pixels 1:1.
- Opening capture viewport: 369 × 725 CSS px, device scale factor 1; screenshot pixels match CSS pixels 1:1.

**State and normalization**

- Final peony and rose captures were taken after each 8–8.6 second bloom cycle settled.
- The opening capture was taken about 650 ms after replay, while the dedicated peony bud was intentionally defocused.
- The comparison sheet uses equal 640 × 400 panels on a shared deep botanical green background. Top row: peony source asset / rendered peony stage. Bottom row: rose source asset / rendered rose stage.
- The implementation stage crops were taken from the same 1265 × 712 viewport and resized only for equal-panel comparison. No color correction was applied to the comparison board.

**Full-view comparison evidence**

- The desktop page retains the existing LanDou shell, left navigation, white content cards, and right sticky directory.
- The directory uses a deep green charcoal base with dusty-rose active states instead of the rejected violet/magenta treatment.
- Both flower stages now use a neutral dark green background that supports the natural pink petals and green stems without introducing blue or purple color casts.
- Directory navigation was used to move between peony and rose; the selected entry updates and the requested card is brought into view.
- Replay controls and speed selectors remain visible and usable.

**Focused region comparison evidence**

- Peony: the rendered result preserves shell-pink outer petals, a slightly deeper rose center, warm yellow stamens, and a natural green stem. The stage does not add violet edges or neon bloom.
- Rose: the rendered result preserves the warm coral-rose center, pale pink outer petals, fine petal texture, and green stem. The prior black edge holes from global white-key removal are gone.
- Transparent background cleanup is connection-based from the image border, so pale petal highlights remain opaque while the generated checkerboard is removed.
- The opening bud and final peony use the same botanical palette, avoiding the previous mismatch between a realistic opening and a fantasy-glass final state.

**Required fidelity surfaces**

- Fonts and typography: the existing Segoe UI / Microsoft YaHei hierarchy, weights, wrapping, and control labels remain unchanged and readable. The palette edit does not alter font metrics.
- Spacing and layout rhythm: stage crop, card spacing, 18–24 px rhythm, radii, metadata alignment, and the 210 px directory track are unchanged. No new overflow or cropping was introduced.
- Colors and visual tokens: effect-specific accents now use dusty rose, shell pink, sage, and deep botanical green. Purple/cyan/neon tokens were removed from the flowers, particles, stage, badges, replay hover, count badge, and effect directory.
- Image quality and asset fidelity: all three flower states use 1254 px source rasters with RGBA transparency. Edge masking no longer removes pale petal highlights. No CSS flower drawing, repeated sprite petals, placeholder, emoji, or handcrafted SVG is visible.
- Copy and content: peony copy now describes a shallow-pink bud, layered opening, and late yellow-center reveal. Rose copy still matches the outer-first, spiral-inner opening motion. The code overlay no longer describes the rose as crystal.

**Primary interactions tested**

- Loaded `workspace.html#effects` in the in-app browser.
- Replayed peony and captured its blurred bud opening and settled natural-color state.
- Clicked the right directory's rose entry and confirmed navigation to the rose card and active selection state.
- Let the rose settle and captured its final natural-color state.
- Checked browser console errors: none.
- Ran JavaScript syntax checks on the shared bloom renderer and both effect configuration modules: passed.

**Comparison history**

1. Earlier procedural and repeated-sprite attempts were blocked for flat radial motion and incorrect silhouette.
2. The video-grounded mesh pass fixed the motion direction, but its purple/magenta/cyan glass palette remained a P1 mismatch after the user requested real flower colors.
3. The first natural-raster pass was still blocked: global white-key removal damaged pale petal highlights and produced black mottled edges in the rendered rose.
4. Final natural-botanical pass: generated matching peony, peony-bud, and rose assets; removed only neutral background pixels connected to the canvas border; restored neutral color grading; changed the stage and effect-specific interface accents to dusty rose, sage, and deep green; updated copy; and captured the result in the browser. Post-fix evidence: `assets/screenshots/design-qa-natural-flower-comparison.png`.

**Findings**

- No actionable P0/P1/P2 mismatch remains for the requested real-flower palette, material, transparency, stage contrast, directory interaction, or readable layout.
- P3: the bloom is still a Canvas mesh deformation over coherent high-resolution flower rasters rather than a fully rigged polygonal botanical model. The visible palette and layered opening behavior satisfy the current scope.

**Open Questions**

- None blocking. A later art-direction iteration could choose a specific real cultivar if a more exact peony or rose variety is desired.

**Implementation Checklist**

- [x] Replace fantasy purple/cyan flower assets with natural blush-pink botanical assets.
- [x] Add a matching natural peony bud so the opening and final states share one cultivar and palette.
- [x] Preserve cream petal highlights while removing the generated checkerboard background.
- [x] Set flower color grades to neutral values.
- [x] Shift glow, particle, stage, badge, replay, count, and directory colors to natural rose/sage/green tokens.
- [x] Update visible descriptions and accessibility labels.
- [x] Verify peony replay, rose directory navigation, final states, syntax, and console errors.

**Follow-up Polish**

- If requested, tune bloom timing per cultivar without changing the approved natural palette.

final result: passed
