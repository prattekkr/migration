# AbbVie EDS Migration Prompt

> Copy-paste this prompt when migrating a new page or batch of pages.
> Replace the placeholder values in `[brackets]` with actual values.

---

## Prompt

```
Migrate [URL] to AEM EDS (XWalk).

## Project Context
- Project: prattekkr/migration (XWalk)
- AEM Author: author-p170502-e1825534.adobeaemcloud.com
- Content path: /content/migration/
- Template: [T04 story-article | T14 leader-profile | T05 acquired-company | T16 contact-location | etc.]
- Reference EDS pages: https://develop--dev-abbvie-com--abbvie.aem.page/drafts/prateek/

## Mandatory Rules (read these files FIRST)
1. Read `tools/importer/block-mapping.md` — ALL block name translations, variants, grid mapping, JCR structure
2. Read `CLAUDE.md` — Rules 1-8 (especially Rule 7: block mapping, Rule 8: JCR packages)
3. Read `tools/importer/MIGRATION_RULES.md` — Technical implementation details

## Block Name Rules (NEVER use generic EDS names)
- cmp-container-full-width → `hero-container` (NOT hero)
- cmp-title-* → `custom-title` (NOT title)
- cmp-text-* → `text-container` (NOT text)
- cmp-image → `custom-image` (NOT image)
- cmp-button → `cta` (NOT button)
- brightcove-video → `brightcove-video` (NOT embed)
- cardpagestory → `story-card` (NOT cards)
- grid-row__col-with-N → Grid Section `grid-cols-N` (NOT columns)

## Variant Rules
- custom-title: pass through AEM source classes (h5-size, medium-weight, etc.). Strip cmp-title-xx-large.
- text-container: variants are EDS authoring choices (body-unica-32-reg, spacing-bottom width-large, standard width-large). NOT derived from AEM classes.
- hero-container: height-short/default/tall from AEM source. overlay-height is UE authoring choice.
- separator: height variant from AEM source (separator-height-24, etc.)

## Grid Layout Rules
- AEM grid-row → EDS Grid Container section
- AEM grid-row__col-with-N → EDS Grid Section with grid-cols-N
- Empty spacer columns (col-with-1, col-with-2) → Empty Grid Section
- Story article layout: grid-container > grid-cols-2 (spacer) > grid-cols-8 (content) > grid-cols-2 (sidebar)

## JCR XML Output (CRITICAL — read block-mapping.md Section 6)
- DO NOT use md2jcr — it has a known bug with container blocks + multi-paragraph richtext
- Generate JCR XML directly matching the reference page structure
- Every block node MUST have: model, modelFields (array of fieldName@componentType), aueComponentId, sling:resourceType, jcr:primaryType="nt:unstructured"
- Container blocks (text-container, hero-container, carousel) have child item nodes (block/v1/block/item)
- Richtext content is HTML-encoded in the `text` attribute: &lt;p&gt;content&lt;/p&gt;
- Boolean values: {Boolean}true / {Boolean}false
- Number values: {Long}N
- Array values: [value1,value2] for multiselect classes
- Comma-separated values for classes_customDynamicClass
- ALWAYS use component-models.json (built) for modelFields — NOT raw _block.json files

## Reference JCR Structure (text-container example)
```xml
<text_container jcr:primaryType="nt:unstructured"
  sling:resourceType="core/franklin/components/block/v1/block"
  aueComponentId="text-container"
  classes_customDynamicClass="spacing-bottom,width-large"
  filter="text-container"
  language="none"
  model="text-container"
  modelFields="[classes_customDynamicClass@ngaem:dynamic-picklist,blockId@text,classes_commonCustomClass@text,language@select,analytics_id@text]"
  name="Text Container">
  <text_container_text jcr:primaryType="nt:unstructured"
    sling:resourceType="core/franklin/components/block/v1/block/item"
    aueComponentId="text-container-text"
    model="text-container-text"
    modelFields="[text@richtext]"
    name="Text Container Text"
    text="&lt;p&gt;Paragraph one.&lt;/p&gt; &lt;p&gt;Paragraph two.&lt;/p&gt;"/>
</text_container>
```

## Section Structure (story-article template)
```xml
<root>
  <section_hero>        <!-- Section: content-wide, medium-radius -->
    <hero_container/>   <!-- classes="[height-default]" -->
    <cta/>              <!-- classes="default-cta", classes_customDynamicClass="back-cta" -->
    <story_card/>       <!-- storyCardVariant="storyCardInfo" -->
    <custom_title/>     <!-- classes_customDynamicClass="h1-size", titleType="h1" -->
    <text_container/>   <!-- classes_commonCustomClass="body-unica-32-reg" (hero subtitle) -->
  </section_hero>
  <grid_container/>     <!-- classes_container="grid-container", classes_customDynamicClass="content-regular" -->
  <grid_section/>       <!-- classes_customDynamicClass="grid-cols-2" (left spacer) -->
  <grid_section_main>   <!-- classes_container="grid-section", classes_customDynamicClass="grid-cols-8" -->
    <text_container/>   <!-- classes_customDynamicClass="spacing-bottom,width-large" -->
    <custom_title/>     <!-- classes_customDynamicClass="h5-size,width-large", titleType="h5" -->
    <text_container/>   <!-- body paragraphs -->
    <separator/>        <!-- classes_customDynamicClass="separator-height-24" -->
    <carousel/>         <!-- config only, slides are separate custom_image blocks -->
    <custom_image/>     <!-- one per carousel slide -->
    ...
  </grid_section_main>
  <grid_section_sidebar> <!-- classes_customDynamicClass="grid-cols-2" -->
    <text_container/>    <!-- "Related content" header, classes_customDynamicClass="width-x-small" -->
    <story_card/>        <!-- storyCardVariant="sidePanel" -->
  </grid_section_sidebar>
</root>
```

## Deliverables
1. `.plain.html` — EDS block table format for local preview
2. `.content.xml` — JCR XML matching reference structure
3. **DAM assets** — all images downloaded and packaged under `/content/dam/migration/[page-path]/`
4. **AEM Content Package (.zip)** — installable via AEM Package Manager with:
   - META-INF/vault/filter.xml (content path + DAM path)
   - META-INF/vault/properties.xml (package name, version, group)
   - META-INF/vault/config.xml
   - jcr_root/content/migration/[page-path]/.content.xml
   - jcr_root/content/dam/migration/[page-path]/[image].jpeg/.content.xml + _jcr_content/renditions/original
5. Place package in `tools/importer/packages/`

## DAM Asset Rules
- Download ALL images referenced in the page (hero, carousel slides, inline images)
- Store under `/content/dam/migration/[page-path]/` with descriptive filenames
- Each image asset needs:
  - A directory named `[filename].jpeg/` (or .png, .webp)
  - `.content.xml` with `jcr:primaryType="dam:Asset"` and metadata
  - `_jcr_content/renditions/original` — the actual image binary
- Update all `image="..."` attributes in the page .content.xml to reference DAM paths
- filter.xml must include BOTH the page path AND the DAM path
- Scene7 URLs (`abbvie.scene7.com/is/image/...`) → download and store as local DAM assets
- AbbVie DAM URLs (`abbvie.com/content/dam/...`) → download and store as local DAM assets

## Workflow
1. Analyze source page DOM (AEM cmp-* classes per Rule 6)
2. Map AEM components → EDS blocks (per block-mapping.md)
3. Extract content (text, images, links, metadata)
4. Download all images to local DAM structure
5. Generate .plain.html with correct block tables and section structure
6. Generate JCR XML .content.xml with DAM path references
7. Package page + DAM assets as .zip for AEM Package Manager
8. Verify .plain.html renders correctly in EDS preview
9. Log any fixes in tools/importer/fix-registry.json (Rule 1)
```

---

## Quick Start Examples

### Single story article page
```
Migrate https://www.abbvie.com/who-we-are/our-stories/[story-name].html to AEM EDS.
Template: T04 story-article. Generate .plain.html + JCR content package (.zip).
Reference: https://develop--dev-abbvie-com--abbvie.aem.page/drafts/prateek/the-math-of-migraine
```

### Single leader profile page
```
Migrate https://www.abbvie.com/science/our-people/our-rd-leaders/[name].html to AEM EDS.
Template: T14 leader-profile. Generate .plain.html + JCR content package (.zip).
Reference: https://develop--dev-abbvie-com--abbvie.aem.page/science/our-people/our-rd-leaders/primal-kaur
```

### Batch migration (multiple URLs)
```
Migrate these URLs to AEM EDS. Template: T04 story-article.
Generate .plain.html + JCR content packages (.zip) for each page.

URLs:
- https://www.abbvie.com/who-we-are/our-stories/[url1].html
- https://www.abbvie.com/who-we-are/our-stories/[url2].html
- https://www.abbvie.com/who-we-are/our-stories/[url3].html
```
