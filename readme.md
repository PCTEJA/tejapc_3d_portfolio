# Teja PC — Editorial Flow

A portrait-led portfolio with a continuous animated ribbon and a horizontal, five-chapter journey: introduction, work, experience, about, and contact.

## Preview

```sh
npm run preview
```

Open http://127.0.0.1:4173. The static preview uses only Node.js and does not need dependencies or API credentials.

The existing Express application remains available with `npm start` (or `npm run dev`). Install dependencies and configure `OPENAI_API_KEY` in your local environment to use its `/chat` endpoint. The frontend now calls this same-origin endpoint; the static preview deliberately returns an unavailable response. No live assistant request is needed to view or test the design.

## Interaction

- Mouse-wheel and trackpad scrolling moves the journey horizontally and settles on a chapter.
- Chapter navigation, header links, and previous/next buttons jump directly to sections.
- Left/right arrow keys and Home/End navigate chapters, without intercepting inputs or project-tab controls.
- Touch devices can swipe horizontally. Tall mobile chapters scroll internally so their content remains readable.
- Project tabs switch between AI, data, and full-stack work. Each pipeline stage opens an explanation.
- Work maps the original project PNGs onto Three.js relief meshes. A shared ribbon shader streams the original surface detail and highlights across every chapter; portrait, clothing, labels and project cards are protected. Pointer/focus reactions and replay remain available.
- Chapter entrances, project and company changes, dialogs, and buttons animate. Existing artwork follows the pointer subtly.
- Native modal dialogs contain project details, publications, certifications, and the achievement gallery.
- Ambient animation can be paused. System reduced-motion preferences are respected.

## Validation

Use Node.js 20 or newer for development and the browser tests.

```sh
npm install
npm run build
npx playwright install chromium
npm test
```

The build validates JavaScript syntax, local assets, anchor targets, and unique HTML IDs. The browser suite starts its own static server on port 4174, tests navigation, wheel scrolling, project interactions, dialogs, clipboard, assistant states, responsive layouts, and reduced motion. Screenshots and results are written to the ignored `.artifacts/` directory. The assistant success test uses a mocked API response; it does not verify live model credentials or deployment.

## Editing

- `public/index.html`: page content, navigation, experience, education, and contact details.
- `public/style.css`: layout, typography, glass treatments, responsive behavior, and animation.
- `public/app.js`: scrolling, project content, dialogs, and assistant interaction.
- `public/motion.js` and `public/motion.css`: interaction animation and motion lifecycle.
- `public/ribbon-flow.js` and `public/ribbon-shader.js`: chapter ribbon rendering and the shared surface-flow shader. One lightweight context follows the active chapter, using existing images with the same responsive cropping; Work applies the shared shader inside Three.js.
- `public/project-scene.js`: lazy-loaded PNG-backed Three.js relief; `scripts/vendor.cjs` copies the pinned dependency and license into `public/vendor` during builds.
- `public/assets/teja-portrait.png`: transparent portrait prepared from the supplied photo.
- `public/assets/README.md`: portrait generation provenance and prompt.
- `public/gallery/`: existing résumé and gallery assets.

The frontend uses HTML, CSS, JavaScript, inline SVG, and Three.js. Fonts and the pinned Three.js modules are served locally. The original artwork remains the fallback when WebGL is unavailable or its context is lost. Reduced-motion users initially receive the artwork without downloading Three.js. The renderer pauses outside the visible Work scene, while details are open, when the document is hidden, and when motion is paused. The frontend can still be served directly from `public`; deployment is a separate step.

Project names and technical context from the supplied design reference are included in the work showcase. Experience, education, research links, certifications, and contact information come from the existing site. No numerical performance claims from the reference were added without supporting project material.
