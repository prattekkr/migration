# Story Article Migration Skills

> Step-by-step workflow for migrating AbbVie story article pages to EDS XWalk.

---

## Skill 1: Pre-flight Checks

Before migrating any page:

```bash
# 1. Verify component-filters.json is clean
node -e "
const f=JSON.parse(require('fs').readFileSync('component-filters.json'));
const bad=f.filter(x=>!x.id||x.components?.length===0);
if(bad.length)console.error('❌ Fix filters:',bad.map(x=>x.id));
else console.log('✅ Filters clean');
"

# 2. Verify component-definition.json has no dangling filter refs
node -e "
const d=JSON.parse(require('fs').readFileSync('component-definition.json'));
const f=JSON.parse(require('fs').readFileSync('component-filters.json'));
const ids=new Set(f.map(x=>x.id));
d.groups.forEach(g=>g.components.forEach(c=>{
  const ref=c.plugins?.xwalk?.page?.template?.filter;
  if(ref&&!ids.has(ref))console.error('❌',c.id,'refs missing filter:',ref);
}));
console.log('✅ Definitions checked');
"

# 3. Verify all parsers have valid syntax
for f in tools/importer/parsers/*.js; do node --check "$f" || exit 1; done
echo "✅ All parsers valid"
```

---

## Skill 2: Import a Single Page

```bash
# Set the URL
URL="https://www.abbvie.com/who-we-are/our-stories/PAGE-SLUG.html"
echo "$URL" > tools/importer/urls-story-article.txt

# Bundle (picks up latest parser/transformer changes)
bash /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
  --importjs tools/importer/import-story-article.js

# Run import
WORKSPACE_PATH=$(pwd) node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls tools/importer/urls-story-article.txt \
  --disable-http2
```

---

## Skill 3: Post-Process Variants

After import, fix design variant classes:

```bash
node tools/importer/post-process-variants.js content/who-we-are/our-stories/PAGE-SLUG.plain.html
```

Or batch all pages:

```bash
node tools/importer/post-process-variants.js content/
```

---

## Skill 4: Validate Output

```bash
# Check hero section has 5 blocks
python3 -c "
import re
with open('content/who-we-are/our-stories/PAGE-SLUG.plain.html') as f:
    html = f.read()
sections = []
depth = 0; start = -1
for i in range(len(html)):
    if html[i:i+4]=='<div':
        if depth==0: start=i
        depth+=1
    elif html[i:i+6]=='</div>':
        depth-=1
        if depth==0: sections.append(html[start:i+6])
hero = sections[0]
blocks = re.findall(r'class=\"(hero-container|cta|story-card|custom-title|text-container)[^\"]*\"', hero)
print(f'Hero blocks: {blocks}')
assert len(blocks) >= 5, '❌ Hero missing blocks!'
print('✅ Hero section valid')
"
```

---

## Skill 5: Fix Lazy-Loaded Images

Some images with `data-cmp-lazy` won't have src in the output. Fix manually:

```bash
# Find empty custom-image blocks
grep -n 'class="custom-image"><div><div></div>' content/who-we-are/our-stories/PAGE-SLUG.plain.html

# If found, get the image URL from the source page and inject:
# Replace: <div class="custom-image"><div><div></div>
# With:    <div class="custom-image"><div><div><picture><img src="URL" alt="ALT" loading="lazy"></picture></div>
```

---

## Skill 6: Bulk Import Multiple Pages

```bash
# Create URL list
cat > tools/importer/urls-story-article.txt << 'URLS'
https://www.abbvie.com/who-we-are/our-stories/page-1.html
https://www.abbvie.com/who-we-are/our-stories/page-2.html
https://www.abbvie.com/who-we-are/our-stories/page-3.html
URLS

# Bundle & run
bash /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/aem-import-bundle.sh \
  --importjs tools/importer/import-story-article.js

WORKSPACE_PATH=$(pwd) node /home/node/.excat-marketplace/excat/skills/excat-content-import/scripts/run-bulk-import.js \
  --import-script tools/importer/import-story-article.bundle.js \
  --urls tools/importer/urls-story-article.txt \
  --disable-http2

# Post-process all
node tools/importer/post-process-variants.js content/
```

---

## Skill 7: Add a New Block Parser

When a new block type is found on a page:

1. Check `component-models.json` for the block's field list
2. Check `component-filters.json` — is it a container block?
3. Count fields: remove collapsed ones (Alt, Type, Title, Text, MimeType) = row count
4. If container with 2+ child types: add child type identifier row (2 cols)
5. If container with 1 child type: child fields as columns in 1 row (hero-container pattern)
6. Create parser at `tools/importer/parsers/BLOCK-NAME.js`
7. Add to import script: import, register in parsers object, add to PAGE_TEMPLATE blocks with selector
8. Re-bundle and test

---

## Skill 8: Add a New Variant Mapping

When a page has AEM classes that produce wrong EDS variants:

1. Check the source page's AEM classes on the element
2. Check the reference EDS page for the correct variant
3. Update the parser's variant detection logic OR add to `post-process-variants.js`
4. Update `class-mapping.json` for documentation
5. Re-bundle (if parser changed) or re-run post-process

---

## Skill 9: Debug md2jcr Issues

When aemcoder shows errors:

1. **"Cannot read properties of undefined (reading 'components')"**
   → A block in component-definition.json references a filter that doesn't exist in component-filters.json
   → Fix: remove the `"filter"` property from that block's definition

2. **"Text Container has errors"**
   → Row count or column count doesn't match what md2jcr expects
   → Check: text-container must have exactly 5 rows (4×1col + 1×2col with "text-container-text")

3. **"JCR XML not available"**
   → Generic md2jcr failure. Check all blocks on the page for:
   - Empty `components: []` in filters
   - Wrong row count
   - Variant class leaking (e.g., "after" appearing as block class)

4. **Field values mapped to wrong properties**
   → Row order doesn't match model field order
   → Cross-reference model fields with your cell array order

---

## Skill 10: Visual Comparison

After migration, compare visually:

1. Push content to GitHub
2. Preview: `curl -X POST "https://admin.hlx.page/preview/prattekkr/migration/main/PATH"`
3. Compare side-by-side:
   - Original: `https://www.abbvie.com/who-we-are/our-stories/SLUG.html`
   - Migrated: `https://main--migration--prattekkr.aem.page/who-we-are/our-stories/SLUG`
4. Check: hero, grid layout, text spacing, quotes, video, related cards
5. If design differs: update variant classes via post-process script

---

## File Inventory

| File | Purpose |
|------|---------|
| `tools/importer/import-story-article.js` | Import orchestrator (parsers + transformers + template) |
| `tools/importer/import-story-article.bundle.js` | Bundled version (what actually runs) |
| `tools/importer/parsers/*.js` | Block parsers (one per block type) |
| `tools/importer/transformers/abbvie-cleanup.js` | DOM cleanup (beforeTransform) |
| `tools/importer/transformers/abbvie-sections.js` | Section structure (afterTransform) |
| `tools/importer/page-templates.json` | Template config with block selectors |
| `tools/importer/class-mapping.json` | AEM→EDS variant reference |
| `tools/importer/post-process-variants.js` | Post-import variant fixer |
| `tools/importer/RULES.md` | Migration rules (this file's companion) |
| `tools/importer/BLOCK-STRUCTURE.md` | Block row/col reference |
| `tools/importer/MIGRATION_PROMPT.md` | Full migration prompt |
| `content/**/*.plain.html` | Migrated page output |
