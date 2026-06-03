# Complex Template Grid Layout Rules

## Overview

When migrating pages with multi-column layouts (side-by-side content, video grids, card rows), use the **Grid Container → Grid Section** pattern. This creates a CSS grid where grid-sections render as columns within their parent grid-container.

---

## Core Pattern

```
Section (default or styled)           ← regular section
---
Grid Container (wrapper)              ← defines the grid row
---
  Grid Section cols-N (column 1)      ← first column
  ---
  Grid Section cols-N (column 2)      ← second column
  ---
  Grid Section cols-N (column 3)      ← third column
  ---
Grid Container (next row)             ← new grid row
---
  Grid Section cols-N (column 1)      ← columns in new row
  ...
```

**Key rule:** Grid-sections within the SAME grid-container render side-by-side. Each grid-container starts a NEW row.

---

## Section Metadata Format

### Grid Container (row wrapper)
```html
<div class="section-metadata">
  <div><div>blockModelId</div><div>grid-container</div></div>
  <div><div>style_container</div><div>grid-container</div></div>
  <div><div>name</div><div>Grid Container</div></div>
  <div><div>style_customDynamicClass</div><div>grid-container,content-regular</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

### Grid Section (column)
```html
<div class="section-metadata">
  <div><div>blockModelId</div><div>grid-section</div></div>
  <div><div>style_container</div><div>grid-section</div></div>
  <div><div>name</div><div>Grid Section</div></div>
  <div><div>style_customDynamicClass</div><div>grid-section,grid-cols-N</div></div>
  <div><div>language</div><div>none</div></div>
</div>
```

Where `N` = column width (1-12). Columns in a row must sum to 12.

---

## Common Grid Patterns

### 2-8-2 (Centered narrow content — story articles)
```
Grid Container, content-regular
  Grid Section, grid-cols-2      ← left spacer
  Grid Section, grid-cols-8      ← content (blocks go here)
  Grid Section, grid-cols-2      ← right spacer
```

### 7-1-4 (Featured video + description)
```
Grid Container, content-regular
  Grid Section, grid-cols-7      ← video block
  Grid Section, grid-cols-1      ← spacer
  Grid Section, grid-cols-4      ← title + description
```

### 4-4-4 (Three equal cards/videos)
```
Grid Container, content-regular
  Grid Section, grid-cols-4      ← card 1
  Grid Section, grid-cols-4      ← card 2
  Grid Section, grid-cols-4      ← card 3
```

### 5-1-6 (Image + content with linklist)
```
Grid Container, content-regular
  Grid Section, grid-cols-5      ← image + title
  Grid Section, grid-cols-1      ← spacer
  Grid Section, grid-cols-6      ← description + linklist
```

### 6-6 (Two equal columns)
```
Grid Container, content-regular
  Grid Section, grid-cols-6      ← left content
  Grid Section, grid-cols-6      ← right content
```

---

## Blocks Inside Grid Sections

Blocks are placed INSIDE their grid-section — they appear BEFORE the Section Metadata that closes that section:

```
[blocks for column 1]
Section Metadata (grid-section, grid-cols-7)  ← closes this column
---
[blocks for column 2]  
Section Metadata (grid-section, grid-cols-4)  ← closes this column
---
```

### Import Script Pattern
```javascript
// Column 1: video
output.appendChild(makeBrightcoveVideo(document, { ... }));
output.appendChild(makeSectionMetadata(document, 'grid-cols-7', 'grid-section'));
output.appendChild(document.createElement('hr'));

// Spacer
output.appendChild(makeSectionMetadata(document, 'grid-cols-1', 'grid-section'));
output.appendChild(document.createElement('hr'));

// Column 2: title + description
output.appendChild(makeCustomTitle(document, title, 2, 'h2-size'));
output.appendChild(makeTextContainer(document, descDiv, 'spacing-bottom'));
output.appendChild(makeSectionMetadata(document, 'grid-cols-4', 'grid-section'));
output.appendChild(document.createElement('hr'));
```

---

## Background Colors on Grid Containers

Add background styles to the grid-container's `style_customDynamicClass`:

```javascript
// Grey background
output.appendChild(makeSectionMetadata(document, 'content-regular,light-grey', 'grid-container'));

// Navy/dark background
output.appendChild(makeSectionMetadata(document, 'content-regular,navy', 'grid-container'));

// Purple background
output.appendChild(makeSectionMetadata(document, 'purple,content-regular'));  // regular section, not grid
```

---

## Multiple Rows in Same Visual Section

When multiple grid rows share the same background (e.g., featured video + 3 cards both in grey), use the SAME background class on each grid-container:

```
Grid Container, content-regular, light-grey   ← row 1 (featured video 7-1-4)
  Grid Section, grid-cols-7
  Grid Section, grid-cols-1
  Grid Section, grid-cols-4
Grid Container, content-regular, light-grey   ← row 2 (video cards 4-4-4)
  Grid Section, grid-cols-4
  Grid Section, grid-cols-4
  Grid Section, grid-cols-4
```

Each grid-container gets `light-grey` — CSS handles the seamless appearance.

---

## Real Example: Lab-to-Life Page

```
Section: content-wide, medium-radius
  → Hero Container
  → Custom Title (H1)
  → Text Container (intro)
---
Grid Container: content-regular, light-grey        ← grey section start
---
  Grid Section: grid-cols-7
    → Brightcove Video (featured)
  ---
  Grid Section: grid-cols-1 (spacer)
  ---
  Grid Section: grid-cols-4
    → Custom Title (H2)
    → Text Container (description)
  ---
Grid Container: content-regular, light-grey        ← same grey bg
---
  Grid Section: grid-cols-4
    → Brightcove Video (Colorectal Cancer)
  ---
  Grid Section: grid-cols-4
    → Brightcove Video (Multiple Myeloma)
  ---
  Grid Section: grid-cols-4
    → Brightcove Video (Parkinson's Disease)
  ---
Grid Container: content-regular                    ← no bg (dive deeper)
---
  Grid Section: grid-cols-5
    → Custom Title (H2)
    → Custom Image
  ---
  Grid Section: grid-cols-1 (spacer)
  ---
  Grid Section: grid-cols-6
    → Text Container (description)
    → Linklist
  ---
Section: purple, content-regular                   ← footer CTA
  → Custom Title (H2)
  → Text Container (CTA link)
---
Metadata
```

---

## JCR Output Structure

The md2jcr output creates nested sections:

```xml
<section_1 model="grid-container" style_customDynamicClass="grid-container,content-regular,light-grey">
  <!-- empty — grid-container is a wrapper only -->
</section_1>
<section_2 model="grid-section" style_customDynamicClass="grid-section,grid-cols-7">
  <block ... name="Brightcove Video" videoId="..." posterImage="..."/>
</section_2>
<section_3 model="grid-section" style_customDynamicClass="grid-section,grid-cols-1"/>
<section_4 model="grid-section" style_customDynamicClass="grid-section,grid-cols-4">
  <block ... name="Custom Title" title="..."/>
  <block_1 ... name="Text Container">
    <item_0 ... text="..."/>
  </block_1>
</section_4>
```

---

## Key Rules

1. **Grid-container is always empty** — it has no blocks, only Section Metadata. It's a row wrapper.
2. **Grid-sections contain the blocks** — blocks go inside grid-sections.
3. **Columns must sum to 12** — e.g., 7+1+4=12, 4+4+4=12, 5+1+6=12.
4. **New grid-container = new row** — separate visual rows need separate grid-containers.
5. **Background on grid-container** — add style classes like `light-grey`, `navy`, `purple` to the grid-container.
6. **Spacer columns** — use `grid-cols-1` empty grid-sections for spacing between columns.
7. **Content order** — blocks first, then Section Metadata at the END of each grid-section.
