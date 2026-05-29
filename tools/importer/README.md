# AbbVie EDS Content Import Tools

## Overview

This directory contains the import infrastructure for migrating content from the AbbVie AEM site (abbvie.com) to Adobe Edge Delivery Services.

Each **import script** (`import-{template}.js`) handles a specific page template by:
1. Navigating to the live AEM page in a headless browser
2. Extracting content from the AEM DOM structure
3. Mapping content to EDS blocks with correct variant classes
4. Generating `.plain.html` files in the `content/` directory

---

## Quick Start

### Prerequisites

- Node.js 18+
- The AEM Import Helper (auto-installed on first bundle)
- Playwright (used by the bulk import runner)

### Import a Single Page

```bash
# 1. Bundle the import script (required after any .js changes)
/home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
  --importjs tools/importer/import-story-article.js

# 2. Create a URL file
echo "https://www.abbvie.com/who-we-are/our-stories/the-math-of-migraine.html" > /tmp/urls.txt

# 3. Run the import
node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls /tmp/urls.txt \
  --disable-http2
```

### Import All Pages for a Template

```bash
# Bundle
/home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
  --importjs tools/importer/import-story-article.js

# Import all URLs from the template URL file
node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls tools/importer/urls-story-article.txt \
  --disable-http2
```

### Bundle All Scripts at Once

```bash
for f in tools/importer/import-*.js; do
  [[ "$f" == *bundle* ]] && continue
  /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
    --importjs "$f"
done
```

---

## Import Scripts by Template

| Script | Template | Pages | Description |
|--------|----------|-------|-------------|
| `import-story-article.js` | Story articles | 133 | Full articles with hero, text, carousel, accordion, video |
| `import-corporate-leader-profile.js` | Corporate leaders | 24 | Leader bio pages with photo + LinkedIn |
| `import-leader-profile.js` | R&D leaders | 13 | Same structure as corporate leaders |
| `import-five-technologies.js` | Five technologies | 1 | Complex 46-section page (1-4-1-5-1 grids) |
| `import-homepage.js` | Homepage | 1 | Custom multi-section homepage |
| `import-section-landing.js` | Section landing | 4 | Top-level section pages (self-contained) |
| `import-therapeutic-area.js` | Therapeutic areas | 6 | Science focus area pages |
| `import-innovation-area.js` | Innovation areas | 6 | Innovation technology pages |
| `import-science-hub.js` | Science hub | 7 | Science sub-pages |
| `import-patient-assistance.js` | Patient assistance | 7 | Patient support pages |
| `import-stories-listing.js` | Story listings | 6 | Story category listing pages |
| `import-rich-content.js` | Rich content | 6 | Policy/disclosure pages |
| `import-sub-section-hub.js` | Sub-section hubs | 5 | Navigation hub pages |
| `import-content-series.js` | Content series | 4 | Series landing pages |
| `import-story-detail.js` | Story details | 4 | Extended story pages |
| `import-brand-partnership.js` | Brand partnerships | 3 | Partnership pages |
| `import-clinical-trials.js` | Clinical trials | 1 | Clinical trials page |
| `import-science-page.js` | Science landing | 1 | Main science page |
| `import-pipeline.js` | Pipeline | 1 | Drug pipeline page |
| `import-publications.js` | Publications | 1 | Publications page |
| `import-key-facts.js` | Key facts | 1 | Company facts page |
| `import-educational-grants.js` | Educational grants | 1 | Grants page |
| `import-community-of-science.js` | Community of science | 1 | Community page |
| `import-abbvie-ventures.js` | AbbVie ventures | 1 | Ventures page |
| `import-partner-with-us.js` | Partner with us | 1 | Partnership page |
| `import-rd-sites.js` | R&D sites | 1 | R&D locations page |
| `import-landing-page.js` | Landing page | 1 | Our People landing |
| `import-leaders-listing.js` | Leaders listing | 1 | Leaders directory page |

---

## URL Files

Each template has a corresponding URL file (`urls-{template}.txt`) listing all pages to import:

```
tools/importer/urls-story-article.txt       (133 URLs)
tools/importer/urls-corporate-leader-profile.txt (24 URLs)
tools/importer/urls-leader-profile.txt      (13 URLs)
...
```

Total: **241 unique pages** across all templates.

---

## Migration Commands (Full Site)

### Step 1: Bundle All Scripts

```bash
for f in tools/importer/import-*.js; do
  [[ "$f" == *bundle* ]] && continue
  echo "Bundling: $f"
  /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
    --importjs "$f" 2>&1 | tail -1
done
```

### Step 2: Import All Templates

```bash
# Story articles (133 pages — split into batches of 45)
head -45 tools/importer/urls-story-article.txt > /tmp/batch1.txt
sed -n '46,90p' tools/importer/urls-story-article.txt > /tmp/batch2.txt
sed -n '91,133p' tools/importer/urls-story-article.txt > /tmp/batch3.txt

node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls /tmp/batch1.txt --disable-http2

node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls /tmp/batch2.txt --disable-http2

node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls /tmp/batch3.txt --disable-http2

# Corporate leader profiles (24 pages)
node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-corporate-leader-profile.bundle.js \
  --urls tools/importer/urls-corporate-leader-profile.txt --disable-http2

# R&D leader profiles (13 pages)
node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-leader-profile.bundle.js \
  --urls tools/importer/urls-leader-profile.txt --disable-http2

# Homepage
node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-homepage.bundle.js \
  --urls tools/importer/urls-homepage.txt --disable-http2

# All other templates (each uses its own dedicated script)
for template in therapeutic-area innovation-area patient-assistance science-hub \
  stories-listing rich-content sub-section-hub section-landing content-series \
  story-detail brand-partnership clinical-trials educational-grants \
  community-of-science abbvie-ventures partner-with-us key-facts \
  pipeline publications rd-sites landing-page leaders-listing science-page; do
  echo "--- $template ---"
  node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
    --import-script "tools/importer/import-${template}.bundle.js" \
    --urls "tools/importer/urls-${template}.txt" --disable-http2 2>&1 | grep "Completed"
done
```

### Step 3: Validate Import

```bash
# Count imported pages
find content/ -name "*.plain.html" | wc -l

# Check for content loss
find content/ -name "*.plain.html" -exec sh -c \
  'chars=$(sed "s/<[^>]*>//g" "$1" | wc -c); [ "$chars" -lt 50 ] && echo "LOW: $1"' _ {} \;

# Verify grid structure
grep -rl "grid-cols-8" content/ | wc -l
echo "pages with correct grid"
```

### Step 4: Preview Locally

```bash
# Start AEM dev server (from repo root)
aem up --html-folder content --port 3000

# Preview a page at:
# http://localhost:3000/content/who-we-are/our-stories/the-math-of-migraine
```

---

## File Structure

```
tools/importer/
├── import-{template}.js         # Source import scripts (one per template)
├── import-{template}.bundle.js  # Bundled scripts (generated by esbuild)
├── urls-{template}.txt          # URL lists per template
├── run-import.js                # Standalone single-page import runner
├── parsers/                     # Block parsers (used by parser-based scripts)
│   ├── hero.js                  # Hero block parser
│   ├── accordion.js             # Accordion parser
│   ├── brightcove-video.js      # Video player parser
│   ├── columns.js               # Multi-column layout parser
│   ├── cards.js                 # Card grid parser
│   ├── story-cards.js           # Story card parser
│   ├── quote.js                 # Quote block parser
│   ├── linklist.js              # Link list parser
│   ├── text-container.js        # Text block parser
│   ├── custom-title.js          # Title parser
│   ├── custom-image.js          # Image parser
│   ├── cta.js                   # CTA button parser
│   ├── separator.js             # Separator parser
│   ├── carousel.js              # Carousel parser
│   ├── tabs.js                  # Tabs parser
│   ├── table.js                 # Table parser
│   ├── teaser.js                # Teaser parser
│   ├── fact-card.js             # Stats/KPI parser
│   ├── embed.js                 # Embed/iframe parser
│   └── utils/
│       ├── analytics.js         # Analytics data extraction utility
│       └── metadata.js          # Page metadata extraction utility
├── transformers/
│   ├── abbvie-cleanup.js        # Pre/post-import DOM cleanup (removes nav, footer, cookies)
│   └── sections.js              # Section break insertion by template
├── page-templates.json          # Template definitions with block mappings
└── fix-registry.json            # Post-import fix tracking (fix-forward pipeline)
```

---

## Key Concepts

### Bundle vs Source

- **Source** (`import-story-article.js`): The editable import script with ES module imports
- **Bundle** (`import-story-article.bundle.js`): Self-contained IIFE with all dependencies inlined

You edit the source, then bundle it. The bulk importer only runs bundles.

**Bundling with esbuild (alternative to aem-import-bundle.sh):**
```bash
npx esbuild tools/importer/import-section-landing.js \
  --bundle --format=iife --global-name=CustomImportScript \
  --outfile=tools/importer/import-section-landing.bundle.js
```

### The `--disable-http2` Flag

AbbVie's servers sometimes have HTTP/2 protocol issues. Always use `--disable-http2` to force HTTP/1.1 fallback for reliable page loading.

### Import Script Architecture

There are two approaches used in this project:

1. **Self-contained scripts** (story-article, leader-profile, five-technologies, section-landing):
   - Walk the DOM directly using content root detection
   - Build block div structures matching exact row specs from migration-skill
   - Return a clean output element with only EDS blocks

2. **Parser-based scripts** (remaining 20+ templates):
   - Use shared parsers (hero.js, columns.js, etc.) to replace DOM elements in-place
   - Use sections transformer to insert section breaks
   - Return the modified document.body

Self-contained scripts are more reliable as they don't depend on brittle CSS selector matching.

### Content Output Format

Imported pages are saved to `content/` as `.plain.html` following the URL path:
```
https://www.abbvie.com/who-we-are/our-stories/the-math-of-migraine.html
→ content/who-we-are/our-stories/the-math-of-migraine.plain.html
```

The `.plain.html` format uses **div-based block structure** (NOT table-based):
```html
<div><!-- Section 1 -->
  <div class="hero-container height-default overlay-height-short">
    <div><div><picture><img src="..." alt="..."></picture></div><div></div>...</div>
  </div>
  <div class="custom-title h1-size">
    <div><div><h1>Title</h1></div></div>
    <div><div></div></div><div><div>none</div></div><div><div></div></div>
  </div>
  <div class="section-metadata"><div><div>style</div><div>content-wide, medium-radius</div></div></div>
</div>
<div><!-- Section 2 (one line per section) -->
  ...blocks...
</div>
```

Each block follows its exact row structure from the migration-skill reference:
- `custom-title`: 4 rows [heading, blockId, language, analyticsId]
- `text-container`: 4+ rows [blockId, language, analyticsId, content...]
- `hero-container`: 1 row with 6 cells [image, videoUrl, text, bgColor, ctaLabel, ctaUrl]
- `separator`: 4 rows [showLine, blockId, language, analyticsId]

### Section Structure (2-8-2 Grid)

Story/content pages use a centered narrow layout:
```
Section 1: Hero + intro       → style: content-wide, medium-radius
Section 2: Grid parent        → style: grid-container, content-regular
Section 3: Left spacer        → style: grid-cols-2
Section 4: Body content       → style: grid-section, grid-cols-8
Section 5: Right spacer       → style: grid-cols-2
```

Landing pages use full-width sections with per-section styles:
```
Section 1: Hero               → style: content-wide, medium-radius
Section 2: Body content       → style: grid-container, content-regular + grid-cols
Section N: Metadata           → contains .metadata block
```

---

## Troubleshooting

### "Timeout 60000ms exceeded"
The live site is slow or unreachable. Retry, or check network connectivity.

### Hero image not showing
Verify the hero-container block has **1 row with 6 cells** (not 6 separate rows).
```javascript
// CORRECT
makeBlock(doc, 'Hero Container (...)', [[picP, '', '', '', '', '']]);
// WRONG (creates 6 hero items for rotation — 5 empty)
makeBlock(doc, 'Hero Container (...)', [[picP], [''], [''], [''], [''], ['']]);
```

### Content appearing in wrong order
The body extraction sorts elements by `getBoundingClientRect().top` (visual position).
If content appears out of order, the Y-position sorting may be incorrect for that page's DOM structure.

### Accordion content leaking into body
Elements inside `.cmp-accordion` panels are excluded from body extraction. If they still leak, check the ancestor filter in the body loop.

### Bundle fails with "Could not resolve"
A file imported by the script doesn't exist. Check the `import` paths at the top of the script.

---

## Skills Reference

For detailed block field mappings, CSS classes, and migration patterns, see:

| Skill | Location | Purpose |
|-------|----------|---------|
| `block-analysis` | `.claude/skills/block-analysis/SKILL.md` | Complete xwalk property reference for all blocks |
| `migration-patterns` | `.claude/skills/migration-patterns/SKILL.md` | Grid system, section metadata, block row formats |
| `migration-skill` | `.claude/skills/migration-skill/SKILL.md` | Master reference — all 41 blocks, class combinations |
| `block-analysis-full` | `.claude/skills/block-analysis-full/SKILL.md` | Remaining 32 blocks (feeds, nav, pipeline, etc.) |
| `migration-rules` | `.claude/skills/migration-rules/SKILL.md` | Fix-forward pipeline, AEM DOM inspection rules |
