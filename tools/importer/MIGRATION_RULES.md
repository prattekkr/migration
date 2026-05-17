# AbbVie EDS Migration - Technical Implementation Rules

> This document provides detailed technical guidance for implementing the mandatory rules defined in `/workspace/CLAUDE.md`.

## 1. Fix-Forward Pipeline: Detailed Workflow

### When a bug is found after import:

```
1. Fix the issue (in content HTML, block CSS/JS, or parser)
2. Log fix in fix-registry.json with status: "pending"
3. Identify root cause: is it a parser bug, transformer bug, or missing block logic?
4. Mark which file needs updating (parser/transformer)
```

### Before reimporting:

```
1. Run: node tools/importer/check-fix-registry.js
2. If pending fixes exist → incorporate each into the relevant parser/transformer
3. Update each fix entry: status → "incorporated", add incorporatedDate + incorporatedIn
4. Run check again to confirm all clear
5. Proceed with reimport
```

### Fix entry template:

```json
{
  "id": <next-id>,
  "date": "<YYYY-MM-DD>",
  "template": "<template-name>",
  "pages": ["<affected-url-1>", "<affected-url-2>"],
  "parser": "parsers/<file>.js",
  "transformer": "transformers/<file>.js",
  "description": "<What was wrong and how it was fixed>",
  "selector": "<DOM selector of the affected element>",
  "rootCause": "<parser|transformer|block-code|content-structure>",
  "fixDetails": "<Technical details of what code changed>",
  "status": "pending",
  "incorporatedDate": null,
  "incorporatedIn": null
}
```

## 2. AEM Source DOM Analysis Reference

### Container Class Mapping

| AEM Class Pattern | EDS Mapping | Notes |
|---|---|---|
| `.container.cmp-container-full-width` | Section boundary | Full-width sections |
| `.container.overlap-predecessor` | Hero block | Always paired with previous bg container |
| `.container.semi-transparent-layer` | Section with `style: dark` | Dark overlay background |
| `.container.large-radius` | Section with rounded visual | Often holds background images |
| `.container.medium-radius` | CTA/banner sections | Typically at page bottom |
| `.container.no-bottom-margin` | Adjacent section (no gap) | Sections flow together |
| `.container.height-short` | Compact section | Reduced vertical padding |
| `.container.height-default` | Standard section | Normal vertical padding |

### Grid Column Mapping

| AEM Grid | EDS Columns Variant | Usage |
|---|---|---|
| `col-with-5 + col-with-5` | `columns (50/50)` | Equal two-column |
| `col-with-4 + col-with-8` | `columns (33/66)` | Sidebar + main |
| `col-with-8 + col-with-4` | `columns (66/33)` | Main + sidebar |
| `col-with-6 + col-with-6` | `columns (50/50)` | Equal two-column |
| `col-with-3 * 4` | `columns (4-up)` | Four equal columns |
| `col-with-1 + col-with-5 + col-with-1 + col-with-5` | `columns (image-text)` | Alternating image/text |

### Background Detection Patterns

```javascript
// 1. Background image from container bg img element
element.querySelector('img.cmp-container__bg-image');
element.querySelector('img.cmp-container__bg-image[data-cmp-src]');

// 2. Background from inline style
element.style.backgroundImage; // url(...)

// 3. Background from data attribute (lazy loaded)
element.getAttribute('data-cmp-src');

// 4. Background color from class → Section Metadata style
// Dark backgrounds:
'.semi-transparent-layer' → style: 'dark'
'.container' with navy color → style: 'navy'
// Light backgrounds:
default (no class) → no style needed

// 5. In Section Metadata block:
// cells: [['style', 'dark'], ['background', imgSrc]]
```

### Component Class Patterns (cmp-*)

```javascript
// Titles - check size variant classes
'.cmp-title'                    // Base title
'.cmp-title-xx-large h1'       // XX-Large heading
'.cmp-title-x-large h2'        // X-Large heading
'.cmp-title h3'                 // Standard heading

// Text - richtext content
'.cmp-text'                     // Text component
'.cmp-text p'                   // Paragraph within text

// Images - check for lazy loading
'.cmp-image'                    // Image wrapper
'.cmp-image[data-cmp-src]'     // Lazy-loaded (copy data-cmp-src to img.src)
'.cmp-image img'                // Actual img element

// Videos - extract URL before removing player UI
'.cmp-video'                    // Video wrapper
'[data-video-id]'              // Brightcove video ID
'[data-iframesrc*="youtube"]'  // YouTube embed

// Interactive
'.cmp-accordion-large'          // Accordion
'.cmp-quote'                    // Blockquote
'.cmp-teaser'                   // Teaser/promo card
'.cardpagestory'                // Content card
'.dashboardcards'               // Stats/KPI card
```

## 3. Analytics Data Attribute Preservation

### Source attributes to extract:

```javascript
// AEM Data Layer (JSON structure)
'data-cmp-data-layer'  // Contains component ID, type, title
// Example: {"component-id": {"@type": "core/wcm/components/title/v3/title", "dc:title": "..."}}

// Click/impression tracking
'data-track'           // Tracking event identifier
'data-track-click'     // Click event name
'data-track-impression'// Impression event name
'data-analytics'       // Analytics label
'data-analytics-*'     // Various analytics attributes

// Content identification
'data-content-name'    // Content name for analytics
'data-content-type'    // Content type (e.g., "video", "article")
'data-link-type'       // Link type (internal, external, download)
'data-link-text'       // Link text for tracking
```

### How to preserve in parsers:

```javascript
// Extract analytics from source element
const cmpDataLayer = element.getAttribute('data-cmp-data-layer');
const trackId = element.getAttribute('data-track');

// Parse AEM data layer JSON
if (cmpDataLayer) {
  try {
    const layerData = JSON.parse(cmpDataLayer);
    const componentId = Object.keys(layerData)[0];
    const componentData = layerData[componentId];
    // Store as standardized data attributes on block elements
    blockElement.setAttribute('data-analytics-type', componentData['@type'] || '');
    blockElement.setAttribute('data-analytics-title', componentData['dc:title'] || '');
  } catch (e) { /* ignore malformed JSON */ }
}

// Preserve tracking IDs
if (trackId) {
  blockElement.setAttribute('data-analytics-track', trackId);
}
```

### Links with tracking:

```javascript
// When creating links in parsers, preserve tracking attributes:
const sourceLink = col.querySelector('a[data-track]');
if (sourceLink) {
  const newLink = document.createElement('a');
  newLink.href = sourceLink.href;
  newLink.textContent = sourceLink.textContent;
  // Preserve analytics
  if (sourceLink.getAttribute('data-track')) {
    newLink.setAttribute('data-analytics-track', sourceLink.getAttribute('data-track'));
  }
  if (sourceLink.getAttribute('data-link-type')) {
    newLink.setAttribute('data-analytics-link-type', sourceLink.getAttribute('data-link-type'));
  }
}
```

## 4. Accessibility Preservation Guide

### ARIA attributes extraction:

```javascript
// Always extract these from source elements:
const ariaLabel = element.getAttribute('aria-label');
const ariaDescribedBy = element.getAttribute('aria-describedby');
const role = element.getAttribute('role');
const alt = element.querySelector('img')?.getAttribute('alt');

// For interactive components:
const ariaExpanded = element.getAttribute('aria-expanded');
const ariaControls = element.getAttribute('aria-controls');
```

### Image alt text - MANDATORY:

```javascript
// ALWAYS preserve alt text. Never use empty alt unless source is decorative.
const img = element.querySelector('img');
const alt = img?.getAttribute('alt') || '';
const isDecorative = img?.getAttribute('role') === 'presentation'
  || img?.getAttribute('aria-hidden') === 'true';

// In parser output:
newImg.alt = alt;
if (isDecorative) {
  newImg.alt = ''; // Only for confirmed decorative images
  newImg.setAttribute('role', 'presentation');
}
```

### Heading hierarchy - MANDATORY:

```javascript
// Preserve heading levels from source. Never change h2 to h3 without reason.
const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
if (heading) {
  const level = heading.tagName; // Preserve original level
  const newHeading = document.createElement(level);
  newHeading.textContent = heading.textContent;
  // Preserve ID for anchor linking
  if (heading.id) newHeading.id = heading.id;
}
```

### Accordion accessibility:

```javascript
// Accordion parsers must preserve:
// - Heading semantics (h2/h3) for each item title
// - The panel content structure
// Block decoration JS must add:
// - role="button" on accordion triggers
// - aria-expanded="true|false"
// - aria-controls="panel-id"
// - role="region" on panels
// - aria-labelledby="trigger-id" on panels
```

### Link accessibility:

```javascript
// Preserve accessible names on links
const link = element.querySelector('a');
const ariaLabel = link?.getAttribute('aria-label');
const title = link?.getAttribute('title');

const newLink = document.createElement('a');
newLink.href = link.href;
newLink.textContent = link.textContent;
if (ariaLabel) newLink.setAttribute('aria-label', ariaLabel);
if (title) newLink.setAttribute('title', title);

// For links that open in new window - preserve the indicator
if (link?.getAttribute('target') === '_blank') {
  newLink.setAttribute('target', '_blank');
  newLink.setAttribute('rel', 'noopener noreferrer');
  // Ensure accessible indication of new window
  if (!ariaLabel) {
    newLink.setAttribute('aria-label', `${link.textContent} (opens in new window)`);
  }
}
```

## 5. Block Authoring Fields Checklist

Every block parser must ensure these field types are properly annotated:

| Field Type | Comment Hint | UE Type | Notes |
|---|---|---|---|
| Image | `<!-- field:image -->` | reference | Must have companion alt field |
| Image Alt | (collapsed with image) | text | Auto-paired with image |
| Rich Text | `<!-- field:text -->` | richtext | Headings, paragraphs, lists |
| Title | `<!-- field:title -->` | text | Plain text heading |
| Link/CTA | `<!-- field:link -->` | URL | Href + link text |
| Video | `<!-- field:video -->` | URL | YouTube/Brightcove embed URL |
| Background | In Section Metadata | reference | Via Section Metadata `background` row |
| Style | In Section Metadata | text | Via Section Metadata `style` row |
| Analytics ID | `<!-- analytics:id -->` | text | Tracking identifier |

## 6. Pre-Reimport Checklist

Before running any reimport, verify:

- [ ] `node tools/importer/check-fix-registry.js` exits 0 (no pending fixes)
- [ ] All parsers have proper field hints (`<!-- field:* -->` comments)
- [ ] All parsers document UE Model fields in JSDoc header
- [ ] Analytics attributes are preserved (not stripped) in cleanup transformer
- [ ] ARIA/accessibility attributes are preserved in parsers
- [ ] Image alt text is always extracted (never empty unless decorative)
- [ ] Background images/colors are mapped to Section Metadata
- [ ] AEM cmp-* classes are used as selectors in page-templates.json
- [ ] All blocks use AbbVie custom block names (Rule 7a) — never generic EDS names
- [ ] Grid layouts use Grid Container + Grid Section pattern (Rule 7c)
- [ ] Section styles match AEM container class mapping (Rule 7d)
- [ ] JCR content package generated for AEM Package Manager installation (Rule 8)
- [ ] JCR XML uses `component-models.json` (built) for modelFields — NOT raw `_block.json`
- [ ] All JCR nodes have `modelFields`, `aueComponentId`, `model`, `sling:resourceType`
- [ ] Richtext content HTML-encoded in `text` attribute
- [ ] Boolean values use `{Boolean}true` format, numbers use `{Long}N` format

## 7. AEM → EDS Block Mapping: Technical Implementation

> **Canonical mapping data:** `tools/importer/block-mapping.md`
> This section provides code-level implementation. For the lookup tables themselves
> (block names, variants, grid columns, section styles), always consult `block-mapping.md`.
>
> Verified by comparing live AEM source pages with manually migrated EDS pages on
> `develop--dev-abbvie-com--abbvie.aem.page`. See CLAUDE.md Rule 7 for enforcement rules.

### 7.1 Block Resolution Logic

When encountering an AEM component, resolve it to the correct EDS block using this priority:

```javascript
// Block name resolution: AEM class → EDS block name
function resolveBlock(element) {
  const classes = element.className;

  // Hero containers (full-width with height + background)
  if (classes.includes('cmp-container-full-width') && hasHeightClass(classes)) {
    return 'hero-container';
  }

  // Titles — check for cmp-title wrapper
  if (classes.includes('cmp-title') || element.closest('.title[class*="cmp-title"]')) {
    return 'custom-title';
  }

  // Text — check for cmp-text wrapper
  if (classes.includes('cmp-text') || element.closest('.text[class*="cmp-text"]')) {
    return 'text-container';
  }

  // Images
  if (classes.includes('cmp-image')) return 'custom-image';

  // Buttons / CTAs
  if (classes.includes('cmp-button')) return 'cta';

  // Video
  if (classes.includes('brightcove-video') || element.querySelector('[data-video-id]')) {
    return 'brightcove-video';
  }
  if (element.querySelector('iframe[src*="youtube"]')) return 'brightcove-video';

  // Navigation
  if (classes.includes('cmp-breadcrumb')) return 'breadcrumb';

  // Interactive
  if (classes.includes('cmp-accordion')) return 'accordion';
  if (classes.includes('cmp-carousel')) return 'carousel';

  // Content
  if (classes.includes('cmp-quote') || element.tagName === 'BLOCKQUOTE') return 'quote';
  if (classes.includes('cardpagestory') || classes.includes('dashboardcards')) return 'story-card';
  if (classes.includes('cmp-separator')) return 'separator';

  return null; // Unknown component — investigate before mapping
}
```

### 7.2 Variant Resolution Logic

```javascript
// Resolve EDS variant classes from AEM source classes
function resolveVariants(blockName, element) {
  const classes = element.className;
  const variants = [];

  switch (blockName) {
    case 'hero-container':
      // Height: extract from container
      if (classes.includes('height-short')) variants.push('height-short');
      else if (classes.includes('height-default')) variants.push('height-default');
      else if (classes.includes('height-tall')) variants.push('height-tall');
      // Overlay
      if (classes.includes('semi-transparent-layer')) variants.push('navy');
      break;

    case 'custom-title':
      // Size: cmp-title-xx-large → h1-size, cmp-title-x-large → h3-size
      if (classes.includes('cmp-title-xx-large')) variants.push('h1-size');
      else if (classes.includes('cmp-title-x-large')) variants.push('h3-size');
      else variants.push('h5-size');
      // Weight
      if (classes.includes('medium-weight')) variants.push('medium-weight');
      if (classes.includes('book-weight')) variants.push('book-weight');
      // Theme
      if (classes.includes('theme-light') || !isDarkSection(element)) {
        variants.push('theme-light');
      }
      break;

    case 'text-container':
      // Font size
      if (classes.includes('cmp-text-xx-large')) variants.push('body-unica-32-reg');
      // Width
      if (isNarrowContext(element)) variants.push('width-large');
      // Spacing
      if (needsBottomSpacing(element)) variants.push('spacing-bottom');
      break;

    case 'separator':
      // Height determined by context
      // Large section break → 80 or 96
      // Inline content break → 8 or 24
      variants.push('separator-height-24'); // Default; adjust per context
      break;

    case 'cta':
      variants.push('default-cta');
      if (isDarkSection(element)) variants.push('dark-theme');
      else variants.push('light-theme');
      break;

    case 'brightcove-video':
      variants.push('bcvideo-player-single');
      if (hasCaption(element)) variants.push('bcvideo-content-bottom');
      else variants.push('bcvideo-content-none');
      break;
  }

  return variants;
}
```

### 7.3 Grid Mapping Implementation

```javascript
// Map AEM grid structure → EDS Grid Container + Grid Sections
function mapGrid(gridRowElement) {
  const columns = gridRowElement.querySelectorAll('.grid-cell[class*="grid-row__col-with-"]');
  const edsSections = [];

  columns.forEach(col => {
    // Extract column width: "grid-row__col-with-5" → 5
    const widthMatch = col.className.match(/grid-row__col-with-(\d+)/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 12;

    // Skip full-width columns (use regular Section instead)
    if (width === 12) return;

    edsSections.push({
      type: 'grid-section',
      gridCols: width,           // → class "grid-cols-5"
      blocks: mapChildBlocks(col), // Recursively map child AEM components
      isEmpty: col.children.length === 0 || width === 1
    });
  });

  return {
    type: 'grid-container',
    sections: edsSections
  };
}
```

### 7.4 Section Container Mapping Implementation

```javascript
// Map AEM container → EDS section classes
function mapSectionClasses(containerElement) {
  const classes = containerElement.className;
  const edsClasses = ['abbvie-container'];

  // Container width
  if (classes.includes('cmp-container-full-width')) edsClasses.push('content-wide');
  else if (classes.includes('cmp-container-xx-large')) edsClasses.push('content-regular');
  else if (classes.includes('cmp-container-x-large')) edsClasses.push('container-x-large');
  else if (classes.includes('cmp-container-small')) edsClasses.push('container-small');

  // Grid detection
  if (containerElement.querySelector('.grid-row')) edsClasses.push('grid-container');

  // Border radius
  if (classes.includes('medium-radius')) edsClasses.push('medium-radius');
  if (classes.includes('large-radius')) edsClasses.push('large-radius');

  // Spacing
  if (classes.includes('no-bottom-margin')) edsClasses.push('no-bottom-margin');
  if (classes.includes('no-padding')) edsClasses.push('no-padding');

  // Background color — extract from inline style or data attribute
  const bgColor = extractBackgroundColor(containerElement);
  if (bgColor) edsClasses.push(`bg-${bgColor.replace('#', '')}`);

  return edsClasses.join(' ');
}
```

### 7.5 Hero Section Composite Pattern

The AEM hero is a single container; in EDS it becomes a section with multiple blocks:

```
AEM Source:
  div.container.cmp-container-full-width.height-short.no-bottom-margin
    ├── nav.cmp-breadcrumb           (if present)
    ├── div.title.cmp-title-xx-large (page title)
    └── div.text.cmp-text-xx-large   (subtitle, if present)

EDS Output:
  Section (abbvie-container content-wide medium-radius hero-container-container
           breadcrumb-container custom-title-container text-container-container)
    ├── hero-container block (height-short navy)
    ├── breadcrumb block     (if source has cmp-breadcrumb)
    ├── custom-title block   (h1-size medium-weight)
    └── text-container block (body-unica-32-reg, if subtitle exists)
```

### 7.6 Separator Height Decision Table

| Context | AEM Indicator | EDS Height Variant |
|---|---|---|
| Section-level break (between major sections) | Container with `height-short` or standalone separator container | `separator-height-80` or `separator-height-96` |
| Content sub-section break | Separator between text blocks within a section | `separator-height-24` |
| Tight inline divider | Separator between related elements (e.g., title and content) | `separator-height-8` |
| Story article section break | Between story body sections | `separator-height-24` |
| Colored section bottom | Separator at bottom of bg-colored section | `separator-height-48` |

### 7.7 Complete AEM Class → EDS Section Type Decision Tree

```
Is the AEM container a cmp-container-full-width with height + background?
  ├── YES → Create Section with hero-container block inside
  │         Add breadcrumb, custom-title, text-container as child blocks
  └── NO
      Does the container have a .grid-row child?
        ├── YES → Create Grid Container section
        │         For each grid-row__col-with-N → create Grid Section (grid-cols-N)
        │         Map child components inside each Grid Section
        └── NO
            Is it a separator-only container?
              ├── YES → Create Section with separator-container class
              └── NO → Create regular Section
                        Map child components as blocks
```
