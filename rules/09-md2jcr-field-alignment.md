# md2jcr Field Group Alignment Rules

## Overview

When writing import scripts that produce HTML for the `html2md → md2jcr` pipeline, the **row count and order in block tables must match md2jcr's FieldGroup structure** — NOT the raw field count in component-models.json.

md2jcr groups fields before mapping rows. Each row in the grid table maps to one **field group**, not one field. Misalignment causes values to land in wrong JCR properties.

---

## How md2jcr Groups Fields (FieldGroup._groupFields)

Given a model's non-tab fields, md2jcr creates groups using these rules:

### Rule 1: Fields with `_` in name → grouped by prefix
All fields sharing the same prefix before `_` become ONE group at the position where the first such field appears.

```
classes_customDynamicClass  ─┐
classes_commonCustomClass   ─┴─→ ONE group "classes" (at position of first occurrence)
```

### Rule 2: Fields ending with suffix → collapsed into base field
Suffixes: `Alt`, `MimeType`, `Type`, `Text`, `Title`

```
image           ─┐
imageMimeType   ─┤─→ ONE group "image" (MimeType collapsed)
imageAlt        ─┘   (Alt collapsed)
```

> **WARNING:** Fields ending with a suffix but WITHOUT a matching base field are **silently dropped** by md2jcr's `_fixFieldOrder`. See [10-md2jcr-field-naming.md](./10-md2jcr-field-naming.md) for the naming rules to avoid this bug.

### Rule 3: `classes` field excluded
If a model has a field literally named `classes` (multiselect), it's handled separately from the block name parentheses. It does NOT consume a row.

### Rule 4: Field hints override resolution
Use `<!-- field:fieldName -->` HTML comments in a cell to tell md2jcr exactly which field a value belongs to. This bypasses sequential resolution.

---

## Common Field Group Patterns

### Common Properties (from _common-properties.json)
Most blocks end with these fields which form 4 groups:

| Fields | Groups |
|--------|--------|
| `classes_customDynamicClass`, `classes_commonCustomClass` | 1 group: "classes" |
| `blockId` | 1 group |
| `language` | 1 group |
| `analytics_id` | 1 group: "analytics" |

**= 4 rows at the end of every block**

### Image Fields (collapsed)
```
image + imageMimeType + imageAlt → 1 group (suffix collapsing)
```

### Background Image Fields (collapsed)
```
backgroundImage + backgroundImageMimeType + backgroundImageAlt → 1 group
backgroundImagePreset → separate group
backgroundImageModifiers → separate group
```

### Link Fields (collapsed)
```
link + linkText → 1 group (Text suffix collapses into link)
```

---

## Block-Specific Field Group Counts

### Hero Container (parent) — 4 groups
```
[0] classes (classes_customDynamicClass, classes_commonCustomClass)
[1] blockId
[2] language
[3] analytics (analytics_id)
→ Remaining rows = hero-container-item children
```
- No `classes` multiselect → variants go in `classes_customDynamicClass` via field hint
- Block name: `Hero Container` (no parentheses needed)

### Hero Container Item (child) — resolved from filter
- Template defaults provide: backgroundType, accountId, playerId, videoId, text, ctaLabel, ctaUrl, ctaAltText
- Only need to supply image in the row; md2jcr fills defaults from component-definition.json

### CTA — 12 groups
```
[0]  link (collapsed: linkText — from <a> node)
[1]  aria-label
[2]  ctaTarget
[3]  iconVariation
[4]  iconFont
[5]  iconImage
[6]  iconPosition
[7]  ariaHidden
[8]  classes (classes_customDynamicClass, classes_commonCustomClass)
[9]  blockId
[10] language
[11] analytics (analytics_id)
```
- Block name: `Cta` (matches component title exactly)
- No `classes` multiselect → use field hint for classes_customDynamicClass

### Custom Title — 5 groups
```
[0] title (collapsed: titleType — from heading depth)
[1] classes (classes_customDynamicClass, classes_commonCustomClass)
[2] blockId
[3] language
[4] analytics (analytics_id)
```
- Provide `<h1>` element → md2jcr extracts title text + titleType="h1"
- Variants (h1-size, width-large) → classes_customDynamicClass via field hint

### Text Container (parent) — 4 groups
```
[0] classes (classes_customDynamicClass, classes_commonCustomClass)
[1] blockId
[2] language
[3] analytics (analytics_id)
→ Remaining rows = text-container-text children (1 row per item)
```
- Each child item has 1 field: `text` (richtext)
- Combine ALL paragraphs into ONE item with single richtext cell
- Block name: `Text Container` (no parentheses)

### Quote — 13 groups
```
[0]  quoteVariant
[1]  quotation (richtext)
[2]  attributionName
[3]  attributionRole
[4]  attributionImage (collapsed: attributionImageMimeType)
[5]  quoteFragment
[6]  backgroundImage (collapsed: backgroundImageMimeType, backgroundImageAlt)
[7]  backgroundImagePreset
[8]  backgroundImageModifiers
[9]  classes (classes_customDynamicClass, classes_commonCustomClass)
[10] blockId
[11] language
[12] analytics (analytics_id)
```

### Video — 18 groups
```
[0]  uri
[1]  placeholderImage (collapsed: placeholderImageMimeType)
[2]  placeholderAlt
[3]  overlayTitle
[4]  overlayDescription
[5]  overlayBtnText
[6]  videoContentLayout
[7]  classes (overlayColor, overlayBtnStyle, customDynamicClass, commonCustomClass)
[8]  overlayButtonIconType
[9]  overlayButtonFontIcon
[10] projectNumber
[11] enableAutoplay
[12] enableCaptions
[13] enablePlayerControls
[14] enableFullscreen
[15] blockId
[16] language
[17] analytics (analytics_id)
```
- Use field hints in classes group cell for overlayColor/overlayBtnStyle

### Accordion (parent) — 17 groups
```
[0]  blockHeading
[1]  classes (allowMultipleOpen, showExpandCollapseAll, iconType, customDynamicClass, commonCustomClass)
[2]  expandAllLabel
[3]  collapseAllLabel
[4]  expandAllIcon
[5]  collapseAllIcon
[6]  expandIcon
[7]  collapseIcon
[8]  expandAllIconImage
[9]  collapseAllIconImage
[10] expandIconImage
[11] collapseIconImage
[12] ariaExpandAllLabel
[13] ariaCollapseAllLabel
[14] blockId
[15] language
[16] analytics (analytics_id)
→ Remaining rows = accordion-item children
```
- Each accordion-item: [summary, text] (2 cells per row)
- Use field hints in classes group cell for multiple classes_* fields

### Custom Image — 17 groups
```
[0]  image (collapsed: imageMimeType, imageAlt)
[1]  getAltFromDAM
[2]  imageIsDecorative
[3]  caption
[4]  getCaptionFromDAM
[5]  displayCaptionBelowImage
[6]  enableLink
[7]  target
[8]  clickBehavior
[9]  modalPanelId
[10] enableWarnOnLeave
[11] warnOnLeavePath
[12] linkAriaLabel
[13] classes (classes_customDynamicClass, classes_commonCustomClass)
[14] blockId
[15] language
[16] analytics (analytics_id)
```

### Story Card — 12 groups
```
[0]  storyCardVariant
[1]  hidePublicationDate
[2]  hideReadTime
[3]  hideRole
[4]  hideDescription
[5]  hideImage
[6]  id (field name, maps to blockId-like)
[7]  customClass
[8]  page (aem-content)
[9]  openInNewTab
[10] ctaLabel
[11] analyticsInteractionId
```
- No classes_* or common props in this model
- **CRITICAL: `page` field (row 8) is `aem-content` type** — requires a full JCR content path
  - ✅ Correct: `/content/abbvie-nextgen-eds/abbvie-com/us/en/who-we-are/our-stories/page-name`
  - ❌ Wrong: `/who-we-are/our-stories/page-name.html` (has .html extension)
  - ❌ Wrong: `/who-we-are/our-stories/page-name` (missing JCR prefix)
  - The `<a>` element's `href` AND `textContent` must both use the full JCR path without `.html`
  - Transform pattern: strip `.html` → prepend `/content/abbvie-nextgen-eds/abbvie-com/us/en`

---

## Section Metadata Rules

### Use `style_customDynamicClass` not `style`
```html
<div class="section-metadata">
  <div><div>style_customDynamicClass</div><div>content-wide,medium-radius</div></div>
</div>
```
- The section model has `style` (multiselect) AND `style_customDynamicClass` (dynamic-picklist)
- Reference JCR uses `style_customDynamicClass` for section styles
- Values are comma-separated, NO spaces: `content-wide,medium-radius`

### Use `blockModelId` for non-default section types
For `grid-section` and `grid-container`, provide ALL these rows in Section Metadata:

```html
<div class="section-metadata">
  <div><div>blockModelId</div><div>grid-section</div></div>
  <div><div>style_container</div><div>grid-section</div></div>
  <div><div>name</div><div>Grid Section</div></div>
  <div><div>style_customDynamicClass</div><div>grid-section,grid-cols-8</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

### Grid Container Section
Model: `grid-container` | Fields: name, style_container, background, backgroundMimeType, style_customDynamicClass, blockId, classes_commonCustomClass, language, analytics_id

```html
<div class="section-metadata">
  <div><div>blockModelId</div><div>grid-container</div></div>
  <div><div>style_container</div><div>grid-container</div></div>
  <div><div>name</div><div>Grid Container</div></div>
  <div><div>style_customDynamicClass</div><div>grid-container,content-regular</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

**Reference JCR output:**
```xml
<grid_container
    sling:resourceType="core/franklin/components/section/v1/section"
    aueComponentId="grid-container"
    style_container="grid-container"
    style_customDynamicClass="content-regular,padding-bottom"
    filter="grid-container"
    identifier="Grid Container"
    language="none"
    model="grid-container"
    name="Grid Container"/>
```

### Grid Section
Model: `grid-section` | Fields: name, style_container, style_customDynamicClass, blockId, classes_commonCustomClass, language, analytics_id

```html
<div class="section-metadata">
  <div><div>blockModelId</div><div>grid-section</div></div>
  <div><div>style_container</div><div>grid-section</div></div>
  <div><div>name</div><div>Grid Section</div></div>
  <div><div>style_customDynamicClass</div><div>grid-section,grid-cols-8</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

**Reference JCR output:**
```xml
<grid_section
    sling:resourceType="core/franklin/components/section/v1/section"
    aueComponentId="grid-section"
    style_container="grid-section"
    style_customDynamicClass="grid-cols-8"
    filter="grid-section"
    identifier="Grid Section"
    model="grid-section"
    name="Grid Section"/>
```

### Section Types Summary

| Type | blockModelId | style_container | name | style_customDynamicClass |
|------|-------------|-----------------|------|--------------------------|
| Default section | (none) | (none) | (none) | `content-wide,medium-radius` |
| Grid Container | `grid-container` | `grid-container` | `Grid Container` | `grid-container,content-regular` |
| Grid Section (cols-2) | `grid-section` | `grid-section` | `Grid Section` | `grid-section,grid-cols-2` |
| Grid Section (cols-8) | `grid-section` | `grid-section` | `Grid Section` | `grid-section,grid-cols-8` |

### What md2jcr handles vs md2jcr gaps

**md2jcr handles (from Section Metadata rows):**
- `model` → from `blockModelId`
- `style_container` → from row
- `name` → from row
- `style_customDynamicClass` → from row
- `language` → from row
- `modelFields` → auto-generated from model

**md2jcr gaps (NOT set from Section Metadata — need md2jcr fix):**
- `filter` → should come from component-definition template
- `identifier` → should come from component-definition template
- `aueComponentId` → should come from component id

---

## Key Principles

1. **Count field GROUPS, not raw fields** — one row per group
2. **classes_* fields share one row** — first value in the cell goes to first field in group
3. **Suffix fields don't need rows** — they're auto-collapsed (Alt, MimeType, Type, Text, Title)
4. **Block name must match component title EXACTLY** — case-sensitive (`Cta` not `CTA`)
5. **No `classes` multiselect = no parenthesized variants** — use `classes_customDynamicClass` row instead
6. **Container blocks**: parent rows first, then child item rows
7. **Text containers**: combine ALL paragraphs into ONE richtext cell per item
8. **Template defaults fill empty fields** — from component-definition.json template section
9. **Empty rows collapse in html2md** — use `-` as placeholder for empty parent rows
10. **Field hints (`<!-- field:name -->`) DO NOT work** — they become `html` mdast nodes which md2jcr rejects. Use plain text values only.
11. **Section types need full metadata** — grid-section/grid-container need `blockModelId` + `style_container` + `name` + `style_customDynamicClass` + `language` rows

---

## Import Script Template

```javascript
function makeBlock(document, name, rows) {
  // Creates a <table> with header row (block name) + data rows
  // Each row = one field group
}

function makeMyBlock(document, value1, value2) {
  // Field hint for classes_* group
  const classesCell = document.createElement('div');
  classesCell.innerHTML = '<!-- field:classes_customDynamicClass -->variant1,variant2';
  
  return makeBlock(document, 'My Block', [  // title must match component-definition
    [value1],        // [0] first field group
    [value2],        // [1] second field group  
    [classesCell],   // [N-3] classes group (with field hint)
    [''],            // [N-2] blockId
    ['none'],        // [N-1] language
    [''],            // [N]   analytics_id
  ]);
}
```
