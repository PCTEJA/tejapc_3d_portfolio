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
- `public/app.js`: scrolling, vector/canvas ribbons, project content, dialogs, and assistant interaction.
- `public/assets/teja-portrait.png`: transparent portrait prepared from the supplied photo.
- `public/assets/README.md`: portrait generation provenance and prompt.
- `public/gallery/`: existing résumé and gallery assets.

The frontend uses HTML, CSS, JavaScript, Canvas 2D, and inline SVG without a production frontend dependency. Google Fonts provides Manrope and DM Sans with system-font fallbacks. The existing backend and hosting configuration have not been migrated. The frontend can still be served directly from `public`; deployment is a separate step.

Project names and technical context from the supplied design reference are included in the work showcase. Experience, education, research links, certifications, and contact information come from the existing site. No numerical performance claims from the reference were added without supporting project material.
