# Local artwork

## Current reference extraction

The active Intro and AI Work artwork now comes from the supplied page references. See [REFERENCE-ART.md](REFERENCE-ART.md) for exact crop coordinates, saved PNGs, editing prompts and fidelity evidence. `reference.css` controls the measured layout. Earlier generated assets below remain retained source material; they are no longer the desktop Intro or AI Work scene.


The page uses locally hosted, pre-rendered artwork with responsive WebP delivery. The original PNGs remain available as source assets. Decorative ribbon motion uses small CSS transforms rather than redrawing the surface on a full-page canvas.

## Portrait source

`teja-portrait.png` is a transparent-background portrait prepared with the built-in image generation tool from the photograph supplied by Teja for this redesign. It is saved in the project so the site does not depend on a temporary or Codex-internal file path.

### Original cutout prompt

Use case: background-extraction. Edit target: the supplied photograph of Teja in a navy suit and blue patterned tie. Create a high-quality transparent PNG portrait cutout for an editorial portfolio website. Remove ONLY the indoor background. Preserve his identity, exact facial features, hair, expression, skin texture, navy suit, shirt, tie and pose exactly as supplied. Keep the full visible torso and shoulders, with natural detailed hair edges. No new objects, no lettering, no shadows behind the person. Actual alpha transparency around the person.

## Supplied ribbon reference (retained source)

`flow-ribbon.png` is the unchanged 2172×724 RGBA artwork supplied by the user as `Luminous iridescent ribbon.png`. Its alpha channel is genuine transparency. It preserves the baked reflections, folded surface and cyan/lavender/coral color variation from that artwork.

The ribbon is a separate supplied illustration in the visual family of the two page references. It is not an exact cutout of either reference composition, a live refractive material, or a deforming 3D mesh. The full reference screenshots are not used as page backgrounds. Placement, cropping and restrained transforms are handled in CSS; readable page content and controls remain HTML.

## Initial responsive conversions

WebP derivatives were produced from the PNG sources with Pillow using Lanczos resizing, quality 90, encoding method 6 and `exact=True`. The portrait was only resized and encoded: its pose, aspect ratio, facial features and colors were not intentionally edited. WebP alpha was checked against the corresponding resized source and is retained losslessly. Both artwork types were inspected over white after encoding.

| Asset | Dimensions | Bytes |
| --- | --- | ---: |
| `teja-portrait.png` — retained source | 1254×1254 | 1,726,984 |
| `teja-portrait-640.webp` | 640×640 | 71,650 |
| `teja-portrait-960.webp` | 960×960 | 153,944 |
| `flow-ribbon.png` — retained source | 2172×724 | 835,312 |
| `flow-ribbon-1200.webp` | 1200×400 | 64,684 |
| `flow-ribbon-2172.webp` | 2172×724 | 153,580 |

Use width-descriptor `srcset` with layout-specific `sizes`. Portrait candidates are `teja-portrait-640.webp 640w, teja-portrait-960.webp 960w`; ribbon candidates are `flow-ribbon-1200.webp 1200w, flow-ribbon-2172.webp 2172w`. Preserve intrinsic aspect ratios with `width`/`height` attributes. Avoid requesting the retained PNGs on the normal page path. At the largest candidate sizes, the two WebP assets total 307,524 bytes, approximately 88% less than their PNG sources; actual selected requests depend on viewport and device pixel ratio.

## Earlier generated artwork (retained)

Following Teja's request for a new ribbon PNG and a closer Work-page match, the preceding iteration used `ribbon-flow-v2` and `work-extraction-scene`. Both transparent 2172×724 PNG masters were created with the built-in imagegen tool. Full prompts and provenance are in [GENERATED-ART.md](GENERATED-ART.md).

| Active artwork derivative | Dimensions | Bytes |
| --- | --- | ---: |
| `ribbon-flow-v2-1200.webp` | 1200×400 | 62,946 |
| `ribbon-flow-v2-2172.webp` | 2172×724 | 149,826 |
| `work-extraction-scene-1200.webp` | 1200×400 | 86,618 |
| `work-extraction-scene-2172.webp` | 2172×724 | 204,396 |

These use quality 90 WebP exports with alpha transparency. The new ribbon runs behind the Intro portrait with a small cropped foreground fold. Work uses the generated text-free document/glass scene, with semantic buttons, labels and structured rows positioned on top. On mobile, these stages stack into readable HTML panels; the glass stage uses a CSS crop of the same artwork. Source PNGs and the supplied reference ribbon remain available but are not loaded by the page.

## Other visual elements

Labels, controls, structured data rows and icons remain editable HTML/CSS/SVG. All stage explanations retain keyboard-accessible buttons. The scene is a conceptual illustration, not a claim of an exact architecture or a pixel-identical reconstruction of the supplied references.

## Self-hosted fonts

`fonts/dm-sans-latin.woff2` and `fonts/manrope-latin.woff2` are Latin-subset variable fonts obtained from the official Google Fonts stylesheet/font endpoints for DM Sans and Manrope. Local hosting removes the page's dependency on third-party font requests. Their accompanying SIL Open Font License files are retained under `fonts/`.
