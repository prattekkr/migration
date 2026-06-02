# AbbVie EDS Migration Skill — Master Reference

> This is the definitive reference for building import scripts for ANY page template.
> It covers the complete EDS composition system, all 41 blocks, CSS utility vocabulary,
> grid layout patterns, and content structure rules.

---

## CORE ARCHITECTURE

### Section System
- Every page is a sequence of SECTIONS (rendered as `<div>` per line in `.plain.html`)
- Sections are separated by `<hr>` in the import output
- Each section can contain multiple BLOCKS
- The LAST block in a section should be `Section Metadata` (defines section classes)

### Block System
- Blocks are defined by `<div class="block-name variant-classes">` in plain.html
- Inside: rows of `<div>` containing cells of `<div>`
- EDS framework auto-loads `blocks/{name}/{name}.js` and `.css`
- Block JS reads rows, extracts config, and transforms DOM

### Common Properties (applyCommonProps)
Most blocks have 3 trailing rows consumed by JS:
- blockId → sets `id` attribute
- language → sets `lang` attribute  
- analyticsId → sets `data-analytics-id`

---

## GRID LAYOUT SYSTEM

### 12-Column Grid Pattern

```
grid-container (parent)    ← display: grid; grid-template-columns: repeat(12, 1fr)
  grid-cols-2 (left)       ← grid-column: span 2 (spacer)
  grid-cols-8 (content)    ← grid-column: span 8 (main content)
  grid-cols-2 (right)      ← grid-column: span 2 (spacer)
```

### In plain.html:
```
Section: [Section Metadata: style=grid-container, content-regular]
Section: [Section Metadata: style=grid-cols-2]
Section: [ALL CONTENT BLOCKS + Section Metadata: style=grid-section, grid-cols-8]
Section: [Section Metadata: style=grid-cols-2]
```

### Container Width Classes (on grid-container section):
| Class | Max-width |
|-------|-----------|
| `content-regular` | --corp-layout-container-max-width-md |
| `content-wide` | no additional constraint |
| (default) | --corp-layout-container-max-width-lg (133rem) |

### Column Span Values:
`grid-cols-1` through `grid-cols-12` (span N of 12 columns)

Common patterns:
- `2-8-2` = centered narrow article
- `3-6-3` = very narrow centered
- `4-8` = sidebar + main
- `6-6` = two equal columns

---

## BLOCK WIDTH UTILITY CLASSES

Applied on blocks (text-container, custom-title, accordion, etc.):

| Class | Grid Columns (desktop 12-col) | Approx % |
|-------|-------------------------------|-----------|
| `full-width` | 1 / span 12 | 100% |
| `width-x-large` | 2 / span 10 | 83% |
| `width-large` | 2 / span 9 | 75% |
| `width-medium` | 3 / span 8 | 67% |
| `width-small` | 3 / span 7 | 58% |
| `width-x-small` | 4 / span 6 | 50% |
| `width-xx-small` | 4 / span 5 | 42% |
| `width-xxx-small` | 5 / span 4 | 33% |

Alignment modifiers: `align-left`, `align-center`, `align-right`

---

## TYPOGRAPHY CLASSES

### Font Size (on text-container, eyebrow-text):
| Class | Size |
|-------|------|
| `body-unica-32-reg` | 32px — lede/intro text |
| `body-unica-26-reg` | 26px |
| `body-unica-24-reg` | 24px |
| `body-unica-20-reg` | 20px — media inquiries |
| `body-unica-18-reg` | 18px |
| `body-unica-16-reg` | 16px — default body |
| `body-unica-14-reg` | 14px — disclaimers |

### Heading Size (on custom-title):
| Class | Visual size |
|-------|-------------|
| `h1-size` | Largest heading |
| `h2-size` | Large heading |
| `h3-size` | Medium heading |
| `h4-size` | Small heading |
| `h5-size` | Smallest heading |

### Font Weight:
- `book-weight` — lighter weight
- `regular-font` — normal weight (400)
- `bold-font` — bold (700)

---

## SPACING CLASSES

### On blocks:
| Class | Effect |
|-------|--------|
| `spacing-bottom` | margin-bottom: 32px (mobile), 80px (tablet+) |
| `section-padding` | padding-block: 40px |
| `margin-0` / `no-margin` | Remove margin |

### Separator heights:
`separator-height-1`, `8`, `16`, `24`, `32`, `48`, `64`, `80`, `96`, `112`, `128`, `144`

---

## THEME/COLOR CLASSES

| Class | Effect |
|-------|--------|
| `dark` / `dark-theme` | Dark navy background, white text |
| `light` / `light-theme` | White/light background, navy text |
| `navy` | Navy background |
| `purple` | Purple background |
| `highlight` | Light lavender background |
| `navy-overlap` | Navy with hero overlap card |
| `purple-overlap` | Purple with hero overlap card |

---

## SECTION METADATA CLASSES

### Layout:
- `grid-container` — enables 12-col grid
- `grid-section` — marks as grid child
- `grid-cols-N` — span N columns
- `content-regular` — standard max-width
- `content-wide` — wider max-width

### Spacing:
- `section-padding` — vertical padding
- `no-bottom-margin` — remove bottom margin
- `no-top-padding` — remove top padding
- `no-side-margin` — remove side margins

### Visual:
- `medium-radius` — border-radius
- `large-radius` — larger border-radius
- `bg-f4f4f4` — gray background

### Container width:
- `container-xxx-large` through `container-xxx-small`

---

## ALL 41 BLOCKS — QUICK REFERENCE

### Content Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `text-container` | Rich text paragraphs | width-*, spacing-bottom, body-unica-*, two-columns, anchor-link |
| `custom-title` | Decoupled heading sizes | h1-size through h5-size, width-*, book-weight |
| `eyebrow-text` | Category/label text | regular-font, mini, bold-font, divider |
| `quote` | Pull quotes/blockquotes | quote-standard, quote-h4, quote-large, quote-dashboard |
| `table` | Data tables | (no variants) |

### Media Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `hero-container` | Full-width hero banner | dark/navy/purple, height-*, overlay-height-*, landing |
| `hero` | Simple hero (older) | (no variants) |
| `custom-image` | Inline images | is-logo, is-circular |
| `carousel` | Image/content slider | carousel-minimal, carousel-show-btn-margin, vertical |
| `brightcove-video` | Brightcove player | (complex config) |
| `brightcove-podcast-player` | Podcast player | (complex config) |
| `video` | HTML5 video | (simple) |
| `embed` | iFrame embeds | (no variants) |

### Navigation Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `cta` | Call-to-action links | default-cta, external-cta, internal-cta, back-cta, popup-close |
| `breadcrumb` | Page breadcrumb trail | (no variants) |
| `linklist` | Link lists | standard, rows-with-arrows, icons, footer-primary, footer-legal, carousel, detailed-list |
| `tabs` | Tabbed content | (no variants) |
| `accordion` | Expandable sections | accordion-icon-font, h5-size, width-* |

### Card/Teaser Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `cards` | Card grid | story, video, stats, related |
| `story-card` | Story metadata card | storyCardInfo, cardInfo, leaderInfo, sidePanel, relatedContent |
| `story-cards` | Multiple story cards | (grid layout) |
| `teaser` | Feature teasers | dark-theme, teaser-h* |
| `fact-card` | Statistics/KPIs | dark-theme, dashboard |

### Layout Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `columns` | Multi-column layout | bullet-list, square-list, order-content-first-mobile |
| `separator` | Vertical spacing | separator-height-1 through 144 |
| `fragment` | Content fragment embed | (no variants) |
| `modal` | Popup modal | (no variants) |

### Page Structure Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `header` | Site header/nav | (complex) |
| `footer` | Site footer | (complex) |
| `navigation-content` | Nav mega-menu content | (internal) |

### Feed/Dynamic Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `editorial-feed` | Article feed | (config-driven) |
| `news-feed` | News/PR feed | (config-driven) |
| `press-releases` | Press release list | (config-driven) |
| `stock-ticker` | Stock price widget | (no variants) |
| `pipeline` | Pipeline visualization | (complex) |

### Utility Blocks:
| Block | Purpose | Key Variants |
|-------|---------|--------------|
| `search` | Search interface | (complex) |
| `search-input` | Search input field | (simple) |
| `social-media` | Social sharing | (no variants) |
| `embed-form` | Form embed | (no variants) |
| `tag-utility-nav` | Tag filtering | (complex) |
| `pipeline-utility-nav` | Pipeline filter | (complex) |

---

## BLOCK ROW STRUCTURES (for import scripts)

### hero-container — 6 cols per item
```
[0] image (picture)
[1] videoUrl (empty for static hero)
[2] text (overlay headings/paragraphs)
[3] bgColor (dark/navy/purple/light/empty)
[4] ctaLabel (button text)
[5] ctaUrl (button link)
```

### cta — 12 rows
```
[0] link content (<a> element)
[1] ariaLabel
[2] ctaTarget (_self/_blank)
[3] iconType (none/icon-font/image)
[4] iconFont (chevron/arrow/etc)
[5] iconImage
[6] iconPosition (before/after)
[7] ariaHidden (false/true)
[8] warnOnDeparturePopupFragmentPath (AEM path to departure modal, empty)
[9-11] commonProps (blockId, language, analyticsId)
```

### story-card — 13 rows (per component-models.json)
```
[0] storyCardVariant (storyCardInfo/cardInfo/leaderInfo/sidePanel/relatedContent)
[1] hidePublicationDate (true/false — inverse: true=hide)
[2] hideReadTime (true/false)
[3] hideRole (true/false)
[4] hideDescription (true/false)
[5] hideImage (true/false)
[6] id (block ID, empty)
[7] customClass (CSS class, empty)
[8] page (<a> element with page path)
[9] openInNewTab (true/false)
[10] ctaLabel (CTA button text, empty)
[11] (unused, empty)
[12] language (language code or empty)
```
⚠️ Import scripts use a LEGACY row format (show* fields instead of hide*) for backward
   compatibility with existing content. The xwalk model fields above are the source of truth.
   When writing NEW import scripts, use the model field names above.

### custom-title — 4 rows
```
[0] heading element (<h1>-<h6>)
[1-3] commonProps (blockId, language, analyticsId)
```

### text-container — 4+ rows (CRITICAL: one <p> per row for md2jcr)
```
[0] blockId (empty) ← removed by applyCommonProps(block, 0)
[1] language (none) ← removed by applyCommonProps
[2] analyticsId (empty) ← removed by applyCommonProps
[3+] content — ONE paragraph per row (NOT multiple <p> in same row)
```
⚠️ md2jcr WILL FAIL if a content row contains multiple <p> elements.
Each paragraph MUST be its own separate row after commonProps.
Example:
  CORRECT: [[''], ['none'], [''], [p1], [p2], [p3]]  ← 6 rows, one <p> each
  WRONG:   [[''], ['none'], [''], [divWithMultiplePs]] ← 4 rows, multiple <p> crammed in row[3]

### separator — 4 rows
```
[0] showLine (false/true)
[1-3] commonProps
```

### custom-image — 16 rows
```
[0] image (picture)
[1] isLogo (false/true)
[2] isCircular (false/true)
[3] caption
[4] hasLink (false/true)
[5] linkNewTab (false/true)
[6] hasHiddenPanel (false/true)
[7] hiddenPanelContent
[8] linkTarget (_self/_blank)
[9] linkUrl
[10] hasModal (false/true)
[11] modalContent
[12] imageAlt
[13-15] commonProps
```

### carousel — 25 rows (config only, slides from consumeSiblings)
```
[0] desktopSlidesToShow
[1] carouselType (static/dynamic)
[2] showArrows (false/true)
[3] autoplayInterval (ms)
[4] loop (false/true)
[5] mobileSlidesToShow
[6] showCounter (false/true)
[7] tabletSlidesToShow
[8] autoplay (false/true)
[9] bypassMobile (false/true)
[10] showNavDots (true/false)
[11] consumeSiblings (true/false)
[12] enableSwipe (false/true)
[13-18] reserved
[19] useRSSFeed (false/true)
[20] rssUrl
[21] rssType (none/editorial/news)
[22-24] commonProps
```

### accordion — 21 block-level rows + 5-col child rows
```
Block-level fields (21 rows, single cell each):
[0]  blockHeading (e.g. "References")
[1]  classes_allowMultipleOpen (false)
[2]  classes_showExpandCollapseAll (true/false)
[3]  expandAllLabel ("Expand All")
[4]  collapseAllLabel ("Collapse All")
[5]  classes_iconType ("accordion-icon-font")
[6]  expandAllIcon ("plus")
[7]  collapseAllIcon ("minus")
[8]  expandIcon ("plus")
[9]  collapseIcon ("minus")
[10] expandAllIconImage (empty)
[11] collapseAllIconImage (empty)
[12] expandIconImage (empty)
[13] collapseIconImage (empty)
[14] ariaExpandAllLabel (empty)
[15] ariaCollapseAllLabel (empty)
[16] classes_customDynamicClass (empty)
[17] blockId (empty)
[18] classes_commonCustomClass (empty)
[19] language (none)
[20] analytics_id (empty)

Child rows (accordion-item model — 5 columns each):
[summary, richtext-content, classes_defaultOpen, ariaExpandLabel, ariaCollapseLabel]
```
⚠️ The accordion filter references `accordion-item` which EXISTS in component-definition.json.
⚠️ Each child row MUST have exactly 5 columns matching the accordion-item model fields.

### quote — 11 rows
```
[0] quoteType (quote-standard/quote-dashboard/quote-large/...)
[1] quotation (text)
[2] attributionName (e.g. "Phil Hajduk, Ph.D")
[3] attributionRole (e.g. "VP, IT Information Research, AbbVie")
[4] attributionImage (picture element — from .cmp-quote__author-block img)
[5] quoteFragment (CF path, empty)
[6] backgroundImage (picture, empty)
[7] backgroundImageAlt (empty)
[8-10] commonProps (blockId, language, analyticsId)
```
⚠️ Source DOM extraction for quotes:
- Quote text: `.cmp-quote__text` or `.cmp-quote__text-author-wrapper .cmp-quote__text`
- Author name: `.cmp-quote__author-name` or `[class*="author-name"]`
- Author title: `.cmp-quote__author-title` or `[class*="author-title"]`
- Author image: `.cmp-quote__author-block img` or `[class*="author-block"] img.author-img`

### brightcove-video — 33 rows (ROW indices from blocks/brightcove-video.js)
```
[0]  projectNumber (empty)
[1]  overlayTitle (text — from .cmp-title h2 or data-overlay-title)
[2]  overlayDescription (empty)
[3]  posterType (brightcove/color/custom)
[4]  posterImage (empty for brightcove type)
[5]  posterAlt (empty)
[6]  colorOverlay (none/#071D49)
[7]  overlayButtonText (e.g. "Watch Video" or "Watch 0:30")
[8]  overlayButtonIconType (icon-font)
[9]  overlayButtonFontIcon (play)
[10] overlayButtonImageIcon (empty)
[11] iconPosition (left)
[12] playerType (single/playlist/3d-video)
[13] accountId (e.g. "2157889325001" or "2157889328001") ← ROW.ACCOUNT_ID
[14] playerId (default) ← ROW.PLAYER_ID
[15] videoId (e.g. "6362173507112") ← ROW.VIDEO_ID — CRITICAL
[16] playlistId (empty)
[17] defaultPlaylistVideoId (empty)
[18] playlistType (carousel)
[19] videoContentLayout (none)
[20] enablePlaylistThumbnailMetadata (false)
[21] captionTitle (empty)
[22] captionDescription (empty)
[23] playButtonAriaLabel (empty)
[24] videoCaption (empty)
[25] enableAutoplay (false)
[26] enableLoop (false)
[27] enableCaptions (false)
[28] enableVideoChapters (false)
[29] enableRecommendedVideo (false)
[30] enablePlayerControls (true)
[31] enableSocialShare (false)
[32] enableTranscript (false)
```
⚠️ ROW INDICES ARE CRITICAL — the block JS reads accountId at [13], playerId at [14], videoId at [15].
   If these are at wrong positions, video won't load.
⚠️ Source DOM extraction:
  - videoId: `[data-video-id]` attribute on `<video-js>` or `[data-video-id]` element
  - accountId: `[data-account]` or `[data-account-id]` attribute
  - playerId: `[data-player]` attribute (default: "default")
  - overlayTitle: sibling `.cmp-title h2` or `data-overlay-title` attribute
  - watchLabel: `button[class*="watch"]` or `.cmp-video__cta-text` text

### fact-card — 9 block-level rows (content fragment based, no inline data)
```
[0] contentFragment (empty — requires CF authoring in AEM)
[1] hideImage (false)
[2] imagePreset (empty)
[3] imageModifiers (empty)
[4] classes_customDynamicClass (empty)
[5] blockId (empty)
[6] classes_commonCustomClass (empty)
[7] language (none)
[8] analytics_id (empty)
```
⚠️ Fact Card uses Content Fragments — stat data (numbers, descriptions) cannot be inlined.
   Import scripts output empty contentFragment rows. Authors must link CFs after import.
⚠️ Filter has empty `components: []` — do NOT add non-existent child IDs.

### eyebrow-text — 5 rows
```
[0] text content
[1] linkUrl (optional)
[2] linkTarget (_self/_blank)
[3-5] commonProps (at startIndex=2 or 3)
```

### columns — N rows (one per column pair)
```
Each row = one horizontal group
Each cell within row = one column
No fixed structure — content-driven
```

### cards — N rows (one per card)
```
Each row = one card
Cell 0 = image
Cell 1 = text content (heading + description + link)
```

---

## IMPORT SCRIPT PATTERNS

### XWALK SECTION-METADATA FORMAT (CRITICAL)

Section Metadata classes go in the **block name** (class attribute), NOT as a `style` row inside.
The row inside contains `language`/`none` (for grid-container/grid-section) or empty (for grid-cols-2 spacers).

**Underlying xwalk model property mapping (from component-models.json):**

| Section Type | Model ID | Key Property | Value | Rendering |
|---|---|---|---|---|
| Regular section | `section` | `style_customDynamicClass` | Dynamic picklist classes | Section gets picklist classes |
| Grid Section | `grid-section` | `style_container` (hidden) | `"grid-section"` (auto) | Always has `grid-section` class |
| Grid Section | `grid-section` | `style_customDynamicClass` | e.g. `"grid-cols-8"` | Additional classes appended |
| Grid Container | `grid-container` | `style_container` (hidden) | `"grid-container"` (auto) | Always has `grid-container` class |
| Grid Container | `grid-container` | `style_customDynamicClass` | e.g. `"content-regular"` | Additional classes appended |

⚠️ Properties prefixed with `style_` are rendered as CSS classes on the section `<div>`.
   The `style_container` field is **hidden** and auto-set — authors cannot change it.
   The `style_customDynamicClass` is a dynamic picklist for additional layout classes.

**Additional model fields on all section types:**
- `name` — Section name (text, for UE display)
- `background` — Background image (custom-asset)
- `blockId` — Section element ID
- `classes_commonCustomClass` — Custom CSS class
- `language` — Language attribute (select, default: "none")
- `analytics_id` — Analytics tracking ID

```javascript
// CORRECT (xwalk format) — classes in block name:
function makeSectionMetadata(document, style) {
  if (style.includes('grid-cols-2') && !style.includes('grid-section')) {
    return makeBlock(document, `Section Metadata (${style})`, [['']]);
  }
  return makeBlock(document, `Section Metadata (${style})`, [['language', 'none']]);
}
```
```html
<!-- produces: -->
<div class="section-metadata grid-container content-regular">
  <div><div>language</div><div>none</div></div>
</div>
```
```javascript
// WRONG (old format) — classes as style row value:
makeBlock(document, 'Section Metadata', [['style', 'grid-container, content-regular']]);
```

### PAGE METADATA — MANDATORY Metadata Block

⚠️ **EVERY migrated page MUST have a `metadata` block as the LAST section.**
Without it, md2jcr cannot populate JCR page properties and the page will have
no title, description, image, or date in the content repository.

The metadata block uses **JCR property names** from the `page-metadata` model as keys.
Each row is 2 columns: `[propertyName, value]`.

**MANDATORY fields** (must always be present):
```html
<div class="metadata">
  <div><div>jcr:title</div><div>Three ways AI is changing drug discovery at AbbVie</div></div>
  <div><div>jcr:description</div><div>Explore how artificial Intelligence...</div></div>
  <div><div>image</div><div><img src="https://www.abbvie.com/content/dam/...hero.jpg"></div></div>
  <div><div>publicationDate</div><div>September 25, 2024</div></div>
  <div><div>storyReadTime</div><div>6</div></div>
  <div><div>eyebrowText</div><div>Science</div></div>
  <div><div>cardTitle</div><div>Three ways AI is changing drug discovery at AbbVie</div></div>
  <div><div>cardDescription</div><div>Explore how artificial Intelligence...</div></div>
  <div><div>template</div><div>story-article</div></div>
</div>
```

**JCR property name mapping** (from `page-metadata` model in `component-models.json`):

| Key in metadata block | JCR Property | Source on live page |
|---|---|---|
| `jcr:title` | Page title | `document.title` (strip " \| AbbVie") |
| `jcr:description` | SEO description | `meta[name="description"]` content |
| `image` | Hero/card image | `meta[property="og:image:url"]` content (as `<img>` element) |
| `publicationDate` | Publication date | DOM text match `(\w+ \d{1,2}, \d{4})` in intro |
| `readWatchTime` | Read/Watch toggle | "readTime" or "watchTime" (default: "readTime") |
| `storyReadTime` | Read time (minutes) | DOM text match `(\d+)\s*Minute\s*Read` |
| `storyWatchTime` | Watch time (minutes) | For video-based stories (default: 5) |
| `eyebrowText` | Category label | Category link text (e.g., "Science", "Neuroscience") |
| `cardTitle` | Card title for listings | Same as `jcr:title` |
| `cardDescription` | Card description | Same as `jcr:description` |
| `cardImage` | Card image (override) | Optional card-specific image (custom-asset) |
| `cardImageAlt` | Card image alt text | Alt text for card image override |
| `ctaText` | CTA button text | Custom CTA label for card listings |
| `navTitle` | Navigation title | Override title for breadcrumb/nav (if different from jcr:title) |
| `hideFromNavigation` | Hide from nav | boolean — exclude page from auto-generated navigation |
| `template` | Template name | Hardcoded per template (e.g., "story-article") |

**Extraction from source page:**
```javascript
const pageTitle = (document.title || '').replace(/\s*\|\s*AbbVie\s*$/, '').trim();
const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
const ogImage = document.querySelector('meta[property="og:image:url"]')?.getAttribute('content') || '';
// Date + readTime + category from .overlap-predecessor text content
```

**Image field format:** The `image` value must be an `<img>` element (NOT a text URL):
```javascript
const imgEl = document.createElement('img');
imgEl.src = ogImage;  // full URL from og:image:url
metaRows.push(['image', imgEl]);
```

The `storyCardInfo` story-card resolves additional display metadata from query-index at runtime,
but the metadata block is what populates the JCR page node properties during md2jcr conversion.

### RELATED CONTENT CARDS

Related content uses `story-card` blocks with path-based resolution:

1. **Sidebar card** (right gutter): `sidePanel` variant in `grid-cols-2` section
2. **Bottom cards**: `relatedContent` variant in body `grid-cols-8` section

Both resolve card data (image, title, description) from `query-index-en.json` at runtime.
They will NOT render on localhost (no query-index), but WILL work on AEM environment.

```javascript
// Sidebar card — story-card sidePanel variant (12 rows)
// Goes in the right grid-cols-2 section
makeBlock(document, 'Story Card', [
  ['sidePanel'], ['false'], ['false'], ['false'], ['false'], ['false'],
  [''], [''], [categoryLinkElement], ['true'], [''], [''],
]);

// Bottom related card — story-card relatedContent variant (12 rows)
// Goes inside grid-cols-8 body section
makeBlock(document, 'Story Card', [
  ['relatedContent'], ['true'], ['false'], ['true'], ['false'], ['false'],
  [storyPath], [''], [''], ['false'], [''], [''],
]);
```

The `categoryPath` (row[8]) must be an `<a>` element:
```javascript
const a = document.createElement('a');
a.href = '/science';  // original href
a.textContent = '/content/abbvie-nextgen-eds/abbvie-com/us/en/science';  // JCR path
```

### SIDEBAR LAYOUT DETECTION

Pages with a sidebar card have this DOM structure:
```
grid-container → grid-row → [col-with-2 (spacer), col-with-8 (body), col-with-2 (sidebar card)]
```

Detection in import script:
```javascript
const gridRow = child.querySelector('.grid-row');
const cols = Array.from(gridRow.children).filter(c => (c.className || '').includes('col-with'));
const col8 = cols.find(c => c.className.includes('col-with-8'));
const sidebarCol = cols.find(c => c.className.includes('col-with-2') && c.querySelector('.cardpagestory'));
if (col8 && sidebarCol) {
  // Use col8 for body content, sidebarCol card goes in right gutter
}
```

### Standard Story Article (2-8-2 grid):
```javascript
// Section 1: Hero + intro
output.appendChild(makeHeroContainer(...));
output.appendChild(makeCTA(...));
output.appendChild(makeStoryCard(document, categoryHref, categoryJcrPath));
output.appendChild(makeCustomTitle(title, 1, 'h1-size'));
output.appendChild(makeTextContainer(lede, 'body-unica-32-reg'));
output.appendChild(makeSectionMetadata('content-wide, medium-radius'));
output.appendChild(document.createElement('hr'));

// Section 2: Grid container parent
output.appendChild(makeSectionMetadata('grid-container, content-regular'));
output.appendChild(document.createElement('hr'));

// Section 3: Left spacer
output.appendChild(makeSectionMetadata('grid-cols-2'));
output.appendChild(document.createElement('hr'));

// Section 4: Body content (narrow column)
bodyBlocks.forEach(block => output.appendChild(block));
output.appendChild(makeSectionMetadata('grid-section, grid-cols-8'));
output.appendChild(document.createElement('hr'));

// Section 5: Right spacer (or sidebar card)
if (sidebarCard) output.appendChild(makeSidePanelCard(sidebarCard));
output.appendChild(makeSectionMetadata('grid-cols-2'));
```

### Content Root Detection (AEM pages):
```javascript
// Story articles: .overlap-predecessor is the key landmark
const overlapEl = document.querySelector('.overlap-predecessor');
const contentRoot = overlapEl?.parentElement;
const heroContainer = contentRoot.children[overlapIdx - 1];
const introContainer = contentRoot.children[overlapIdx];
// Body may have grid-row with col-with-8 + sidebar col-with-2
const bodySection = contentRoot.children[overlapIdx + 1];
```

---

## CLASS COMBINATION RULES

### Valid combinations on text-container:
- `spacing-bottom width-large` — standard body paragraph
- `body-unica-32-reg` — intro/lede (no width class = full)
- `spacing-bottom width-x-large body-unica-20-reg` — media inquiries
- `standard custom-class` — image captions
- `width-large section-padding` — closing paragraph with extra spacing
- `two-columns width-large` — side-by-side layout

### Valid combinations on custom-title:
- `h1-size` — article title (always alone)
- `h5-size width-large` — section subheading
- `h3-size book-weight spacing-bottom section-padding` — decorative heading
- `h5-size` — small heading without width constraint

### Valid combinations on Section Metadata:
- `content-wide, medium-radius` — hero overlay section
- `grid-container, content-regular` — grid parent
- `grid-section, grid-cols-8` — main content column
- `grid-cols-2` — spacer column
- `bg-f4f4f4, no-bottom-margin, section-padding, content-wide` — gray section
- `container-xx-large, section-padding` — wide padded section

---

## DATA PRESERVATION CHECKLIST

Every import script MUST preserve:
- [ ] ALL heading text (h1-h6)
- [ ] ALL paragraph text (no truncation)
- [ ] ALL links (href, text, target)
- [ ] ALL images (src, alt)
- [ ] ALL image captions
- [ ] ALL quotes with attribution (name, title, author image)
- [ ] ALL accordion items (summary + content)
- [ ] ALL carousel slides
- [ ] ALL Brightcove videos (accountId, videoId, overlayTitle)
- [ ] Metadata (date, category, read time)
- [ ] Media contact information
- [ ] External link references
- [ ] Internal navigation links
- [ ] Footnotes/references
- [ ] Related content cards (images + headings + links)
- [ ] Correct section ordering
- [ ] Correct block ordering within sections

---

## md2jcr COMPATIBILITY RULES

These rules MUST be followed for import output to pass md2jcr conversion without errors.

### Rule 1: One paragraph per row in text-container
md2jcr treats each row after commonProps as a separate child item.
Multiple `<p>` elements in one row causes mapping failure.
```javascript
// CORRECT — each <p> is its own row:
const rows = [[''], ['none'], ['']];
paragraphs.forEach(p => rows.push([p.cloneNode(true)]));
makeBlock(document, 'Text Container (...)', rows);

// WRONG — multiple <p> in one row:
makeBlock(document, 'Text Container (...)', [[''], ['none'], [''], [divWithMultiplePs]]);
```

### Rule 2: All blocks MUST have filter entries in component-filters.json
Every block used in migrated content must have an entry in `component-filters.json`.
Missing entries cause: `Cannot read properties of undefined (reading 'components')`
```json
// If block has no children, use empty array:
{ "id": "custom-image", "components": [] }
// If block has defined children in component-definition.json:
{ "id": "text-container", "components": ["text-container-image", "text-container-text"] }
```
⚠️ Child component IDs in `components[]` MUST exist in `component-definition.json`.
   Non-existent children cause: `Cannot read properties of undefined (reading 'modelId')`

### Rule 3: Brightcove Video row indices are fixed
The block JS uses hardcoded ROW indices (ROW.ACCOUNT_ID=13, ROW.VIDEO_ID=15).
Video will not play if values are at wrong row positions.

### Rule 4: Quote attribution fields must be separate rows
```
[2] authorName — separate from title
[3] attributionRole — separate from name  
[4] authorImage — <picture><img> element or empty
```
Do NOT combine name+title into one field.

### Rule 5: Hero Container uses ONE row with 6 cells
```javascript
// CORRECT — 1 row, 6 cells:
[[picElement, '', '', '', '', '']]
// WRONG — 6 rows (creates 6 rotation items, 5 empty):
[[picElement], [''], [''], [''], [''], ['']]
```

### Rule 6: Related content uses story-card with path resolution
Bottom related cards use `story-card relatedContent` variant with JCR storyPath.
Sidebar cards use `story-card sidePanel` variant with categoryPath `<a>` element.
These resolve dynamically from `query-index-en.json` — they won't render on localhost.

### Rule 7: Section Metadata uses class-based format
Grid classes go in the block name (class attribute), NOT as a style row.
```javascript
// CORRECT: makeBlock('Section Metadata (grid-container, content-regular)', [['language', 'none']])
// WRONG:   makeBlock('Section Metadata', [['style', 'grid-container, content-regular']])
```

### Rule 8: Metadata block is MANDATORY — NEVER omit it
Page metadata MUST be included as a `metadata` block in the LAST section.
md2jcr converts this block into JCR page properties (`jcr:title`, `jcr:description`,
`image`, `publicationDate`, `storyReadTime`, `eyebrowText`, `cardTitle`, etc.).
Without it, the page node will have NO properties and will not appear in search,
navigation, story-card resolution, or any content listing.
Keys MUST match the `page-metadata` model field names in `component-models.json`.
The `image` value MUST be an `<img>` element, not a text URL string.

### Rule 9: story-card categoryPath uses `<a>` element with JCR path
```javascript
const a = document.createElement('a');
a.href = '/who-we-are/our-stories/science-stories';  // site-relative href
a.textContent = '/content/abbvie-nextgen-eds/abbvie-com/us/en/who-we-are/our-stories/science-stories'; // JCR path
// Pass as row[8] in story-card block
```

### Blocks requiring filter entries (add to component-filters.json if missing):
```
carousel, cta, custom-image, story-card, quote, fact-card,
brightcove-video, custom-title, separator, eyebrow-text, cards
```
All entries must have `"components": []` unless the block has defined children
in `component-definition.json`.
