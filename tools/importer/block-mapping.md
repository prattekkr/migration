# AbbVie AEM → EDS Block Mapping Registry

> **This file is the single source of truth for all AEM-to-EDS block mappings.**
> Referenced by CLAUDE.md Rule 7. All migration work MUST consult this file.
>
> **To add a new block or variant:** Add a row to the relevant table below and commit.
> All team members and automated tools will pick up the change.

**Last updated:** 2026-05-17
**Verified against:** `develop--dev-abbvie-com--abbvie.aem.page` (manually migrated reference pages)

---

## 1. Block Name Registry

Every AEM component maps to a specific AbbVie EDS block. **Never use generic EDS block names.**

| # | AEM Source Class | EDS Block Name | Generic Name (DO NOT USE) | Verified On Templates |
|---|---|---|---|---|
| 1 | `container.cmp-container-full-width` (with height + background) | `hero-container` | ~~hero~~ | T02, T04, T05, T14, T16 |
| 2 | `title.cmp-title-*` / `.cmp-title` | `custom-title` | ~~title~~ | T02, T04, T05, T14, T16 |
| 3 | `text.cmp-text-*` / `.cmp-text` | `text-container` | ~~text~~ | T02, T04, T05, T14, T16 |
| 4 | `.cmp-image` / `img.cmp-image__image` | `custom-image` | ~~image~~ | T02, T04, T05, T14 |
| 5 | `.cmp-button` / `a.cmp-button` | `cta` | ~~button~~ | T02, T04, T05, T14 |
| 6 | `.brightcove-video` / `[data-video-id]` / `iframe[src*="youtube"]` | `brightcove-video` | ~~embed~~ ~~video~~ | T02, T04 |
| 7 | `.cmp-separator` / `hr.cmp-separator__horizontal-rule` | `separator` | — (same name, must include height variant) | T02, T04, T05, T14 |
| 8 | `nav.cmp-breadcrumb` / `ol.cmp-breadcrumb__list` | `breadcrumb` | — (same name) | T14, T16 |
| 9 | Navigation link lists / related content links | `linklist` | ~~columns~~ | T02 |
| 10 | `.cmp-quote` / `blockquote` | `quote` | — (same name, must include variant) | T04 |
| 11 | `.cardpagestory` / `.dashboardcards` | `story-card` | ~~cards~~ | T04 |
| 12 | `.cmp-carousel` | `carousel` | — (same name, must include variant) | T04 |
| 13 | `.cmp-accordion` / `.cmp-accordion-large` | `accordion` | — (same name, must include variant) | T04 |

---

## 2. Variant Registry

Each block has specific variants. When migrating, select the variant that matches the AEM source class.

### 2.1 hero-container

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| `height-short` on container | `height-short` | Short hero (profiles, contact pages) |
| `height-default` on container | `height-default` | Standard hero (most pages) |
| `height-tall` on container | `height-tall` | Tall hero (acquired company, landing pages) |
| `overlay-height-short` context | `overlay-height-short` | Short content overlay on hero image |
| `overlay-height-default` context | `overlay-height-default` | Standard content overlay |
| `.semi-transparent-layer` on container | `navy` | Dark navy overlay on hero background |
| No dark overlay | *(no color class)* | Light/default hero |

**Hero composite pattern:** In EDS, the hero section contains multiple blocks:
```
Section (hero-container-container)
  ├── hero-container block  (background image + height)
  ├── breadcrumb block      (if navigation breadcrumb present)
  ├── custom-title block    (page heading)
  └── text-container block  (subtitle, if present)
```

### 2.2 custom-title

**Core rule: Pass through existing variant classes from the AEM source title wrapper directly to EDS.**

The AEM source `.title` wrapper already contains the variant classes needed for EDS. Extract them and apply them as-is to the `custom-title` block. Do NOT invent or translate classes — preserve what's on the source.

**How it works (verified on migraine page):**

| AEM Source Classes on `.title` wrapper | EDS `custom-title` Classes | What happened |
|---|---|---|
| `title cmp-title-xx-large light-theme` (h1 tag) | `custom-title h1-size` | `cmp-title-xx-large` stripped (it's an AEM wrapper class, not a variant). `h1-size` added because the heading is `<h1>`. `light-theme` dropped (default in EDS) |
| `title cmp-title-xx-large light-theme h5-size` (h2 tag) | `custom-title h5-size width-large` | **`h5-size` passed through 1:1** from AEM source. `width-large` added for body content context |
| `title cmp-title-xx-large` (h5 tag) | `custom-title h5-size width-large` | No explicit size class on AEM but `<h5>` tag → `h5-size`. `width-large` for body context |
| `title cmp-title-xx-large medium-weight` | `custom-title medium-weight h1-size` | **`medium-weight` passed through 1:1**. `h1-size` from heading tag context |

**Extraction rules:**

1. **Size classes** — If AEM title has `h1-size`, `h3-size`, `h5-size` etc., **pass through directly** to EDS
2. **If no explicit size class** — Derive from the HTML heading tag: `<h1>` → `h1-size`, `<h3>` → `h3-size`, `<h5>` → `h5-size`
3. **Weight classes** — `medium-weight`, `book-weight`, `weight-medium` → **pass through directly**
4. **Theme classes** — `light-theme`, `theme-light` → **pass through directly** (may be omitted if default)
5. **Alignment classes** — `align-left`, `align-center` → **pass through directly**
6. **Width classes** — `width-large` is added in EDS for content-body titles (not from AEM source)
7. **Strip AEM wrapper classes** — `cmp-title-xx-large`, `cmp-title-x-large`, `cmp-title` are AEM-only wrapper classes — do NOT carry these to EDS

**Complete observed variants (all pages):**

| EDS Variant | Meaning | Observed On |
|---|---|---|
| `h1-size` | Largest heading | T04 story hero, T05 hero/cards, T16 hero |
| `h3-size` | Medium heading | T05 card section |
| `h5-size` | Small heading | T04 article body sub-sections |
| `medium-weight` | Medium font weight | T05 hero/sections, T16 hero/sections |
| `weight-medium` | Medium font weight (alternate form) | T02, T14 hero |
| `book-weight` | Light/book font weight | T02 CTA banner |
| `light-theme` / `theme-light` | Light text color | T02, T14 hero sections |
| `align-left` | Left alignment | T02, T14 hero sections |
| `width-large` | Constrained width in body content | T04 article sub-sections |
| Wide content context | `width-large` | Constrains title width in body content |

### 2.3 text-container

**Core rule: ALL text-container variants are EDS authoring choices. They are NOT derived from AEM source classes.**

The AEM `.text` wrapper classes (`cmp-text-xx-large`, `cmp-text-x-large`, `light-theme`, `single-column`, `standard`) have **no equivalent in EDS** and are all stripped. Every variant on the EDS `text-container` block is an independent authoring decision made in Universal Editor.

**Strip ALL AEM classes (none carry to EDS):**
- `cmp-text-xx-large`, `cmp-text-x-large`, `cmp-text` — AEM wrapper classes, no EDS equivalent
- `light-theme` — not used in EDS text-container
- `single-column` — AEM layout class, not used in EDS
- `standard` — AEM appearance class, not used in EDS

**Verified side-by-side (migraine page):**

| AEM Source Classes | EDS Classes | What happened |
|---|---|---|
| `text cmp-text-xx-large light-theme` (hero subtitle) | `body-unica-32-reg` | ALL AEM classes stripped. `body-unica-32-reg` is an **EDS authoring choice** — NOT mapped from `cmp-text-xx-large` |
| `text cmp-text-xx-large light-theme` (first body para) | `spacing-bottom width-large` | ALL AEM classes stripped. Layout classes are EDS authoring choices |
| `text cmp-text-xx-large` (image caption) | *(no variant)* | ALL AEM classes stripped. Plain default |
| `text cmp-text-xx-large` (body paragraph) | `width-large` | ALL AEM classes stripped. Width is EDS authoring choice |
| `text cmp-text-xx-large` (body with spacing) | `spacing-bottom width-large` | ALL AEM classes stripped. Layout is EDS authoring choice |
| `text cmp-text-xx-large` (last in section) | `spacing-bottom width-large section-padding` | ALL AEM classes stripped. Padding is EDS authoring choice |
| `text cmp-text-x-large light-theme single-column standard` (media contacts) | `spacing-bottom width-large body-unica-20-reg` | ALL AEM classes stripped. `body-unica-20-reg` is EDS authoring choice — NOT from `cmp-text-x-large` |

**EDS-only variant classes (all are UE authoring decisions, none from AEM):**

| EDS Variant | When to Apply | Notes |
|---|---|---|
| `body-unica-32-reg` | Large display text (hero subtitles, callouts) | Author selects this in UE for prominent text |
| `body-unica-20-reg` | Medium display text (media contacts, footnotes) | Author selects this in UE for secondary text |
| `width-large` | Body content paragraphs | Author sets width constraint for readability |
| `width-x-large` | Wider body content | Author selects for wider layouts |
| `width-x-small` | Very narrow content | Author selects for references, footnotes |
| `spacing-bottom` | Text block needing bottom margin | Author adds spacing between blocks |
| `section-padding` | Last text block in a section | Author adds section-level bottom padding |
| `align-right` | Right-aligned content | Author sets for RTL or right-aligned text |
| `standard` | Explicit standard styling | Author selects in UE |

### 2.4 separator

| Context | EDS Variant Class | When to Use |
|---|---|---|
| Tight inline divider | `separator-height-8` | Between closely related elements |
| Content sub-section break | `separator-height-24` | Between paragraphs/sub-sections in article body |
| Colored section bottom | `separator-height-48` | At bottom of background-colored sections |
| Section-level break | `separator-height-80` | Between major page sections |
| Large page break | `separator-height-96` | At bottom of acquired company / large pages |

### 2.5 cta

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Button on dark background | `default-cta dark-theme` | White/light button on dark sections |
| Button on light background | `default-cta light-theme` | Dark button on light sections |
| "Back" / "All Stories" return link | `default-cta back-cta` | Back navigation CTA (story articles) |

### 2.6 brightcove-video

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Video player without caption | `bcvideo-player-single bcvideo-content-none` | Standalone video |
| Video player with caption below | `bcvideo-player-single bcvideo-content-bottom` | Video with description text below |

### 2.7 story-card

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Story metadata (date, category, read time) | `is-text-only hide-role hide-description story-card-info` | In article hero section |
| Related content card with image | `is-side-panel has-image` | Related articles sidebar/footer |

### 2.8 carousel

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Image carousel in article | `carousel-show-btn-margin carousel-minimal` | Minimal style with navigation buttons |

### 2.9 accordion

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| FAQ / expandable sections | `accordion-icon-font h5-size width-large` | With icon font and constrained width |

### 2.10 linklist

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Related content navigation links | `linklist--rows-with-arrows` | Arrow-style row links |

### 2.11 quote

| AEM Source Indicator | EDS Variant Class | Notes |
|---|---|---|
| Standard blockquote with attribution | `quote-standard quote-h4` | Standard quote styling with h4-sized text |

### 2.12 breadcrumb, custom-image

These blocks have no observed variants — use the default (no variant class needed).

---

## 3. Grid Layout Mapping

The EDS project uses a 3-level section hierarchy for multi-column layouts.

### Section Types

| EDS Component | Role | AEM Equivalent |
|---|---|---|
| `Section` | Standard page section | `div.container.cmp-container-*` |
| `Grid Container` | Multi-column row wrapper | `div.grid` → `div.grid-container` → `div.grid-row` |
| `Grid Section` | Single column within a grid | `div.grid-row__col-with-N.grid-cell` |

### Column Width Mapping

| AEM Class | EDS Class | Width | Common Usage |
|---|---|---|---|
| `grid-row__col-with-1` | `grid-cols-1` | ~8% | Spacer/gap column |
| `grid-row__col-with-2` | `grid-cols-2` | ~17% | Narrow column |
| `grid-row__col-with-3` | `grid-cols-3` | 25% | Quarter width |
| `grid-row__col-with-4` | `grid-cols-4` | 33% | Third width |
| `grid-row__col-with-5` | `grid-cols-5` | ~42% | Image or text column |
| `grid-row__col-with-6` | `grid-cols-6` | 50% | Half width |
| `grid-row__col-with-7` | `grid-cols-7` | ~58% | Slightly wider half |
| `grid-row__col-with-8` | `grid-cols-8` | 67% | Two-thirds width |
| `grid-row__col-with-9` | `grid-cols-9` | 75% | Three-quarter width |
| `grid-row__col-with-10` | `grid-cols-10` | ~83% | Near full width |
| `grid-row__col-with-11` | `grid-cols-11` | ~92% | Almost full width |
| `grid-row__col-with-12` | *(use regular Section)* | 100% | Full width — no grid needed |

### Grid Rules

1. **Every AEM `grid-row`** → becomes an EDS `Grid Container` section
2. **Each `grid-row__col-with-N`** → becomes a `Grid Section` with `grid-cols-N`
3. **Empty spacer columns** (e.g., `col-with-1` with no content) → preserve as empty `Grid Section`
4. **Full-width columns** (`col-with-12`) → use a regular `Section` instead of Grid
5. **`cmp-grid-custom`** → `Grid Container` with additional layout style classes
6. **`cmp-grid-full-page-5-v1`** → `Grid Container` with preset layout styles

### Verified Grid Example (T14 Leader Profile)

```
AEM Source:                              EDS Output:
div.container.overlap-predecessor        Grid Container (no-padding content-regular no-bottom-margin)
  └── div.grid-row                         ├── Grid Section (grid-cols-5) → custom-image
        ├── col-with-5 [photo]             ├── Grid Section (grid-cols-1) → [empty]
        ├── col-with-1 [spacer]            ├── Grid Section (grid-cols-5) → text-container + cta
        ├── col-with-5 [bio + link]        └── Grid Section (grid-cols-1) → [empty]
        └── col-with-1 [spacer]
```

---

## 4. Section Container Mapping

How AEM container classes map to EDS section style classes.

### Container Width

| AEM Container Class | EDS Section Class | Notes |
|---|---|---|
| `cmp-container-full-width` | `content-wide` | Full bleed content |
| `cmp-container-xx-large` | `content-regular` | Standard content width |
| `cmp-container-x-large` | `container-x-large` | Large container |
| `cmp-container-large` | `container-large` | Medium-large container |
| `cmp-container-small` | `container-small` | Narrow content |
| `cmp-container-x-small` | `container-x-small` | Very narrow (contact pages) |
| `cmp-container-xxx-large` | `container-xxx-large` | Extra-wide (full bleed hero) |

### Layout Modifiers (Preserved 1:1)

| AEM Class | EDS Class | Purpose |
|---|---|---|
| `.no-bottom-margin` | `no-bottom-margin` | Remove bottom gap between sections |
| `.no-bottom-padding` | `no-bottom-padding` | Remove bottom padding |
| `.no-top-padding` | `no-top-padding` | Remove top padding |
| `.no-padding` | `no-padding` | Remove all padding |
| `.medium-radius` | `medium-radius` | Rounded corners (medium) |
| `.large-radius` | `large-radius` | Rounded corners (large) |
| `.regular-padding` | `regular-padding` | Standard padding |
| `.section-padding` | `section-padding` | Section-level padding |
| `.section-bottom-margin` | `section-bottom-margin` | Bottom margin on section |
| `.padding-bottom` | `padding-bottom` | Extra bottom padding |

### Background Colors

| AEM Source | EDS Section Class | Notes |
|---|---|---|
| Inline `background-color` style | `bg-{hex}` | Extract hex value, strip `#` |
| `.semi-transparent-layer` | Hero uses `navy` color variant | Dark overlay on hero |
| Light gray background | `bg-f4f4f4` | Common light gray |
| Purple accent background | `bg-8a2ecc` | CTA banner sections |
| Light blue/purple background | `bg-f1f3ff` | Acquired company card grids |
| No background | *(no bg class)* | Default white |

### Special Section Patterns

| AEM Pattern | EDS Pattern | How to Identify |
|---|---|---|
| `.overlap-predecessor` on container | `grid-container` section immediately after hero section | Content visually overlaps the hero image |
| Container with only `.cmp-separator` | Section with `separator-container` class | Standalone separator between major sections |
| Container with grid + background | Grid Container with `bg-{hex}` + `regular-padding` | Multi-column on colored background |

---

## 5. Reference Pages

All mappings verified by comparing these live AEM pages with their EDS equivalents:

| AEM Source URL | EDS Preview Path | Template | Blocks Verified |
|---|---|---|---|
| `abbvie.com/science/our-people/our-rd-leaders/primal-kaur.html` | `/science/our-people/our-rd-leaders/primal-kaur` | T14 leader-profile | hero-container, breadcrumb, custom-title, text-container, custom-image, cta, separator |
| `abbvie.com/science/our-people/behind-the-science.html` | `/science/our-people/behind-the-science` | T02 our-people-content | hero-container, breadcrumb, custom-title, text-container, brightcove-video, separator, custom-image, linklist, cta |
| `abbvie.com/who-we-are/our-stories/the-math-of-migraine.html` | `/drafts/prateek/the-math-of-migraine` | T04 story-article | hero-container, cta, story-card, custom-title, text-container, separator, carousel, custom-image, accordion |
| `abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html` | `/drafts/prateek/two-lives-converging-in-the-fight-against-parkinsons` | T04 story-article | hero-container, cta, story-card, custom-title, text-container, brightcove-video, quote, separator, custom-image |
| `abbvie.com/allergan.html` | `/drafts/prateek/allergan` | T05 acquired-company | hero-container, custom-title, text-container, cta, custom-image, separator |
| `abbvie.com/contact-center/locations/saudi-arabia.html` | `/drafts/prateek/saudi` | T16 contact-location | hero-container, breadcrumb, custom-title, text-container |

EDS reference site: `develop--dev-abbvie-com--abbvie.aem.page`

---

## 6. JCR XML Content Package Workflow

### Why JCR Packages Instead of md2jcr

md2jcr has a **known bug** with container blocks (text-container, hero-container) that have richtext child items with multiple paragraphs. `FieldGroupFieldResolver.resolve()` returns false for plain paragraph nodes, causing field exhaustion. This affects both imported AND manually authored pages — the reference page's own `.md` fails md2jcr validation.

**Workaround:** Generate JCR XML directly from imported content and install via AEM Package Manager.

### JCR XML Node Structure (from reference page)

```
root (nt:unstructured, core/franklin/components/root/v1/root)
  ├── section (section/v1/section, model="section")
  │     Required: classes_customDynamicClass, language, model, modelFields, aueComponentId
  │     ├── hero_container (block/v1/block, model="hero-container", filter="hero-container")
  │     │     Required: classes="[height-default]", classes_overlayHeight, modelFields
  │     │     └── hero_container_item (block/v1/block/item, model="hero-container-item")
  │     │           Required: image, imageMimeType, modelFields
  │     ├── cta (block/v1/block, model="cta")
  │     │     Required: link, linkText, ctaTarget, iconVariation, iconFont, iconPosition, 
  │     │               ariaHidden, classes="default-cta", classes_customDynamicClass, language, modelFields
  │     ├── story_card (block/v1/block, model="story-card")
  │     │     Required: storyCardVariant, hidePublicationDate...hideImage, page, openInNewTab,
  │     │               language, blockId, modelFields
  │     ├── custom_title (block/v1/block, model="custom-title", filter="custom-title")
  │     │     Required: title, titleType, classes_customDynamicClass, language, blockId, modelFields
  │     └── text_container (block/v1/block, model="text-container", filter="text-container")
  │           Required: classes_customDynamicClass (variants), language, modelFields
  │           └── text_container_text (block/v1/block/item, model="text-container-text")
  │                 Required: text (HTML-encoded), modelFields
  ├── grid_container (section/v1/section, model="grid-container")
  │     Required: classes_container="grid-container", classes_customDynamicClass, filter, identifier
  ├── grid_section (section/v1/section, model="grid-section")
  │     Required: classes_customDynamicClass="grid-cols-N", filter, identifier
  ├── grid_section_main (section/v1/section, model="grid-section")
  │     Required: classes_container="grid-section", classes_customDynamicClass="grid-cols-8"
  │     └── (blocks: text_container, custom_title, separator, carousel, custom_image...)
  └── grid_section_sidebar (section/v1/section, model="grid-section")
        Required: classes_customDynamicClass="grid-cols-2"
        └── (blocks: text_container, story_card)
```

### Key JCR Node Properties

| Property | Purpose | Example |
|---|---|---|
| `jcr:primaryType` | Always `nt:unstructured` for blocks | `nt:unstructured` |
| `sling:resourceType` | Block=`core/franklin/components/block/v1/block`, Item=`block/v1/block/item`, Section=`section/v1/section` | |
| `model` | Links to component-models.json model ID | `text-container` |
| `modelFields` | Array of `fieldName@componentType` | `[text@richtext]` |
| `aueComponentId` | Universal Editor component ID | `text-container-text` |
| `filter` | Links to component-filters.json | `text-container` |
| `name` | Display name in UE | `Text Container` |
| `classes` | Multiselect variant (array format) | `[height-default]` |
| `classes_customDynamicClass` | Dynamic picklist variants (comma-separated) | `spacing-bottom,width-large` |
| `text` | HTML-encoded richtext content | `&lt;p&gt;content&lt;/p&gt;` |

### Package Structure (with DAM assets)

```
package.zip
├── META-INF/vault/
│   ├── filter.xml        (page path + DAM path)
│   ├── properties.xml    (package name, version, group)
│   └── config.xml        (vault config)
├── jcr_root/content/migration/
│   └── page-path/
│       └── .content.xml  (JCR XML for the page — image refs point to DAM paths)
└── jcr_root/content/dam/migration/
    └── page-path/
        ├── .content.xml  (sling:Folder)
        ├── hero-image.jpeg/
        │   ├── .content.xml        (dam:Asset with metadata)
        │   └── _jcr_content/
        │       └── renditions/
        │           └── original    (actual image binary)
        ├── carousel-01.jpeg/
        │   ├── .content.xml
        │   └── _jcr_content/renditions/original
        └── ...
```

### DAM Asset Node Structure

```xml
<!-- Folder: sling:Folder -->
<jcr:root jcr:primaryType="sling:Folder"/>

<!-- Asset: dam:Asset with metadata -->
<jcr:root jcr:primaryType="dam:Asset">
  <jcr:content jcr:primaryType="dam:AssetContent">
    <metadata jcr:primaryType="nt:unstructured" dc:format="image/jpeg"/>
  </jcr:content>
</jcr:root>

<!-- Binary: _jcr_content/renditions/original (the actual file) -->
```

### filter.xml (must include BOTH paths)

```xml
<workspaceFilter version="1.0">
    <filter root="/content/migration/page-path"/>
    <filter root="/content/dam/migration/page-path"/>
</workspaceFilter>
```

### md2jcr Bug Details

The bug is in `FieldGroupFieldResolver.resolve()` (helix-md2jcr):
- Lines 78-91: For paragraph nodes without image/link as first child, returns `false`
- This causes `fields.splice(0, 1)` at line 98, consuming the field
- For container blocks with richtext child items, the greedy richtext loop (lines 263-278) doesn't prevent field exhaustion when `resolve` already removed the field
- Affects ANY container block with multi-paragraph richtext content
- Filed as known incompatibility — does NOT affect UE-authored content

---

## 7. Changelog

| Date | Change | By |
|---|---|---|
| 2026-05-17 | Initial registry: 13 blocks, all variants, grid mapping, section mapping | Migration team |
| 2026-05-17 | Fixed custom-title: variant classes are pass-through from AEM source (h5-size, medium-weight, etc.). Strip cmp-title-xx-large (AEM wrapper only) | Migration team |
| 2026-05-17 | Fixed text-container: ALL variants are EDS authoring choices (UE). No AEM class maps to any EDS variant. body-unica-32-reg is NOT derived from cmp-text-xx-large — it's an independent author selection. All AEM classes (cmp-text-xx-large, light-theme, single-column, standard) stripped | Migration team |
| 2026-05-17 | CRITICAL: md2jcr incompatibility with text-container richtext child items containing multiple paragraphs. FieldGroupFieldResolver.resolve() returns false for plain paragraph nodes, causing field exhaustion. This affects BOTH imported AND manually authored pages. Workaround: generate JCR XML directly and install via AEM Package Manager. | Migration team |
| 2026-05-17 | Added JCR XML package generation approach: import pipeline now produces .plain.html + JCR content package (.zip) for AEM Package Manager installation, bypassing md2jcr entirely | Migration team |
| 2026-05-17 | Confirmed component-models.json text-container has 3 field groups (classes, blockId, language) — NOT 4. The _text-container.json model differs from the built component-models.json after merging. Always use component-models.json as source of truth for field groups. | Migration team |
| 2026-05-17 | JCR XML structure confirmed: text-container parent node has classes_customDynamicClass (variants), language, filter, model, modelFields. Child text_container_text has text (HTML-encoded richtext), model, modelFields. Multiple paragraphs stored as single HTML string in text attribute. | Migration team |
| 2026-05-17 | Section structure in JCR: grid_container (section with classes_container="grid-container"), grid_section (classes_customDynamicClass="grid-cols-N"), grid_section with classes_container="grid-section" for main content column | Migration team |
