# AEM EDS Conversion Pipeline — plain.html → Markdown → JCR

> Definitive reference for producing plain.html that converts cleanly through
> `@adobe/helix-html2md` (v2.1) and `@adobe/helix-md2jcr` (v1.2).
> Use this when building or debugging import scripts.

---

## Pipeline Overview

```
plain.html  →  helix-html2md  →  markdown (.md)  →  helix-md2jcr  →  JCR XML (.xml)
```

Each stage has strict structural requirements. If the HTML doesn't conform,
content is silently dropped, misformatted, or causes conversion errors.

---

## Stage 1: plain.html → Markdown (helix-html2md)

### Required HTML Structure

```html
<html>
<head>
  <title>Page Title</title>
  <meta name="description" content="...">
</head>
<body>
  <header></header>
  <main>
    <div><!-- Section 1 --></div>
    <div><!-- Section 2 --></div>
  </main>
  <footer></footer>
</body>
</html>
```

⚠️ **CRITICAL:** Content MUST be inside `<main>`. No `<main>` = empty output.

### Section Rules

- Each top-level `<div>` child of `<main>` = one section
- First section's wrapper is removed (children promoted to top)
- Subsequent sections become `---` (thematic break) in markdown
- Empty `<div>` elements are silently removed

### Block Detection Rules

A `<div>` is detected as a block when ALL conditions are met:
1. Has a CSS class name (`class="block-name variant1 variant2"`)
2. Contains child `<div>` elements (rows)
3. Each row `<div>` contains child `<div>` elements (cells)

```html
<!-- ✅ CORRECT: Detected as block -->
<div class="hero-container height-default">
  <div><div>cell content</div></div>
</div>

<!-- ❌ WRONG: NOT detected (no class) -->
<div>
  <div><div>cell content</div></div>
</div>

<!-- ❌ WRONG: NOT detected (no div>div>div structure) -->
<div class="my-block">
  <p>just text</p>
</div>

<!-- ❌ WRONG: NOT detected (cells not wrapped in row div) -->
<div class="my-block">
  <div>content without cell wrapper</div>
</div>
```

### Block Name Conversion

CSS class → Block name (Title Case):
- `section-metadata` → `Section Metadata`
- `hero-container` → `Hero Container`
- `custom-title` → `Custom Title`
- `brightcove-video` → `Brightcove Video`

Multiple classes = name + variants in parentheses:
- `class="hero-container height-default overlay-height-short"`
  → `Hero Container (height-default, overlay-height-short)`

### ColSpan Handling

When rows have different numbers of cells, shorter rows get automatic colSpan:
```html
<div class="my-block">
  <div><div>spans all 3 cols</div></div>           <!-- 1 cell → colSpan=3 -->
  <div><div>col1</div><div>col2</div></div>        <!-- 2 cells → last gets colSpan=2 -->
  <div><div>col1</div><div>col2</div><div>col3</div></div>  <!-- 3 cells → no span -->
</div>
```

### Grid Table Output Format

Blocks become grid tables in markdown (NOT pipe tables):
```
+-------------------------------------------+
| Hero Container (height-default)           |
+-------------------------------------------+
| ![alt text][image0]                       |
+--------------------+----------------------+
| cell 1             | cell 2               |
+--------------------+----------------------+
```

### Image Handling

- `<picture>` with `<img>` → markdown image `![alt][imageN]`
- `<img>` directly → markdown image
- Alt text preserved from `alt` attribute
- Images become reference-style links at bottom of document
- Max 200 images per page (configurable)
- Data URI / blob URLs → discarded (use real URLs)

### Link Handling

- `<a href="url">text</a>` → `[text](url)`
- Links within block cells are preserved inline
- Link `title` attribute preserved: `[text](url "title")`

### Special Elements

- `<span class="icon icon-name">` → `:name:` (icon notation)
- `<sub>text</sub>` → `<sub>text</sub>` (raw HTML preserved)
- `<sup>text</sup>` → `<sup>text</sup>` (raw HTML preserved)
- `<u>text</u>` → `<u>text</u>` (raw HTML preserved)
- `<br>` in cells → `\` (backslash line break)
- `<pre><code>` → fenced code blocks

### Metadata Extraction

html2md auto-extracts from `<head>` into a Metadata grid table:
- `<title>` → `title` row
- `<meta name="X" content="Y">` → `X: Y` row
- `<meta property="og:X" content="Y">` → `og:X: Y` row
- `<html lang="X">` → `html-lang: X` row

⚠️ This auto-metadata is SEPARATE from our import script's Metadata block.
   Both may exist — md2jcr uses the Metadata grid table from the content.

### What Breaks html2md

| Issue | Result |
|-------|--------|
| No `<main>` element | Empty output (silent) |
| Block div without div>div>div structure | Content lost/misformatted |
| Invalid JSON-LD in `<script>` | Error 400 |
| HTML > 1MB | Rejected (409) |
| > 200 images | Error (TooManyImagesError) |
| Data URI images | Silently discarded |

---

## Stage 2: Markdown → JCR (helix-md2jcr)

### Section Handling

- `---` (thematic break) creates section boundaries
- Each section becomes a `<section>` JCR node
- Section Metadata grid table sets properties on the section node
- Only fields defined in the `section` model are output (extras silently dropped)

### Block Grid Table → JCR Component Node

1. **Header parsed**: `Block Name (class1, class2)` extracted via regex
2. **Component lookup**: Block name matched to `component-definition.json` title
3. **Model resolved**: Component's `modelId` links to `component-models.json`
4. **Fields mapped**: Content cells mapped to model fields sequentially

### Field Resolution Order (CRITICAL)

md2jcr maps content cells to model fields **sequentially**:

1. Images → `reference` type fields
2. Links → fields with link/linkText/linkTitle suffix pattern
3. Headings → fields with `*Type` suffix (stores h1-h6 level)
4. Richtext → consumes remaining content **greedily**

⚠️ **Greedy richtext**: A richtext field will consume ALL content until it hits
   an image or a field hint. This can swallow content meant for later fields.

### Field Hints (Override Automatic Resolution)

```html
<!-- field:fieldName -->
```

Use HTML comments to force field mapping when automatic resolution would fail:
```markdown
<!-- field:description -->
Some paragraph text that should go to the description field specifically.
```

### Multi-Row Blocks (Container Blocks)

Each row becomes a child item node: `item_0`, `item_1`, `item_2`, etc.

The filter in `component-filters.json` defines which child component types are allowed.
Child items use `sling:resourceType="core/franklin/components/block/v1/block/item"`.

### Multi-Cell Rows (Columns)

Multi-cell rows produce a hierarchy: `row1/col1`, `row1/col2`, etc.

### Classes/Variants Handling

- Single class: `classes="height-default"`
- Multiple classes: `classes="[height-default, overlay-height-short]"`
- `classes` is filtered OUT of `modelFields`

### Section Metadata → Section Node Properties

```markdown
+------------------+---------+
| Section Metadata |         |
+==================+=========+
| style            | Dark    |
+------------------+---------+
```

Becomes: `<section style="Dark">` in JCR.

⚠️ Only fields in the `section` model are output. Unknown keys are silently dropped.

### Page Metadata → jcr:content Properties

The "Metadata" grid table (case-insensitive header) maps to `jcr:content` page node:

| Markdown Key | JCR Property |
|---|---|
| `title` | `jcr:title` |
| `description` | `jcr:description` |
| `canonical` | `cq:canonicalUrl` |
| `robots` | `cq:robotsTags` |
| Any other key | Same name as property |

Special handling:
- Image values → child `<image>` node with `fileReference`
- Link values → extracts href URL only
- `aem-tag` fields → array format `"[tag1,tag2]"`
- `multiselect` fields → array format `"[a,b,c]"`
- `multi: true` fields → forced array format

### Boolean Fields

- Stored as `"[true]"` for checkbox-group components
- For regular boolean fields: `"true"` or `"false"` as strings

### Empty Cells

- Empty cells → attributes **omitted** from JCR (not empty string)
- This is correct behavior — consuming code handles missing attributes

### What Breaks md2jcr

| Issue | Result |
|-------|--------|
| Block name not in component-definition.json | Mapping failure |
| Content doesn't match model fields | Error: "content isn't mapping to model correctly" |
| HTML `<table>` elements in content | `UnsupportedElementError` |
| Field order mismatch without hints | Wrong field gets wrong content |
| Richtext greedily consuming next field's content | Missing data in subsequent fields |
| Data URI images | Silently discarded |
| Unknown section-metadata keys | Silently dropped |

---

## Import Script Rules (Ensuring Clean Conversion)

### Rule 1: Always Wrap in main > div Structure

```javascript
// The import output gets wrapped:
// <main><div>{section content}</div><div>{next section}</div>...</main>
// Use <hr> between sections — run-bulk-import.js splits on <hr> into <div>s
```

### Rule 2: Block Structure Must Be Exact

```javascript
// Outer div: class="block-name variant1 variant2"
// Inner divs: row > cell pattern
function makeBlock(document, name, rows) {
  // name = "Block Name (variant1, variant2)"
  // Each row = array of cells
  // Each cell = string or DOM node
}
```

Three-level nesting is MANDATORY:
```
div.block-name        ← Block container (with class)
  div                 ← Row
    div               ← Cell (content goes here)
    div               ← Cell
  div                 ← Row
    div               ← Cell
```

### Rule 3: One Paragraph Per Row in text-container

md2jcr maps each row to a model field. Multiple `<p>` in one cell may cause
the richtext field to greedily consume all content, preventing field mapping
for subsequent rows.

```javascript
// ✅ CORRECT — each <p> is its own row:
rows = [[''], ['none'], [''], [p1], [p2], [p3]];

// ❌ WRONG — multiple <p> in one cell:
rows = [[''], ['none'], [''], [divWithAllParagraphs]];
```

### Rule 4: Match Row Count to Model Fields

The block's model defines exactly which fields exist and in what order.
Your import script MUST produce exactly the right number of rows/cells
to match the model's field sequence.

```javascript
// If model has fields: [image, imageAlt, title, description, link]
// Then block must have exactly those cells in that order
```

### Rule 5: Images Must Use Real URLs

```javascript
// ✅ CORRECT:
img.src = 'https://abbvie.scene7.com/is/image/abbviecorp/hero-image';

// ❌ WRONG (will be discarded):
img.src = 'data:image/png;base64,...';
img.src = 'blob:https://...';
```

### Rule 6: Section Metadata Classes in Block Name

For xwalk format (required for md2jcr):
```javascript
// ✅ CORRECT — classes as part of block name:
makeBlock(document, 'Section Metadata (grid-container, content-regular)', [['language', 'none']]);
// Produces: class="section-metadata grid-container content-regular"

// ❌ WRONG — classes as style row (old DA format, NOT supported by md2jcr model):
makeBlock(document, 'Section Metadata', [['style', 'grid-container, content-regular']]);
```

### Rule 7: Metadata Block Keys Must Match page-metadata Model

md2jcr maps metadata keys to JCR properties using the `page-metadata` model.
Only keys that exist as field names in the model will be output.

Required keys: `jcr:title`, `jcr:description`, `image`, `template`
Story keys: `publicationDate`, `storyReadTime`, `eyebrowText`, `cardTitle`, `cardDescription`

### Rule 8: Use Field Hints When Order is Ambiguous

If a block has multiple richtext fields or content that might be consumed
by the wrong field, add HTML comment hints:

```javascript
const hint = document.createComment(' field:description ');
cell.insertBefore(hint, cell.firstChild);
```

### Rule 9: Links for aem-content Fields

When a model field has type `aem-content`, the cell must contain an `<a>` element.
md2jcr extracts the `href` URL from the link.

```javascript
// For story-card page field:
const a = document.createElement('a');
a.href = '/who-we-are/our-stories/my-story';
a.textContent = 'My Story';  // text content is ignored by md2jcr for aem-content
```

### Rule 10: No HTML tables Inside Block Cells

md2jcr throws `UnsupportedElementError` for `<table>` elements.
Use EDS table block instead or restructure as nested divs.

---

## Conversion Validation Checklist

Before running import, verify your plain.html output:

- [ ] Content is inside `<main>` (or will be wrapped by run-bulk-import.js)
- [ ] Each section is a top-level `<div>` (separated by `<hr>` in import output)
- [ ] Blocks have class attribute with block name
- [ ] Blocks have 3-level nesting: div.class > div (row) > div (cell)
- [ ] Row/cell count matches the block's model field count
- [ ] No data URI or blob images (use real URLs)
- [ ] No `<table>` elements inside block cells
- [ ] Section Metadata uses xwalk format (classes in block name)
- [ ] Metadata block keys match `page-metadata` model field names
- [ ] No more than 200 images per page
- [ ] Total HTML size < 1MB

---

## Quick Reference: Block Name Mapping

| CSS class in plain.html | Grid table header in markdown | Component title in definition |
|---|---|---|
| `section-metadata` | `Section Metadata` | (special - section model) |
| `hero-container` | `Hero Container` | `Hero Container` |
| `custom-title` | `Custom Title` | `Custom Title` |
| `text-container` | `Text Container` | `Text Container` |
| `story-card` | `Story Card` | `Story Card` |
| `brightcove-video` | `Brightcove Video` | `Brightcove Video` |
| `metadata` | `Metadata` | (special - page-metadata model) |

The CSS class is hyphenated-lowercase. The block header is Title Case.
The component title in definition must match the Title Case version exactly.
