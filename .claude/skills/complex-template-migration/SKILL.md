# Complex Template Migration — Skill Reference

> Use this skill when migrating pages with multi-grid layouts, multiple sections,
> side-by-side columns, technology modules, or any page that doesn't follow the
> standard story-article 2-8-2 pattern.

---

## When to Use This Skill

- Page has MORE than 3 top-level sections after overlap-predecessor
- Page has side-by-side content (image LEFT + text RIGHT)
- Page has sidebar navigation (Topics, table of contents)
- Page has multiple grid-container sections with different column layouts
- Page has technology/feature modules with repeated image+text pattern
- Page has related content cards in a grid
- Page has gray background sections
- Page has quotes in their own wide section

---

## Step 1: Analyze the Reference xwalk Structure

Before writing the script, ALWAYS check the reference xwalk page:

```bash
curl -s "https://develop--dev-abbvie-com--abbvie.aem.page/drafts/prateek/{page-name}.plain.html" > /tmp/ref.html

# Get section count
grep -c "^<div>" /tmp/ref.html

# Get section metadata sequence
grep -oP 'section-metadata [^"]*' /tmp/ref.html | nl

# Get blocks per section
python3 -c "
import re
with open('/tmp/ref.html') as f:
    content = f.read()
sections = content.split('\n<div>')
for i, sec in enumerate(sections[:50], 1):
    meta = re.search(r'section-metadata\s+([^\"]+)', sec)
    blocks = re.findall(r'class=\"([^\"]+)\"', sec)
    blocks = [b for b in blocks if 'section-metadata' not in b][:3]
    print(f'S{i:02d} [{meta.group(1) if meta else \"\"}] {blocks}')
"
```

---

## Step 2: Map the Live Page DOM Structure

```javascript
// In browser evaluate — find ALL top-level sections
const overlap = document.querySelector('.overlap-predecessor');
const contentRoot = overlap?.parentElement;
const allChildren = Array.from(contentRoot?.children || []);
// Each child after overlap is a major page section
```

Key patterns to identify:
- `allChildren[overlapIdx - 1]` = hero container (image/video)
- `allChildren[overlapIdx]` = overlap-predecessor (intro content)
- `allChildren[overlapIdx + 1]` = first body section
- `allChildren[overlapIdx + 2]` = second body section (if exists)
- etc.

---

## Step 3: Content Root Detection

```javascript
// Standard: use overlap-predecessor's parent
const overlapEl = document.querySelector('.overlap-predecessor');
let contentRoot = overlapEl?.parentElement;

// Fallback: walk up from h1
if (!contentRoot) {
  const h1 = document.querySelector('h1');
  let el = h1;
  while (el?.parentElement) {
    if ((el.parentElement.className || '').includes('aem-Grid')) {
      contentRoot = el.parentElement; break;
    }
    el = el.parentElement;
  }
}
```

---

## Step 4: Multi-Section Body Extraction

For complex pages with MULTIPLE body sections:

```javascript
// DO NOT use just allChildren[overlapIdx + 1] — that only gets ONE section
// Instead, collect ALL children after overlap:
const bodyChildren = [];
for (let i = overlapIdx + 1; i < allChildren.length; i++) {
  const child = allChildren[i];
  const cls = child.className || '';
  if (cls.includes('experiencefragment')) break; // Stop at footer
  bodyChildren.push(child);
}
```

---

## Step 5: Grid Layout Patterns

### Standard Article (2-8-2)
```
grid-container, content-regular     ← 12-col grid parent
  grid-cols-2                       ← left spacer
  grid-section, grid-cols-8         ← content (body text)
  grid-cols-2                       ← right spacer
```

### Article with Sidebar (8+2 or similar)
```
grid-container, content-regular     ← 12-col grid parent
  grid-cols-2                       ← left spacer
  grid-section, grid-cols-8         ← main content
  grid-cols-2                       ← sidebar (Topics, TOC)
```
**CRITICAL:** The sidebar is a SEPARATE section (its own `<hr>` boundary), NOT inside the grid-cols-8 section. The grid-container parent makes them render side-by-side.

### Technology Module (1-4-1-5-1)
```
grid-container, content-regular, regular-padding, no-top-padding, no-bottom-margin
  grid-section, grid-cols-1         ← left spacer
  grid-section, grid-cols-4         ← IMAGE column
  grid-section, grid-cols-1         ← middle spacer
  grid-section, grid-cols-5         ← TEXT column (title + paragraphs)
```

### Related Content (6-6 on gray bg)
```
bg-f4f4f4, no-bottom-margin, section-padding, content-wide  ← heading section
grid-container, bg-f4f4f4, regular-padding, no-top-padding, no-bottom-margin
  grid-section, grid-cols-6         ← card 1
  grid-section, grid-cols-6         ← card 2
bg-f4f4f4, no-bottom-margin, section-padding, content-wide  ← closing section
```

### Wide Section (quote, CTA banner)
```
container-xx-large, section-padding  ← full-width with padding
```

---

## Step 6: Technology Module Extraction

For pages with repeated image+text modules (like five-technologies):

```javascript
// Find H2 headings for each module
const techH2s = [...allH2s].filter(h => techNames.includes(h.textContent.trim()));

techH2s.forEach((h2) => {
  // Navigate UP from h2 to find the grid-row structure
  const col5 = h2.closest('[class*="col-with-5"], .grid-row__col-with-5');
  const gridRow = col5?.parentElement;
  
  // Get IMAGE from sibling col-with-4
  const col4 = gridRow?.querySelector('[class*="col-with-4"]');
  const img = col4?.querySelector('img');
  // Handle lazy-loaded: check data-cmp-src
  const imgSrc = img?.getAttribute('data-cmp-src') || img?.src || '';
  
  // Get TEXT from .cmp-text or .text inside col-with-5
  const textEl = col5?.querySelector('.cmp-text, .text, [class*="cmp-text"]');
  const paragraphs = textEl?.querySelectorAll('p') || [];
});
```

**Key learnings:**
- Image is in a SIBLING column (col-with-4), NOT in the same column as the heading
- Paragraphs are in `.cmp-text` or `.text` element INSIDE the col-with-5
- The H2 is nested: `h2 → .cmp-title → .title → col-with-5 → grid-row`
- Images are often lazy-loaded (`data-cmp-src` instead of `src`)

---

## Step 7: Alignment Between Image and Text Columns

```javascript
// Use separator-height-8 before title in text column for top alignment
output.appendChild(makeSeparator(document, 8));  // Small spacer for alignment
output.appendChild(makeCustomTitle(document, heading, 'h5-size'));
output.appendChild(makeTextContainer(document, textDiv, ''));
output.appendChild(makeSeparator(document, 64)); // Spacing between modules
```

The reference xwalk uses:
- `separator-height-8` (tiny) before the title — aligns with image top
- `separator-height-64` after text — spacing between modules

---

## Step 8: Accordion with Dynamic Content Extraction

References often hidden behind JS toggles. Extract from DOM:

```javascript
// Search for <ol> with doi.org links (references)
const allLists = contentRoot.querySelectorAll('ol, ul');
for (const list of allLists) {
  if (list.querySelectorAll('a[href*="doi.org"]').length >= 3) {
    refDiv.appendChild(list.cloneNode(true));
    break;
  }
}

// Also check accordion-item-body and hidden panels
const accBodies = contentRoot.querySelectorAll('.accordion-item-body, [class*="accordion"] [class*="body"]');
const hiddenPanels = document.querySelectorAll('[style*="display: none"], [hidden], [aria-hidden="true"]');
```

**Key learnings:**
- Live page may hide accordion content behind JS toggle buttons
- Content IS in the DOM but inside hidden/collapsed panels
- Search by content signature (doi.org links, citation patterns)
- Never hardcode content — always extract from DOM

---

## Step 9: Section Metadata Classes Reference

| Pattern | Classes | Purpose |
|---------|---------|---------|
| Standard grid parent | `grid-container, content-regular` | 12-col grid |
| Grid with padding | `grid-container, content-regular, regular-padding, no-bottom-margin` | Padded grid |
| Grid continuation | `grid-container, content-regular, regular-padding, no-top-padding, no-bottom-margin` | No top gap |
| Left spacer | `grid-cols-2` | Empty 2-col spacer |
| Body content | `grid-section, grid-cols-8` | 8-col content area |
| Image column | `grid-section, grid-cols-4` | Image in 4 cols |
| Text column | `grid-section, grid-cols-5` | Text in 5 cols |
| 1-col spacer | `grid-section, grid-cols-1` | Thin spacer |
| Half-width card | `grid-section, grid-cols-6` | 6-col card |
| Wide header | `grid-section, grid-cols-9` | 9-col heading |
| Quote section | `container-xx-large, section-padding` | Wide quote |
| Gray background | `bg-f4f4f4, no-bottom-margin, section-padding, content-wide` | Gray section |
| Gray grid | `grid-container, bg-f4f4f4, regular-padding, no-top-padding, no-bottom-margin` | Gray grid parent |
| Simple spacer | `no-bottom-margin` | Just spacing control |

---

## Step 10: Common Mistakes to Avoid

### ❌ Using overlapIdx + 1 for ALL body content
Complex pages have MULTIPLE body sections. Always iterate ALL children after overlap.

### ❌ Putting sidebar content INSIDE the main grid-cols section
Sidebars must be in their OWN section (separate `<hr>` boundary) to render side-by-side via grid.

### ❌ Using the same image for all modules
Navigate from the H2 UP to the grid-row, then find the IMAGE in the SIBLING col-with-4 column.

### ❌ Hardcoding content
Always extract from the page DOM. Search hidden panels, accordion bodies, and collapsed sections.

### ❌ Large separators before titles in side-by-side layouts
Use `separator-height-8` (not 64) before titles in text columns — aligns with image top.

### ❌ Duplicating content from intro into tech modules
Stop extracting intro text BEFORE tech-specific content begins (detect by phrase patterns).

### ❌ Repeating block heading as accordion item summary
Accordion block heading (row 0) is the title. Item summary should be empty or different text.

---

## Step 11: Validation Checklist

After building a complex template script, verify:

- [ ] Section count matches reference (±3 sections acceptable)
- [ ] Section metadata sequence matches reference for first 15 sections
- [ ] Each grid-container has correct number of grid-cols children
- [ ] Side-by-side content renders at correct column widths
- [ ] Images are unique per module (not repeated)
- [ ] Text content is not duplicated between sections
- [ ] Accordion has content (check for doi.org links or list items)
- [ ] Related content cards reference correct page paths
- [ ] No hardcoded content — all extracted from DOM
- [ ] Zero data loss — compare character count with previous version

---

## Step 12: Script Structure Template

```javascript
export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    // 1. Find content root
    const contentRoot = findContentRoot(document);
    const allChildren = Array.from(contentRoot.children);
    const overlapIdx = allChildren.findIndex(el => ...);

    const output = document.createElement('div');

    // 2. SECTION 1: Hero + Intro (content-wide, medium-radius)
    // ... hero, cta, story-card, title, lede ...
    output.appendChild(makeSectionMetadata(document, 'content-wide, medium-radius'));
    output.appendChild(document.createElement('hr'));

    // 3. SECTION 2-N: Grid container + columns
    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular'));
    output.appendChild(document.createElement('hr'));
    // ... grid-cols sections with content ...

    // 4. TECHNOLOGY MODULES (if applicable)
    techH2s.forEach((h2) => {
      // grid-container + 1-4-1-5-1 pattern per module
    });

    // 5. QUOTE SECTION
    output.appendChild(makeSectionMetadata(document, 'container-xx-large, section-padding'));
    output.appendChild(document.createElement('hr'));

    // 6. REFERENCES (2-8-2 grid)
    // ... accordion with extracted content ...

    // 7. RELATED CONTENT (bg-f4f4f4, 6-6 grid)
    // ... story-card blocks in grid-cols-6 sections ...

    // Cleanup
    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });
    return output;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
```

---

## Quick Reference: Grid Math

| Layout | Columns | Pattern |
|--------|---------|---------|
| Centered narrow | 2 + 8 + 2 = 12 | Standard article |
| Image + text | 1 + 4 + 1 + 5 + 1 = 12 | Technology module |
| Two cards | 6 + 6 = 12 | Related content |
| Heading wide | 1 + 9 + 2 = 12 | Section header |
| Three cards | 4 + 4 + 4 = 12 | Card grid |
| Sidebar | 2 + 8 + 2 = 12 | With Topics |

All patterns MUST sum to 12 columns.
