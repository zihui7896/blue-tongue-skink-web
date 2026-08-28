# Design QA — 3D Flower Code Effect

**Source visual truth**

- `assets/screenshots/reference-flower.png`
- `assets/screenshots/reference-effects-directory.jpg` (the user-provided right-side contents reference, 534 × 1058 px).
- Original pixels: 571 × 534.
- The linked video was also inspected at 2 fps over its flower sequence (0:00–0:09.5). The relevant visual state is the fully opened flower shown from roughly 0:02 onward.
- Motion references were checked from a 12.2-second rose time-lapse and a 27.4-second peony time-lapse. The rose expands from the outer whorl and progressively loosens its spiral center; the peony first cracks at the center, then relaxes its dense inner petals and outer shell.

**Implementation evidence**

- Full desktop view: `assets/screenshots/effects-bloom-desktop-final.png`
- Focused flower crop: `assets/screenshots/effects-bloom-focus-final.png`
- Mobile view: `assets/screenshots/effects-bloom-mobile.png`
- Opening-state clarity check: `assets/screenshots/effects-bloom-opening-crisp.png`
- Side-by-side normalized comparison: `assets/screenshots/design-qa-flower-comparison.png`
- Directory/final rose desktop view: `assets/screenshots/effects-directory-rose-final.png` (1265 × 712 px).
- Independent-petal motion view: `assets/screenshots/effects-peony-petal-motion.png` (1265 × 712 px).
- Responsive directory view: `assets/screenshots/effects-directory-mobile.png` (375 × 812 px).
- Directory side-by-side comparison: `assets/screenshots/design-qa-directory-comparison.png` (2077 × 900 px).
- Desktop viewport: 1280 × 900 CSS px, device scale factor 1.
- Implementation full-view pixels: 1280 × 900.
- Focus crop pixels: 574 × 574.
- State: dark theme effect stage, flower fully opened after the 8.2-second bloom animation.

**Normalization**

- The 571 × 534 source was proportionally scaled and padded to 574 × 574 against the same dark backdrop.
- The implementation was cropped to a centered 574 × 574 region of the effect stage.
- The source includes its original top bar and watermark; those were treated as capture artifacts, not target content.
- For the directory comparison, the 534 × 1058 reference and 1265 × 712 implementation were proportionally normalized to 900 px height and placed in the same comparison image. The source's document-specific entries were treated as sample content; its dark right-rail hierarchy was the visual target.

**Full-view comparison evidence**

- The new effect preserves the existing blue-and-white LanDou application shell, sidebar rhythm, rounded cards, and typography.
- The effect card has a strong single focal point, keeps its replay and speed controls visible, and does not overflow at desktop or 390 px mobile width.
- The 3D flower fills the stage without clipping its primary outer-petal silhouette; the stem exits naturally through the lower edge, as in the source.
- The new 210 px desktop directory remains sticky on the right, uses numbered rows and a dark panel like the reference, and highlights the currently visible animation. At widths below 820 px it becomes a two-item sticky horizontal directory above the grid.
- Both the peony and rose now use separate transparent petal sprites. The petals begin in a compact upright bud, pivot around the flower base, unfold in species-specific layer order, and blend into the exact final 3D flower asset near completion.

**Focused region comparison evidence**

- Both source and implementation use a luminous blush-pink center, darker translucent mauve outer petals, a three-quarter frontal angle, fine petal veins, a thin stem, and a deep blue-black background.
- The implementation intentionally uses a cleaner, higher-resolution crystal/translucent material than the compressed source capture while retaining its palette and depth hierarchy.
- The main subject is a generated raster asset rather than CSS/SVG/div art; Canvas is used for animation, blur, glow, breathing, and depth particles.

**Required fidelity surfaces**

- Fonts and typography: existing Segoe UI / Microsoft YaHei hierarchy is preserved; effect labels remain legible at desktop and mobile sizes.
- Spacing and layout rhythm: sidebar, intro panel, effect card, stage, metadata, and controls retain consistent 16–24 px spacing and existing radii. No horizontal overflow at 390 px.
- Colors and visual tokens: the application remains on its blue-white palette; the effect stage shifts locally to deep navy with blush, pearl, mauve, and violet-pink highlights matching the source.
- Image quality and asset fidelity: final flower uses a clean alpha PNG with high-resolution petal edges and no watermark, placeholder, or checkerboard background. The flower is more detailed than the compressed reference while matching its visual family.
- Copy and content: the category, effect name, 8-second duration, 3D asset/Canvas implementation label, replay action, and speed choices all describe the actual behavior.
- Directory typography/content: the implementation preserves the reference's heading-plus-numbered-list hierarchy while replacing irrelevant document names with “牡丹盛开” and “玫瑰盛开”.

**Primary interactions tested**

- Entered the workspace from the welcome screen.
- Switched between “蓝豆桌宠” and “代码特效”.
- Collapsed and restored the desktop sidebar; opened and closed the mobile drawer.
- Replayed the bloom and inspected its closed, mid-bloom, and fully opened states.
- Replayed the bloom at 180 ms and confirmed the closed flower remains crisp without the previous opening blur.
- Changed the bloom speed.
- Clicked both directory entries and confirmed smooth scrolling plus `aria-current`/visual highlight updates.
- Replayed both peony and rose and inspected compact bud, independent-petal motion, transition, and final flower states.
- At 390 px browser viewport, confirmed 375 px body client/scroll widths, a two-column sticky directory, and a replay button fully inside the 351 px card after the mobile stage fix.
- Confirmed all 9 pet actions still render; advanced the pet from frame 1 to frame 2.
- Checked browser console warnings and errors: none.

**Comparison history**

1. Initial Canvas pass: petals were symmetric, flat, and visually read as a lotus icon rather than the supplied 3D flower. Result: blocked (P1 subject mismatch).
2. Procedural WebGL pass: petals gained depth but remained a dark, flattened radial fan. Result: blocked (P1 silhouette/material mismatch).
3. Video-grounded 3D asset pass: replaced the approximate flower with an original translucent 3D flower asset, added actual alpha extraction, then kept the animation code-driven. Added foreground/background petal depth, code texture, soft glow, bloom compression, breathing, replay, and speed control. Post-fix evidence is `assets/screenshots/design-qa-flower-comparison.png`.
4. Global-compression bloom pass: the complete flower bitmap was squeezed and expanded as one object. The user correctly rejected it because no petal moved independently. Result: blocked (P1 motion-model mismatch).
5. Independent-petal pass: generated species-matched transparent peony and rose petal sprites, added a shared petal animation engine, anchored each petal at the flower base, and staggered three whorls using the observed rose/peony motion order. Fixed the first mid-state radial gap by keeping petal bases near the receptacle and aligning a clipped flower core behind them. Fixed mobile stage overflow caused by `aspect-ratio` plus `min-height`. Post-fix evidence is `assets/screenshots/effects-peony-petal-motion.png` and `assets/screenshots/effects-directory-mobile.png`.

**Findings**

- No actionable P0/P1/P2 mismatch remains for the requested 3D flower effect.
- P3: the implementation is cleaner and more crystalline than the softer, lower-resolution video capture. This is acceptable because it preserves the requested material, palette, depth, and subject while avoiding copied watermarks and compression artifacts.
- P3: the code-driven petals use reusable species-matched sprites, so the intermediate state is more stylized and regular than botanical time-lapse footage. The actual action is now petal-based and the final state remains the full detailed 3D flower.

**Implementation checklist**

- [x] Collapsible responsive sidebar.
- [x] Dedicated code-effects category and responsive grid.
- [x] First 3D flower effect with replay and speed control.
- [x] Second 3D rose effect in its own asset and code folder.
- [x] Independent petal motion for both flowers, based on rose/peony time-lapse order.
- [x] Sticky right-side directory with scroll targeting and active-state tracking.
- [x] Folder-based CSS, feature, data, component, and effect structure.
- [x] Desktop/mobile visual and interaction verification.

final result: passed
