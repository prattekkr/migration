# AbbVie Story Article Migration Rules

> These rules are mandatory for all story article page migrations.
> Read this file BEFORE making any changes to parsers, transformers, or import scripts.

---

## Rule 1: Model Field → Row Mapping

- Use `component-models.json` as the source of truth for field definitions
- **Every non-tab field in the model gets its own row** in the grid table
- Fields are mapped sequentially in the EXACT order they appear in the model
- `classes_customDynamicClass` and `classes_commonCustomClass` are **SEPARATE rows** (not grouped)
- **Collapsed fields** (ending with Alt, Type, Title, Text, MimeType) get **NO rows** — their values collapse into the parent field's HTML attributes:
  - `imageAlt` → `alt` attribute on `<img>` element
  - `imageMimeType` → no output needed
  - `overlayTitle` → `<h2>` heading inside parent field's cell
  - `overlayButtonText` → `<p>` text inside parent field's cell
  - `posterAlt` → `alt` attribute on poster `<img>`
  - `titleType` → determines heading tag (`<h1>`, `<h2>`, etc.)

## Rule 2: Container Blocks

- Container blocks have a `filter` entry in `component-filters.json` with non-empty `components[]`
- When filter has **2+ child types**, the child row needs a **type identifier** in the first column
- When filter has **1 child type**, no type identifier needed (hero-container pattern)
- **text-container**: 5 rows (4 block-level + 1 child row with `text-container-text | content`)
- **hero-container**: 1 row × 6 cols (child item fields directly, no type identifier)

## Rule 3: Block Variant Classes

- Use parentheses format: `block-name (variant1, variant2)`
- Variants are EDS design tokens, NOT AEM cmp-* class names
- Source AEM classes must be mapped to the correct EDS variant (see class-mapping.json)
- When in doubt, check the reference pages for the correct variant combination

## Rule 4: Section Metadata Format

- Block name = plain `Section Metadata` when using `blockModelId` key-value rows
- OR classes in block name: `Section Metadata (grid-section, grid-cols-8)` — produces `class="section-metadata grid-section grid-cols-8"` in output
- Grid nodes MUST have `blockModelId` row for named JCR nodes (grid_container, grid_section)
- Full grid node rows: name, identifier, classes_container, classes_customDynamicClass, blockModelId, language
- Spacer sections (grid-cols-2) need the same full set of rows

## Rule 5: Grid Layout (2-8-2)

```
Section 1: Hero (classes_customClass: content-wide medium-radius)
Section 2: grid_container (blockModelId: grid-container, classes_container: grid-container, classes_customDynamicClass: content-regular)
Section 3: grid_section left (blockModelId: grid-section, classes_container: grid-section, classes_customDynamicClass: grid-cols-2)
Section 4: grid_section body (blockModelId: grid-section, classes_container: grid-section, classes_customDynamicClass: grid-cols-8)
Section 5: grid_section right (blockModelId: grid-section, classes_container: grid-section, classes_customDynamicClass: grid-cols-2) — first relatedContent story-card goes IN here
Section 6+: Related content grid (bg-f4f4f4, grid-cols-6 sections for remaining cards)
```

Column arithmetic: 2+8+2=12 per grid-container.

## Rule 6: Hero Section Content

Hero section ALWAYS contains these 5 blocks in this order:
1. `hero-container` (1 row × 6 cols)
2. `cta` (default-cta, back-cta) — 11 rows
3. `story-card` (storyCardInfo variant) — 12 rows
4. `custom-title` (h1-size) — 4 rows
5. `text-container` (body-unica-32-reg) — 5 rows

**AEM DOM quirk:** The overlap-predecessor container (with CTA, story-card, title, text) appears AFTER the grid in DOM order. The cleanup transformer must flatten it, and the sections transformer must detect hero blocks by type and place them in Section 1.

## Rule 7: AEM Source Class → EDS Variant Mapping

| Block | AEM Source | EDS Variant |
|-------|-----------|-------------|
| hero-container | .height-default | height-default, overlay-height-short |
| hero-container | .height-tall | height-tall, overlay-height-short |
| cta | .button.back-cta | default-cta, back-cta |
| custom-title | .light-theme (hero) | h1-size |
| custom-title | .h5-size or .medium-weight | h5-size, width-large |
| text-container | .cmp-text-xx-large.light-theme (hero) | body-unica-32-reg |
| text-container | .cmp-text-xx-large (body) | spacing-bottom, width-large |
| text-container | .cmp-text-x-large | spacing-bottom, width-large, body-unica-20-reg |
| separator | .separator-height-N | separator-height-N (pass through) |
| carousel | .carousel-minimal | carousel-show-btn-margin, carousel-minimal |
| accordion | .cmp-accordion-xx-large | accordion-icon-font, h5-size, width-large |
| quote | .cmp-quote-xx-large | quote-standard, quote-h4 |
| brightcove-video | .cmp-video-xx-large | (no variants) |

## Rule 8: Related Content Cards

- Source: `.cardpagestory` elements
- Variant: `relatedContent`
- Page href: remove `.html`, prepend `/content/abbvie-nextgen-eds/abbvie-com/us/en`
- First card → right gutter (grid-cols-2 section)
- Remaining cards → new bg-f4f4f4 grid-container with grid-cols-6 sections
- Collect in cleanup transformer → `#related-content-cards` container

## Rule 9: Cleanup (beforeTransform)

**REMOVE:**
- #onetrust-consent-sdk, .experiencefragment, header/footer fragments
- .sticky-nav, .button.back-to-top
- .dashboardcards, [class*="dashboardcards"]
- .popup-close, .standard-header-with-divider
- Tracking: iframe, img[src*="adsrvr"], img[src*="twitter.com"], img[src*="t.co"], a[href*="adsrvr"]
- .container.cmp-container-medium.height-short (disclaimer popup)

**DO NOT REMOVE:**
- `.container.height-short` that contains hero content (CTA, story-card)
- `.container.cmp-container-x-large` (hero overlay blocks)
- Any container with `.button.back-cta` or `.storyinfo` inside it

**FLATTEN:**
- `.container.overlap-predecessor` — recursively unwrap all nested `.cmp-container` wrappers

**COLLECT:**
- `.cardpagestory` elements → move to `#related-content-cards` container at body end

**MATERIALIZE:**
- `[data-cmp-src]` lazy images → inject `<img>` tag with src from data-cmp-src

## Rule 10: component-filters.json Requirements

- Remove `custom-title` entry (has empty `components: []`)
- Remove any entries with empty `components: []`
- Remove any empty `{}` objects
- In component-definition.json: remove `"filter"` from `carousel` and `search` (reference non-existent filters)

## Rule 11: Post-Import Checks

After import, verify:
1. Hero section has 5 blocks + section-metadata
2. Grid structure: grid-container → grid-cols-2 → grid-cols-8 → grid-cols-2
3. Related cards: first in right gutter, remaining in bg-f4f4f4 grid-cols-6
4. No junk: "Related content" heading, "CLOSE", disclaimer, tracking pixels
5. Brightcove video has correct field count (40 rows after collapse removal)
6. Images have valid src URLs (not empty, not blob:)
7. text-container has 5 rows with "text-container-text" child identifier

## Rule 12: Brightcove Video (40 rows)

Collapsed fields (NO row): overlayTitle, posterType, posterImageMimeType, posterAlt, overlayButtonText, overlayButtonIconType, playerType, playlistType, captionTitle, transcriptType, transcriptButtonIconType

Key field values:
- Row 0: projectNumber (empty, but overlayTitle collapses here as `<h2>`)
- Row 2: posterImage (with posterAlt as img alt attribute)
- Row 3: colorOverlay (overlayButtonText collapses here as `<p>`)
- Row 4: overlayButtonFontIcon = "play"
- Row 6: iconPosition = "left"
- Row 7: accountId (from data-account)
- Row 8: playerId (from data-player)
- Row 9: videoId (from data-video-id)
- Row 35: classes_customDynamicClass (MUST be empty — leaks as variant class if not!)
- Row 38: language = "none"
