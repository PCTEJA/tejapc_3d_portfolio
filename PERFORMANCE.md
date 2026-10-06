# Editorial Flow visual and performance update

## Interactive motion revision — October 6, 2026

### Continuous ribbon surfaces

Ribbons now animate their original surface texture and highlights with a shared shader, rather than scaling or translating an entire illustration. Intro uses a lightweight WebGL renderer without downloading Three.js. One chapter renderer follows Intro, Experience, About, and Contact; Work incorporates the same shader in its existing Three.js material. The visible ribbon now intentionally runs animation frames. Earlier no-idle-rendering statements describe the superseded static-art version. Paused, hidden, off-screen, and reduced-motion views stop the loop and retain the source image. The initial transfer remains covered by the 750 KB budget. The original image elements keep their alt text; canvases are decorative.

The source-UV masks protect the Intro portrait, suit, and annotation pins and the Work cards/labels. `tests/ribbons.cjs` compares frames for visible ribbon changes and zero face/clothing changes, tests all chapter flows and verifies pause/visibility/reduced-motion recovery. It does not establish frame rate on all GPUs. Contact uses the existing supplied ribbon asset as a softly faded backdrop.

The earlier measurements below describe the static-art revision. Work now progressively loads Three.js 0.180.0 and PNG-backed relief meshes. The original `reference-work-art.png`, `reference-data-art.png`, and `reference-fullstack-art.png` provide the actual textures; procedural replacement objects have been removed. Broad displacement regions add restrained motion while pinning the outside edges and bottom captions. Unlit, sRGB textures preserve the source shading and color. This is a 2.5D treatment of the supplied art, not a reconstruction of unseen geometry.

The opening chapter uses the lightweight ribbon renderer and remains covered by the 750 KB startup budget. Chapter flow draws at up to 24 frames per second with a 1.4-megapixel drawing budget, and pauses during chapter travel. The two local Three.js modules total about 720 KB before HTTP compression and load only on entry to Work (not on initial reduced-motion visits). The selected PNG loads on demand (about 545 KB for AI and 1.2 MB each for its companion projects), with a cache bounded to those three textures. One renderer is reused across selections, with pixel ratio capped at 2 for crisp source lettering. It stops rendering when the scene leaves the viewport, the chapter changes, a detail dialog opens, the page is hidden, or motion is paused. Texture failure, WebGL failure, or context loss restores the original image and retains semantic stage buttons. Assets and fonts require no external CDN.

The shared shader handles ribbon surface movement; CSS handles hover feedback; the Web Animations API handles short content transitions. The browser suite now checks changing 3D pixels, renderer reuse, frozen pixels during pause, and usable WebGL fallbacks as well as the existing navigation, responsive-layout, resource-budget, and accessibility checks. Previous no-canvas/no-idle-rendering statements apply to the historical revision, not the current active Work chapter. These are local Chromium checks, not field frame-rate or cross-device GPU measurements.

Intro now uses artwork extracted from the supplied reference, with local image editing only to recover areas previously hidden by UI. Its original portrait and visible ribbon pixels are restored outside those cleanup regions. The AI Work scene is a direct crop from the reference illustration. The exact Work art bounds at 1672×941 are covered by a regression check. See `public/assets/REFERENCE-ART.md` for crop coordinates, editing prompts and region-comparison evidence. Main text, navigation, CTAs, tabs, dialogs and stage controls remain HTML; read-only annotations within the extracted illustration remain raster content.

A shared ribbon layer behind the panels becomes visible across the Intro-to-Work transition, driven by the existing track position. It cannot intercept pointer input and does not run an idle animation loop. Wide desktops use the full viewport width with no centered canvas or side gutters. Typography adapts to the available height while the hero artwork covers the complete chapter. All three Work projects share the reference illustration layout; companion WebP assets load only when their tab is selected.

The continuous canvas renderer and generated strand SVGs were removed. JavaScript requests animation frames only during chapter transitions, then stops. Only the active chapter runs ambient CSS transforms; pause, reduced-motion and document visibility suspend decorative movement. Initial reveal fades were removed so critical content is visible immediately. Manrope and DM Sans are now local variable WOFF2 fonts, preloaded with swap fallbacks.

## Local measurement

Single cold-cache runs in local headless Chromium, without network or CPU throttling, using the same original-source snapshot and optimized static server. These are comparative development measurements, not field Core Web Vitals or a guaranteed device frame rate.

| Metric | Before | Updated |
| --- | ---: | ---: |
| Desktop initial transferred bytes (1440×900) | 1,902,816 | 528,629 |
| Desktop LCP in measured run | 644 ms | 196 ms |
| Mobile LCP in measured run (390×844) | 356 ms | 212 ms |
| Updated mobile initial transferred bytes | — | 544,737 |
| Desktop JavaScript rAF callbacks during 2 seconds idle | 25 | 0 |
| Mobile JavaScript rAF callbacks during 2 seconds idle | 79 | 0 |
| Updated desktop/mobile measured layout shift | — | 0.0053 / 0 |

The desktop transfer reduction is approximately 72%, including the additional Work illustration. Delivery uses no external font requests, animation framework or 3D renderer. Image selection varies with viewport and device pixel ratio. A deployment should still be checked on actual target devices and its real network/cache configuration.

## Verification

`npm run build` validates JavaScript syntax, local asset paths, responsive image candidates, font URLs, anchors and unique IDs. `npm test` covers navigation, project tabs, stage dialogs, assistant error and mocked success responses, touch swipes, tall-content scrolling, pause/reduced motion, hidden-tab recovery, absence of idle JavaScript rendering and the 750 KB desktop startup resource budget.

Reference layouts were inspected at 1672×941, 1440×900, 1366×768, 1920×874 and 390×844. Mobile Work stacks readable stages with internal vertical scrolling. All three projects retain accessible stage controls. The Work illustration is directly extracted; the Intro includes locally recovered artwork behind UI. Font rendering, responsive adaptation and interactive controls mean the complete page is not claimed to be pixel-identical to a static image. All 19 browser checks pass, including company selection, keyboard discipline tabs, the About teaching link and the shared mobile Work stage-card layout.

## About and Experience revision

About and Experience now use source-derived ribbon artwork, with hidden portions recovered by image editing. The three new WebP assets total about 175 KB and use lazy loading. Company buttons select four distinct, résumé-backed role views. Artwork sits below semantic text and controls; mobile uses a single-column layout with internal chapter scrolling. The earlier detailed timing table describes the Intro/Work measurement run, not a new measurement of this revision. The startup budget and absence of idle JavaScript rendering remain verified by the browser suite.

A subsequent full UI review corrected tablet breakpoints, narrow-phone tab clipping and off-screen keyboard focus. See `UI-REVIEW.md` for the tested viewport matrix and practical limits.
