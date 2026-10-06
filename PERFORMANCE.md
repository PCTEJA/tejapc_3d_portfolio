# Editorial Flow visual and performance update

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

Reference layouts were inspected at 1672×941, 1440×900, 1366×768, 1920×874 and 390×844. Mobile Work stacks readable stages with internal vertical scrolling. All three projects retain accessible stage controls. The Work illustration is directly extracted; the Intro includes locally recovered artwork behind UI. Font rendering, responsive adaptation and interactive controls mean the complete page is not claimed to be pixel-identical to a static image. All 16 browser checks pass.
