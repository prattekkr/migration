# md2jcr Compatibility — Known Issues & Correct Block Formats

> Reference for producing plain.html that passes md2jcr without errors.
> Based on debugging against AEM Cloud md2jcr and local v1.2.11.
> Updated: 2026-06-02

---

## Critical Rule: Match the Working Reference

The ONLY reliable way to ensure md2jcr compatibility is to match the exact format
of a page that already works. Reference page:
- `https://develop--dev-abbvie-com--abbvie.aem.page/drafts/prateek/the-math-of-migraine.md`

**When in doubt, compare your output against the reference `.md` or `.plain.html`.**

---

## Issue 1: Hero Container "content isn't mapping to the model"

**Error:** `Hero Container has errors! The content isn't mapping to the model correctly`

**Root Cause:** md2jcr's field resolver uses field grouping (suffix matching: Alt, MimeType, Type)
and processes rows differently based on cell count. Block-level rows (single-cell with colSpan)
are mapped to block model fields. Item rows (multi-cell) are mapped to item model fields.

**Working Format (from `inside-dream-initiative`):**

```html
<div class="hero-container height-default overlay-height-short">
  <div>
    <div>image</div>
    <div><picture><img src="https://..." alt="..."></picture></div>
    <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
  </div>
</div>
```

- ONE row with exactly **10 cells**: `[image, <picture>, 8 empty]`
- **NO block-level rows** (no empty/none/empty prefix rows)
- Variant classes in header: `Hero Container (height-default, overlay-height-short)`
- Image uses `<picture><img>` element with alt text on the img tag

**What BREAKS it:**
- Adding block-level single-cell rows (empty, none, empty) before the item row
- Using `<a href>` link reference instead of `<picture><img>`
- Having more than 10 cells in the item row
- Adding extra data like accountId, hero-container-item name, language in the item row

**Reference markdown (from the working page):**
```
+-------+-------------+--+--+--+--+--+--+--+--+
| image | ![][image0] |  |  |  |  |  |  |  |  |
+-------+-------------+--+--+--+--+--+--+--+--+
```

---

## Issue 2: CTA "content isn't mapping to the model"

**Error:** `Cta has errors! The content isn't mapping to the model correctly`

**Working Format (from reference):**

```html
<div class="cta default-cta back-cta">
  <div><div><a href="/url">Link Text</a></div></div>
  <div><div></div></div>
  <div><div>_self</div></div>
  <div><div>none</div></div>
  <div><div>chevron</div></div>
  <div><div></div></div>
  <div><div>before</div></div>
  <div><div>false</div></div>
  <div><div></div></div>
  <div><div>none</div></div>
  <div><div></div></div>
</div>
```

- **11 rows**, one cell each
- Row[0]: `<a>` link element
- Variant classes in header: `CTA (default-cta, back-cta)`

---

## Issue 3: Section Metadata — style property not mapping

**Error:** Section classes not applied in JCR output

**Root Cause:** The `section` model needs a `style` field (multiselect) for md2jcr to map
the `style` key from Section Metadata key-value rows.

**Fix Applied:** Added `style` (multiselect) field to `section`, `grid-section`, `grid-container`
models in `component-models.json`.

**Working Format:**

```html
<div class="section-metadata">
  <div><div>style</div><div>content-wide, medium-radius</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

- Block name: `Section Metadata` (no classes in parentheses)
- Key-value rows: `[style, value]` and `[language, none]`

---

## Issue 4: "Cannot read properties of undefined (reading 'components')"

**Error:** `Cannot read properties of undefined (reading 'components')`

**Root Cause:** Block is used in content but has no entry in `component-filters.json`.

**Fix:** Add filter entry for every block used:
```json
{ "id": "block-name", "components": [] }
```

**Blocks that needed filter entries added:**
- `carousel`, `cta`, `custom-image`, `quote`, `story-card`, `fact-card`

---

## Issue 5: "No matching node definition found for jcr:content"

**Error:** `javax.jcr.nodetype.ConstraintViolationException: No matching node definition found for jcr:content`

**Root Cause:** Parent path pages don't exist. md2jcr needs every path segment to be a valid cq:Page.

**Fix:** Create placeholder index pages for intermediate paths:
- `content/who-we-are/index.plain.html`
- `content/who-we-are/our-stories/index.plain.html`

---

## Issue 6: Field values showing as visible text in preview

**Cause:** Using single-row format with all field values as cells in one row.
EDS client-side JS renders each cell as visible content.

**Fix:** Use multi-row format (one field per row) for blocks like CTA, Story Card, etc.
Only the primary content (headings, paragraphs, images) should be visible.
Config values go in their own rows which block JS consumes and removes from DOM.

---

## Issue 7: md2jcr field resolver consuming wrong content

**Cause:** md2jcr resolves fields by TYPE (images → reference fields, links → aem-content, 
headings → *Type fields, text → richtext greedily). Content in wrong order or type mismatch
causes fields to get wrong values.

**Mitigation:** 
- Match the exact row/cell format from a working reference page
- For container blocks (text-container, hero-container, accordion):
  - Block-level rows map to block model fields
  - Item rows map to item model fields
  - Row cell count must match after md2jcr's field grouping

---

## Issue 8: colSpan handling for mixed-width rows

**Cause:** When a block has rows with different cell counts (e.g., hero-container with 
single-cell block rows + multi-cell item rows), html2md needs proper colSpan to prevent
padding single-cell rows to the max column count.

**Fix in makeBlock function:**
```javascript
function makeBlock(document, name, rows) {
  const maxCols = Math.max(...rows.map(r => (Array.isArray(r) ? r : [r]).length));
  // ... header th.colSpan = maxCols
  // ... for rows with fewer cells, last td gets colSpan
  if (arr.length < maxCols && i === arr.length - 1) {
    td.colSpan = maxCols - arr.length + 1;
  }
}
```

---

## Correct Block Formats (Proven Working)

### Hero Container
```
ONE row, 10 cells: [image, <picture>, empty x8]
Variant classes in header parentheses
NO block-level prefix rows
```

### CTA
```
11 rows (one cell each): [<a>link</a>, empty, _self, none, chevron, empty, before, false, empty, none, empty]
Variant classes in header
```

### Story Card
```
12 rows (one cell each): [variant, false, false, true, true, true, empty, empty, <a>page</a>, false, empty, empty]
```

### Custom Title
```
4 rows: [<h1>heading</h1>, id:, lang:none, empty]
Variant classes in header (h1-size, h5-size width-large)
```

### Text Container
```
3 prefix rows + content: [empty, none, empty, ...paragraphs (one per row)]
Variant classes in header (spacing-bottom, width-large)
```

### Separator
```
4 rows: [false, empty, none, empty]
Height variant in header (separator-height-24)
```

### Quote
```
11 rows: [quote-standard, text, authorName, authorRole, <picture>authorImg, empty, empty, empty, empty, none, empty]
Variant classes in header
```

### Brightcove Video
```
33 rows (one per field): [projectNumber, overlayTitle, ..., enableTranscript]
See migration-skill for full field order
```

### Accordion
```
21 block-level rows + 5-col child item rows
See migration-skill for full structure
```

### Custom Image
```
Single row: [<picture>]
Only the image element needed
```

### Section Metadata
```
Key-value rows: [style, classes], [language, none]
Block name: Section Metadata (NO parenthetical classes)
```

### Page Metadata
```
Key-value rows: [jcr:title, value], [jcr:description, value], etc.
Block name: Metadata
```

---

## Debugging Workflow

1. Check if block has filter entry in `component-filters.json`
2. Compare your plain.html output against working reference page
3. Count cells — must match what md2jcr expects after field grouping
4. For container blocks: check block-level row count matches block model's non-tab, non-classes fields
5. For item rows: match the working reference exactly
6. Run local md2jcr test: see conversion-pipeline skill for setup
7. If stuck: simplify to minimal format that matches a known-working page
