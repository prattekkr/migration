# AbbVie Story Article Migration Prompt

Use this prompt for migrating story article pages from abbvie.com to AEM EDS XWalk.

---

## Source & Reference

- **Source pages:** `https://www.abbvie.com/who-we-are/our-stories/[slug].html`
- **Reference EDS pages:** `https://develop--dev-abbvie-com--abbvie.aem.page/drafts/prateek/[slug]`
- **Project:** XWalk at prattekkr/migration
- **Model source:** `component-models.json` (built/merged file in project root)

---

## Page Structure (5+ sections)

```
Section 1: HERO
  - hero-container (1 row × 6 cols: image, videoUrl, text, bgColor, ctaLabel, ctaUrl)
  - cta (default-cta, back-cta) — 11 rows × 1 col
  - story-card (storyCardInfo) — 12 rows × 1 col
  - custom-title (h1-size) — 4 rows × 1 col
  - text-container (body-unica-32-reg) — 5 rows (4×1 + 1×2 child row)
  - Section Metadata: classes_customClass=content-wide medium-radius, language=none

Section 2: GRID CONTAINER
  - Section Metadata: name=Grid Container, identifier=Grid Container, classes_container=grid-container, classes_customDynamicClass=content-regular, blockModelId=grid-container, language=none

Section 3: LEFT SPACER (grid-cols-2)
  - Section Metadata: name=Grid Section, identifier=Grid Section, classes_container=grid-section, classes_customDynamicClass=grid-cols-2, blockModelId=grid-section, language=none

Section 4: BODY CONTENT (grid-cols-8)
  - All body blocks: custom-title, text-container, separator, carousel, custom-image, brightcove-video, quote, accordion
  - Section Metadata: name=Grid Section, identifier=Grid Section, classes_container=grid-section, classes_customDynamicClass=grid-cols-8, blockModelId=grid-section, language=none

Section 5: RIGHT SPACER (grid-cols-2) — FIRST relatedContent story-card goes HERE
  - story-card (relatedContent) — first card
  - Section Metadata: same as Section 3

Section 6+: RELATED CONTENT (if more cards exist)
  - Grid Container: classes_customDynamicClass=bg-f4f4f4 regular-padding no-top-padding no-bottom-margin
  - Each card in own grid-cols-6 section
```

---

## Critical Rules (learned from mistakes)

### 1. md2jcr Row Mapping
- **Every field in `component-models.json` gets its own row** (no prefix grouping)
- **Collapsed fields** (ending with Alt, Type, Title, Text, MimeType) get **NO rows** — they collapse into the parent field's HTML attributes
- `classes_customDynamicClass` and `classes_commonCustomClass` are **SEPARATE rows** (not grouped)
- Row values map to fields in the EXACT order they appear in the model

### 2. Container Blocks (text-container, hero-container)
- **text-container:** 5 rows — 4 block-level (empty, empty, "none", empty) + 1 child row with 2 cols: `text-container-text | <richtext>`
- **hero-container:** 1 row × 6 cols (maps to hero-container-item child fields). If only 1 col, md2jcr maps image to `classes_overlayHeight` instead!
- Container blocks need the child type identifier when the filter has 2+ child types

### 3. Section Metadata Format
- Block name = plain "Section Metadata" (classes go as key-value rows)
- Grid sections MUST have `blockModelId` row — without it, nodes are generic "section_N" instead of "grid_container"/"grid_section"
- Required rows for grid nodes: name, identifier, classes_container, classes_customDynamicClass, blockModelId, language

### 4. AEM Source DOM Quirks
- **`.overlap-predecessor` appears AFTER `.grid` in DOM** — hero content (CTA, story-card, title, subtitle) is inside it
- **Solution:** Flatten `.overlap-predecessor` in cleanup transformer (unwrap nested `.cmp-container` wrappers), then detect hero blocks by type in sections transformer
- **`.grid.cmp-grid-meganav`** is the navigation grid, NOT the content grid — skip it when finding the body grid
- **Lazy-loaded images** (`data-cmp-lazy`) have no `<img>` tag at runtime — inject from `data-cmp-src` in cleanup, or fix manually post-import
- **`.container.height-short.align-center.no-bottom-margin`** wraps hero overlay content — do NOT remove it in cleanup (it contains CTA, story-card, etc.)

### 5. Block Variant Classes
- Use parentheses format: `block-name (variant1, variant2)`
- Variants come from AEM source class names (not invented)
- hero-container: height-default/height-tall + overlay-height-short
- custom-title: h1-size, h5-size, width-large
- text-container: body-unica-32-reg (hero), spacing-bottom width-large (body), body-unica-20-reg (small)

### 6. Related Content Cards (.cardpagestory)
- Collect in cleanup transformer → move to `#related-content-cards` container at body end
- Convert href to AEM path: remove .html, prepend `/content/abbvie-nextgen-eds/abbvie-com/us/en`
- Variant = `relatedContent` (not sidePanel)
- First card goes in right gutter (grid-cols-2), remaining in bg-f4f4f4 grid-cols-6 sections

### 7. Cleanup Must Remove
- Cookie consent (#onetrust-consent-sdk)
- Header/footer experience fragments
- Sticky nav, back-to-top button
- Dashboard cards (.dashboardcards)
- Popup containers (.popup-close, warn-on-leave/third-party)
- Standard headers (.standard-header-with-divider)
- Tracking pixels (adsrvr, twitter, bing)
- "Related Content" headings, "CLOSE", "No, I disagree/Yes, I agree" text

### 8. Cleanup Must NOT Remove
- `.container.height-short` with hero content (CTA, story-card are inside!)
- `.container.cmp-container-x-large` (contains hero overlay blocks)
- Any container that has `.button.back-cta`, `.storyinfo`, or `.title.cmp-title-xx-large` inside it

### 9. component-filters.json Fixes Required
- Remove `custom-title` entry (has empty `components: []` which crashes md2jcr)
- Remove any entries with empty `components: []`
- Remove any empty `{}` objects
- In component-definition.json: remove `"filter"` from `carousel` and `search` definitions (reference non-existent filters)

### 10. Brightcove Video (51 fields, 40 rows after collapse)
- Collapsed: overlayTitle, posterType, posterImageMimeType, posterAlt, overlayButtonText, overlayButtonIconType, playerType, playlistType, captionTitle, transcriptType, transcriptButtonIconType
- overlayTitle → collapses into projectNumber row as `<h2>` heading
- overlayButtonText → collapses into colorOverlay row as `<p>` text
- posterAlt → collapses into posterImage row as img `alt` attribute
- Key values: accountId, playerId, videoId extracted from `[data-video-id]` element

---

## Block Row Counts (quick reference)

| Block | Rows | Notes |
|-------|------|-------|
| hero-container | 1 row × 6 cols | Child item fields |
| cta | 11 × 1 | |
| story-card | 12 × 1 | |
| custom-title | 4 × 1 | |
| text-container | 5 (4×1 + 1×2) | Child row: `text-container-text \| content` |
| separator | 4 × 1 | |
| carousel | 24 × 1 | + N custom-image blocks for slides |
| custom-image | 16 × 1 | |
| accordion | 16 + N×5 | 16 config rows + item rows (heading, body, "accordion-item", empty, empty) |
| quote | 12 × 1 | |
| brightcove-video | 40 × 1 | After removing 11 collapsed fields |

---

## Import Script Selectors

```javascript
blocks: [
  {name:'hero-container', instances:['.container.cmp-container-full-width.height-default', '.container.cmp-container-full-width.no-bottom-margin']},
  {name:'cta', instances:['.button.back-cta']},
  {name:'story-card', instances:['.storyinfo', '.cardpagestory']},
  {name:'custom-image', instances:['.image:not(.cmp-video__image)']},
  {name:'custom-title', instances:['.title.cmp-title-xx-large']},
  {name:'text-container', instances:['.text.cmp-text-xx-large', '.text.cmp-text-x-large']},
  {name:'separator', instances:['.separator.separator-height-24', '.separator.separator-height-48', '.separator.separator-height-80']},
  {name:'carousel', instances:['.carousel.panelcontainer.carousel-minimal']},
  {name:'accordion', instances:['.accordion.panelcontainer']},
  {name:'quote', instances:['.quote.cmp-quote-xx-large']},
  {name:'brightcove-video', instances:['.video.cmp-video-xx-large']},
]
```

---

## Execution Steps

1. Ensure `component-filters.json` has no empty entries (remove custom-title filter, empty objects)
2. Ensure `component-definition.json` has no dangling filter references (carousel, search)
3. Bundle import script: `aem-import-bundle.sh --importjs tools/importer/import-story-article.js`
4. Run import: `run-bulk-import.js --import-script .bundle.js --urls urls.txt --disable-http2`
5. Verify hero has 5 blocks + section-metadata
6. Verify grid structure: grid-container → grid-cols-2 → grid-cols-8 (body) → grid-cols-2 (+ first card)
7. Verify related cards in bg-f4f4f4 grid-cols-6 sections
8. Fix any lazy-loaded images manually (check for empty custom-image blocks)
9. Push and preview on EDS
