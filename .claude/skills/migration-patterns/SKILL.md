# AbbVie EDS Import Patterns — Skill Reference

This document is the source of truth for building import scripts.
It defines the exact EDS composition patterns used in the AbbVie project.

---

## 1. GRID LAYOUT SYSTEM

The AbbVie EDS project uses a **12-column CSS grid** for page layout.

### How it works:

1. A `grid-container` section defines the grid parent
2. Consecutive `grid-cols-*` sections become grid children (columns)
3. `scripts.js:addGridSectionsWrapper()` moves grid-cols sections into the grid-container at runtime

### The 2-8-2 Pattern (centered narrow content):

```
Section: grid-container, content-regular   ← parent grid (12 cols)
Section: grid-cols-2                       ← left spacer (2 cols)
Section: grid-cols-8                       ← content column (8 cols = 66%)
Section: grid-cols-2                       ← right spacer (2 cols)
```

This produces centered content at ~880px within a 1330px container.

### In plain.html format (xwalk — classes in block name):

```html
<div><div class="section-metadata grid-container content-regular"><div><div>language</div><div>none</div></div></div></div>
<div><div class="section-metadata grid-cols-2"><div><div></div></div></div></div>
<div>
  <!-- ALL BODY CONTENT BLOCKS GO HERE -->
  <div class="section-metadata grid-section grid-cols-8"><div><div>language</div><div>none</div></div></div>
</div>
<div><div class="section-metadata grid-cols-2"><div><div></div></div></div></div>
```

### Available grid-cols values:
- `grid-cols-1` through `grid-cols-12`
- Common patterns: 2-8-2, 3-6-3, 4-8, 6-6

### grid-container variants:
- `content-regular` — max-width: var(--corp-layout-container-max-width-md) at 1440px+
- `content-wide` — no additional max-width constraint
- `bg-f4f4f4` — gray background
- `section-padding` — adds vertical padding
- `no-bottom-margin` / `no-top-padding` — spacing overrides

---

## 2. BLOCK WIDTH UTILITY CLASSES

Within a grid column, individual blocks can further constrain their content width.

### Two-level width system:
1. **Grid level**: `grid-cols-8` sets the section to span 8/12 columns
2. **Block level**: `width-large` on a block sets its internal content to 9/12 of the block width

### Available width classes (on blocks like text-container, custom-title, accordion):

| Class | Grid span | Centering |
|-------|-----------|-----------|
| `full-width` | 12/12 | none |
| `width-x-large` | 10/12 | start col 2 |
| `width-large` | 9/12 | start col 2 + translateX |
| `width-medium` | 8/12 | start col 3 |
| `width-small` | 6/12 | start col 4 |
| `width-x-small` | 4/12 | start col 5 |
| `width-xx-small` | 3/12 | start col 5 |
| `width-xxx-small` | 2/12 | start col 6 |

### How blocks use width:
```html
<div class="text-container spacing-bottom width-large">
  <!-- block creates internal 12-col grid, content spans 9 cols centered -->
</div>
```

---

## 3. SECTION METADATA

Section metadata defines the layout behavior of each section.

### xwalk Model Properties (from component-models.json):
- **`style_container`** (hidden) — auto-set base class: `"grid-section"` or `"grid-container"`
- **`style_customDynamicClass`** — dynamic picklist for additional classes (e.g., `content-regular`, `grid-cols-8`)
- **`background`** — background image (custom-asset)
- **`language`** — language attribute (default: `"none"`)

### Format in plain.html (xwalk format — PREFERRED):
```html
<div class="section-metadata grid-container content-regular"><div><div>language</div><div>none</div></div></div>
```
Classes go in the **block name** (class attribute on the element).

### In import scripts (xwalk format — PREFERRED):
```javascript
makeBlock(document, 'Section Metadata (grid-container, content-regular)', [['language', 'none']]);
```

### Legacy format (still works for rendering but NOT for xwalk authoring):
```javascript
makeBlock(document, 'Section Metadata', [['style', 'grid-container, content-regular']]);
```

### Common section-metadata classes:

| Class | Purpose |
|-------|---------|
| `content-wide` | Wide container with medium-radius |
| `content-regular` | Standard width container |
| `medium-radius` | Border radius on section |
| `large-radius` | Larger border radius |
| `grid-container` | Enables 12-col grid on this section |
| `grid-section` | Marks section as a grid column child |
| `grid-cols-N` | Span N columns in parent grid |
| `no-bottom-margin` | Remove bottom margin |
| `section-padding` | Add vertical padding |
| `bg-f4f4f4` | Gray background |

---

## 4. STORY ARTICLE PAGE STRUCTURE

Story articles use this exact section hierarchy:

```
SECTION 1 — Hero overlay section
  Classes: content-wide, medium-radius
  Blocks:
    1. hero-container (height-default, overlay-height-short) — hero image
    2. cta (default-cta, back-cta) — "All Stories" back link
    3. story-card — metadata (storyCardInfo variant)
    4. custom-title (h1-size) — article title
    5. text-container (body-unica-32-reg) — lede/intro text
    6. Section Metadata (style: content-wide, medium-radius)

SECTION 2 — Grid container (parent)
  Classes: grid-container, content-regular
  Blocks:
    1. Section Metadata (style: grid-container, content-regular)

SECTION 3 — Left spacer
  Classes: grid-cols-2
  Blocks:
    1. Section Metadata (style: grid-cols-2)

SECTION 4 — Main body content (centered)
  Classes: grid-section, grid-cols-8
  Blocks (in order):
    - custom-title (h5-size, width-large) — section headings
    - text-container (spacing-bottom, width-large) — body paragraphs
    - text-container (standard, custom-class) — image captions (italic)
    - separator (separator-height-24) — vertical spacing
    - text-container (width-large) — continuation text
    - carousel (carousel-show-btn-margin, carousel-minimal) — image slides
    - custom-image — inline images
    - accordion (accordion-icon-font, h5-size, width-large) — references
    - text-container (spacing-bottom, width-x-large, body-unica-20-reg) — media inquiries
    - Section Metadata (style: grid-section, grid-cols-8)

SECTION 5 — Right spacer
  Classes: grid-cols-2
  Blocks:
    1. Section Metadata (style: grid-cols-2)
```

---

## 5. BLOCK FORMATS (Row Structure)

### hero-container (height-default, overlay-height-short)
CommonProps: handled internally (no applyCommonProps call)
CRITICAL: Each row = ONE hero item (for rotation). One row has 6 CELLS (columns).
6 cells per item row: [image], [videoUrl], [text], [bgColor], [ctaLabel], [ctaUrl]
For story pages: [image, imageAlt, videoUrl, '', '', '', ''] ← ONE row with 7 cells

⚠️ DO NOT create 7 separate rows — that makes 7 items for rotation (6 empty = broken).
✅ CORRECT: makeBlock(doc, 'Hero Container (...)', [[picP, imgAlt, videoUrl, '', '', '', '']])
❌ WRONG:   makeBlock(doc, 'Hero Container (...)', [[picP], [''], [''], [''], [''], [''], ['']])

### cta (default-cta, back-cta)
CommonProps: startIndex=9 → rows 9,10,11 are id/lang/analytics
12 rows total:
  [0] link content (<a> element)
  [1] ariaLabel (empty)
  [2] ctaTarget (_self)
  [3] iconType (none)
  [4] iconFont (chevron for back-cta)
  [5] iconImage (empty)
  [6] iconPosition (before for back-cta)
  [7] ariaHidden (false)
  [8] warnOnDeparturePopupFragmentPath (empty — AEM path to warn-on-leave modal)
  [9] blockId (empty) ← commonProp
  [10] language (none) ← commonProp
  [11] analyticsId (empty) ← commonProp

### story-card
CommonProps: handled internally
13 rows (per component-models.json):
  [0] storyCardVariant (storyCardInfo/cardInfo/leaderInfo/sidePanel/relatedContent)
  [1] hidePublicationDate (false — inverse logic: false=show)
  [2] hideReadTime (false)
  [3] hideRole (false)
  [4] hideDescription (false)
  [5] hideImage (false)
  [6] id (block ID, empty)
  [7] customClass (CSS class, empty)
  [8] page (<a> link to story page)
  [9] openInNewTab (false)
  [10] ctaLabel (CTA text, empty)
  [11] (unused, empty)
  [12] language (language code, empty)
⚠️ Existing import scripts use legacy show* format (showImage, showCategory, etc.)
   These still work for plain.html rendering but differ from the xwalk model fields.

### custom-title (h1-size | h5-size, width-large)
CommonProps: startIndex=1 → rows 1,2,3 are id/lang/analytics
4 rows total:
  [0] heading element (<h1>, <h5>, etc.)
  [1] blockId (empty) ← commonProp
  [2] language (none) ← commonProp
  [3] analyticsId (empty) ← commonProp

### text-container (variants)
CommonProps: startIndex=0 → rows 0,1,2 are id/lang/analytics
4+ rows total:
  [0] blockId (empty) ← commonProp (removed by JS)
  [1] language (none) ← commonProp (removed by JS)
  [2] analyticsId (empty) ← commonProp (removed by JS)
  [3+] text content (paragraphs, lists, links) ← stays in DOM

### separator (separator-height-24)
CommonProps: startIndex=1 → rows 1,2,3 are id/lang/analytics
4 rows total:
  [0] showLine (false = invisible spacer, true = visible line)
  [1] blockId (empty) ← commonProp
  [2] language (none) ← commonProp
  [3] analyticsId (empty) ← commonProp

### custom-image
CommonProps: startIndex=13 → rows 13,14,15 are id/lang/analytics
16 rows total:
  [0] image (<picture> element)
  [1] isLogo (false)
  [2] isCircular (false)
  [3] caption (empty or text)
  [4] hasLink (false)
  [5] linkNewTab (false)
  [6] hasHiddenPanel (false)
  [7] hiddenPanelContent (empty)
  [8] linkTarget (_self)
  [9] linkUrl (empty)
  [10] hasModal (false)
  [11] modalContent (empty)
  [12] imageAlt (empty — uses img alt attribute)
  [13] blockId (empty) ← commonProp
  [14] language (none) ← commonProp
  [15] analyticsId (empty) ← commonProp

### carousel (carousel-show-btn-margin, carousel-minimal)
CommonProps: startIndex=22 → rows 22,23,24 are id/lang/analytics
25 rows (config) + slide items:
  [0] desktopSlidesToShow (2)
  [1] carouselType (static)
  [2] showArrows (false)
  [3] autoplayInterval (3000)
  [4] loop (false)
  [5] mobileSlidesToShow (2)
  [6] showCounter (false)
  [7] tabletSlidesToShow (1)
  [8] autoplay (false)
  [9] bypassMobile (false)
  [10] showNavDots (true)
  [11] consumeSiblings (true)
  [12] enableSwipe (false)
  [13-18] reserved/empty
  [19] useRSSFeed (false)
  [20] rssUrl (empty)
  [21] rssType (none)
  [22] blockId (empty) ← commonProp
  [23] language (empty) ← commonProp
  [24] analyticsId (empty) ← commonProp
Note: When consumeSiblings=true, the carousel consumes the next N sibling blocks as slides.

### accordion (accordion-icon-font, h5-size, width-large)
CommonProps: startIndex=13 → rows 13,14,15 are id/lang/analytics
16+ rows:
  [0] title (e.g. "References")
  [1] expandAllLabel (Expand All)
  [2] collapseAllLabel (Collapse All)
  [3] expandIcon (plus)
  [4] collapseIcon (minus)
  [5] expandIconActive (plus)
  [6] collapseIconActive (minus)
  [7-12] reserved/empty
  [13] blockId (empty) ← commonProp
  [14] language (none) ← commonProp
  [15] analyticsId (empty) ← commonProp
  [16+] accordion-item rows: [summary, content, itemClass, ariaId, empty]

---

## 6. TYPOGRAPHY UTILITY CLASSES

Applied as variant classes on text-container and custom-title:

| Class | Purpose |
|-------|---------|
| `body-unica-32-reg` | Large intro/lede text (32px) |
| `body-unica-20-reg` | Medium text (20px, used for media inquiries) |
| `body-unica-14-reg` | Small text (14px, disclaimers) |
| `h1-size` | Heading 1 size on custom-title |
| `h3-size` | Heading 3 size on custom-title |
| `h5-size` | Heading 5 size on custom-title |
| `book-weight` | Light font weight |
| `spacing-bottom` | Adds bottom margin to block |
| `section-padding` | Adds padding to block |

---

## 7. IMPORT SCRIPT RULES

### Data preservation (NO LOSS):
- Extract ALL text content from source
- Preserve ALL links (href, text, target)
- Preserve ALL images (src, alt, caption)
- Preserve heading hierarchy
- Preserve quotes/citations
- Preserve accordion items
- Preserve carousel slides
- Preserve media contact info

### Section ordering:
- Hero section ALWAYS first
- Grid container/spacers wrap the body content
- Body blocks in EXACT source order
- References/accordion near the end
- Media inquiries LAST before closing spacer

### Utility class assignment:
- First body heading → `h5-size, width-large`
- Body paragraphs → `spacing-bottom, width-large`
- Image captions (italic) → `standard, custom-class`
- Continuation text after separator → `width-large` (no spacing-bottom)
- Media inquiries → `spacing-bottom, width-x-large, body-unica-20-reg`
- Lede text → `body-unica-32-reg`

---

## 8. CONTENT ROOT DETECTION

AEM story pages have this DOM structure:
```
.aem-Grid (contains 3 children):
  [0] Hero image container (large background image)
  [1] .overlap-predecessor (intro: back-link, metadata, h1, lede)
  [2] Body container (headings, text, images, carousel, accordion)
```

Detection strategy:
1. Find `.overlap-predecessor` element
2. Its parent is the content root
3. Sibling before overlap = hero image
4. Sibling after overlap = body content
