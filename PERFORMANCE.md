# Editorial Flow visual and performance update

The Intro uses a newly generated transparent ribbon and the existing portrait. Work now uses a text-free rendered document fan, beveled glass extraction panel, connected ribbon and output surfaces. Labels, structured data rows, stage buttons, project tabs, dialogs and navigation remain HTML. The PNG masters and generation prompts are retained in `public/assets/`; the page requests responsive WebP versions. Portrait identity and source PNG are unchanged.

The continuous canvas renderer and generated strand SVGs were removed. JavaScript requests animation frames only during chapter transitions, then stops. Only the active chapter runs ambient CSS transforms; pause, reduced-motion and document visibility suspend decorative movement. Initial reveal fades were removed so critical content is visible immediately. Manrope and DM Sans are now local variable WOFF2 fonts, preloaded with swap fallbacks.

## Local measurement

Single cold-cache runs in local headless Chromium, without network or CPU throttling, using the same original-source snapshot and optimized static server. These are comparative development measurements, not field Core Web Vitals or a guaranteed device frame rate.

| Metric | Before | Updated |
| --- | ---: | ---: |
| Desktop initial transferred bytes (1440×900) | 1,902,816 | approximately 580,000 |
| Desktop LCP in measured run | 644 ms | 248 ms |
| Mobile LCP in measured run (390×844) | 356 ms | 176 ms |
| Updated mobile initial transferred bytes | — | approximately 411,000 |
| Desktop JavaScript rAF callbacks during 2 seconds idle | 25 | 0 |
| Mobile JavaScript rAF callbacks during 2 seconds idle | 79 | 0 |
| Updated measured layout shift | — | 0 |

The desktop transfer reduction is approximately 70%, including the additional Work illustration. Delivery uses no external font requests, animation framework or 3D renderer. Image selection varies with viewport and device pixel ratio. A deployment should still be checked on actual target devices and its real network/cache configuration.

## Verification

`npm run build` validates JavaScript syntax, local asset paths, responsive image candidates, font URLs, anchors and unique IDs. `npm test` covers navigation, project tabs, stage dialogs, assistant error and mocked success responses, touch swipes, tall-content scrolling, pause/reduced motion, hidden-tab recovery, absence of idle JavaScript rendering and the 750 KB desktop startup resource budget.

Reference layouts were inspected at 1440×900, 1366×768, 1920×874 and 390×844. Mobile Work stacks readable stages with internal vertical scrolling. All three projects retain accessible stage controls. The result follows the reference's materials and composition; the generated artwork is an interpretation rather than a pixel-identical recreation.
