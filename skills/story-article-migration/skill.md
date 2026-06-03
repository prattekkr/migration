# Story Article Migration Skill
## AEM (abbvie-com2) → EDS (abbvie-nextgen-eds) — Story Article Template

> **Source of truth**: Derived from side-by-side comparison of real migrated page pairs.
> Do NOT rely on existing codebase import scripts — use this document instead.

---

## 1. Output Format

The migration produces **EDS JCR JSON** — the format consumed by Universal Editor (AEM as a Cloud Service).
It is NOT HTML block tables.

Top-level shape:
```json
{
  "jcr:primaryType": "cq:Page",
  "jcr:content": {
    "sling:resourceType": "core/franklin/components/page/v1/page",
    "cq:template": "/libs/core/franklin/templates/page",
    "jcr:title": "<url-slug>",
    "root": {
      "sling:resourceType": "core/franklin/components/root/v1/root",
      "section_intro": { ... },
      "section_video": { ... },      // only if video present
      "grid_container": { ... },
      "grid_section_left": { ... },
      "grid_section_body": { ... },
      "grid_section_right": { ... }
    }
  }
}
```

---

## 2. Page Section Layout

### Section 1 — Intro (always present)
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "section",
  "language": "none",
  "classes_customDynamicClass": "content-wide,large-radius",
  ... hero_container, cta, story_card, custom_title, text_container
}
```
**AEM source**: `responsivegrid1.container1` (hero bg) + `container2.container3` (intro content)

### Section 2 — Video (only if AEM has a video/v2 component)
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "section",
  "language": "none",
  "classes_customDynamicClass": "content-regular,align-center,section-padding,container-x-large",
  ... brightcove_video, text_container(empty)
}
```
**AEM source**: `responsivegrid1.container2.video_*` component

### Section 3 — Grid Container wrapper
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "grid-container",
  "classes_container": "grid-container",
  "classes_customDynamicClass": "content-regular,padding-bottom",
  "language": "none"
}
```
**AEM source**: `responsivegrid1.grid`

### Section 4 — Left spacer (grid-cols-2)
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "grid-section",
  "classes_customDynamicClass": "grid-cols-2",
  "language": "none"
}
```
Empty — no content blocks inside.

### Section 5 — Body content (grid-cols-8)
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "grid-section",
  "classes_container": "grid-section",
  "classes_customDynamicClass": "grid-cols-8",
  "language": "none",
  ... all article body blocks in order
}
```
**AEM source**: `responsivegrid1.grid.par_12`

### Section 6 — Right spacer / Related content (grid-cols-2)
```json
{
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "grid-section",
  "classes_customDynamicClass": "grid-cols-2",
  "language": "none",
  ... text_container("Related content") + story_card(sidePanel) if par_13 has cardpagestory
}
```
**AEM source**: `responsivegrid1.grid.par_13` (related content)

---

## 3. Block Mappings (AEM → EDS)

### 3.1 Hero Container
**AEM**: `responsivegrid1.container1.backgroundImageReference`

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "hero-container",
  "name": "Hero Container",
  "filter": "hero-container",
  "classes": ["height-default"],
  "classes_overlayHeight": "overlay-height-short",
  "hero_container_item": {
    "sling:resourceType": "core/franklin/components/block/v1/block/item",
    "model": "hero-container-item",
    "name": "Hero Container Item",
    "image": "<DELIVERY_URL>",
    "imageMimeType": "image/jpeg"
  }
}
```
**Field notes**:
- `classes: ["height-default"]` — always height-default for story articles
- `classes_overlayHeight: "overlay-height-short"` — always short
- `image` — use delivery URL (see Section 6 for URL conversion)

---

### 3.2 CTA (Back Button)
**AEM**: `responsivegrid1.container2.container3.button`

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "cta",
  "name": "Cta",
  "linkText": "<jcr:title>",
  "link": "<aem-path converted to www.abbvie.com URL>",
  "ctaTarget": "_self",
  "classes": "default-cta",
  "classes_customDynamicClass": "back-cta",
  "iconVariation": "none",
  "iconFont": "chevron",
  "iconPosition": "before",
  "ariaHidden": false,
  "language": "none"
}
```
**Field mapping**:
- AEM `jcr:title` → EDS `linkText`
- AEM `linkURL` → EDS `link` (convert `/content/abbvie-com2/us/en/...` → `https://www.abbvie.com/...html`)
- AEM `linkTarget` → EDS `ctaTarget`

---

### 3.3 Story Card — storyCardInfo variant
**AEM**: `responsivegrid1.container2.container3.storyinfo`

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "story-card",
  "name": "Story Card",
  "storyCardVariant": "storyCardInfo",
  "hidePublicationDate": false,
  "hideReadTime": false,
  "hideRole": true,
  "hideDescription": true,
  "hideImage": true,
  "openInNewTab": false,
  "language": "lang:none",
  "blockId": "id:"
}
```
**Notes**: The `storyinfo` component always maps to this fixed set of fields.

---

### 3.4 Custom Title
**AEM**: `container3.title` or body `title` / `title2` nodes

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "custom-title",
  "name": "Custom Title",
  "filter": "custom-title",
  "title": "<jcr:title>",
  "titleType": "<type>",
  "classes_customDynamicClass": "<variant>",
  "language": "none",
  "blockId": "id:"
}
```
**Field mapping**:
- AEM `jcr:title` → EDS `title`
- AEM `type` (h1/h2/h3/h4/h5) → EDS `titleType`
- `classes_customDynamicClass` by heading level:
  - h1 (intro/page title) → `"h1-size"`
  - h5 (article body subheadings) → `"h5-size,width-large"`

---

### 3.5 Text Container
**AEM**: `text` components (v2)

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "text-container",
  "name": "Text Container",
  "filter": "text-container",
  "language": "none",
  "classes_customDynamicClass": "<variant>",
  "text_container_text": {
    "sling:resourceType": "core/franklin/components/block/v1/block/item",
    "model": "text-container-text",
    "name": "Text Container Text",
    "text": "<cleaned HTML>"
  }
}
```
**Variant selection** (`classes_customDynamicClass`):
| Content type | Variant |
|---|---|
| Lede paragraph (intro section) | `""` (no dynamic class) — use `classes_commonCustomClass: "body-unica-32-reg"` |
| Body paragraphs | `"spacing-bottom,width-large"` |
| Italic caption after image | `"spacing-bottom"` |
| References (numbered list) | `"width-x-large,standard"` |
| Empty placeholder | `""` |
| Related content header text | `"width-x-small"` |

**Text cleanup rules**:
1. Strip `<span class="light-font">`, `<span class="body-unica-32-reg">` wrapper spans (keep inner text/html)
2. Convert `<i>` → `<em>` 
3. Convert AEM internal links: `/content/abbvie-com2/us/en/PATH.html` → `https://www.abbvie.com/PATH.html`
4. Strip `\r\n` → `\n`

---

### 3.6 Custom Image
**AEM**: `image` (v2) components in body

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "custom-image",
  "name": "Custom Image",
  "image": "<DELIVERY_URL>",
  "imageMimeType": "image/jpeg",
  "imageAlt": "<alt from DAM or empty>",
  "getAltFromDAM": false,
  "imageIsDecorative": false,
  "getCaptionFromDAM": false,
  "displayCaptionBelowImage": false,
  "enableLink": false,
  "clickBehavior": "_self",
  "enableWarnOnLeave": false,
  "language": "none"
}
```
**Field mapping**:
- AEM `fileReference` → EDS `image` (delivery URL — see Section 6)
- AEM `alt` → EDS `imageAlt` (if provided)
- AEM `isDecorative` → EDS `imageIsDecorative` (boolean)

---

### 3.7 Brightcove Video
**AEM**: `video/v2` components with `videoType: "brightcove"`

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "brightcove-video",
  "name": "Brightcove Video",
  "filter": "brightcove-video",
  "overlayTitle": "<title>",
  "overlayDescription": "<description HTML>",
  "overlayButtonText": "<btnText>",
  "overlayButtonIconType": "icon-font",
  "overlayButtonFontIcon": "play",
  "iconPosition": "left",
  "playerType": "single",
  "accountId": "<brightcoveAccount>",
  "videoId": "<brightcoveVideoId>",
  "posterType": "brightcove",
  "colorOverlay": "none",
  "videoContentLayout": "none",
  "enableAutoplay": false,
  "enableLoop": false,
  "enableCaptions": false,
  "enableVideoChapters": false,
  "enableRecommendedVideo": false,
  "enablePlayerControls": true,
  "enableSocialShare": false,
  "enableTranscript": false,
  "enablePlaylistThumbnailMetadata": false,
  "playlistType": "carousel",
  "transcriptType": "brightcove",
  "transcriptButtonIconType": "icon-font",
  "showTranscriptLabel": "transcript",
  "hideTranscriptLabel": "transcript",
  "transcriptLinkIconPosition": "after",
  "transcriptHideFontIcon": "play",
  "transcriptShowFontIcon": "play",
  "transcriptClickBehavior": "new-tab",
  "language": "none"
}
```
**Field mapping**:
- AEM `brightcoveVideoId` → EDS `videoId`
- AEM `brightcoveAccount` → EDS `accountId`
- AEM `title` → EDS `overlayTitle`
- AEM `description` → EDS `overlayDescription` (strip `\r\n`)
- AEM `btnText` → EDS `overlayButtonText`
- AEM `showBrightcoveControls` → EDS `enablePlayerControls` (string "true" → boolean true)
- AEM `loopVideo` → EDS `enableLoop` (string → boolean)
- Poster image from AEM `fileReference` is NOT migrated (uses Brightcove thumbnail)

---

### 3.8 Quote
**AEM**: `quote` components

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "quote",
  "name": "Quote",
  "quotation": "<p><strong>{quote text}</strong></p>",
  "attributionName": "<attributionName>",
  "attributionRole": "<attributionTitle>",
  "quoteVariant": "basic",
  "classes_customDynamicClass": "quote-standard,quote-h4",
  "language": "none"
}
```
**Field mapping**:
- AEM `quote` (plain text) → EDS `quotation` wrapped as `<p><strong>{text}</strong></p>`
- AEM `attributionName` → EDS `attributionName` (direct)
- AEM `attributionTitle` → EDS `attributionRole` (field rename)
- AEM `quoteType` ("regular") → EDS `quoteVariant: "basic"` (always)
- AEM `textSize` ("h0") → EDS `classes_customDynamicClass: "quote-standard,quote-h4"` (always)

---

### 3.9 Separator
**AEM**: `separator/v2` components

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "separator",
  "name": "Separator",
  "showLine": false,
  "classes_customDynamicClass": "separator-height-24",
  "language": "none"
}
```

---

### 3.10 Story Card — sidePanel variant (Related Content)
**AEM**: `cardpagestory/v1` in `par_13`

```json
{
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "story-card",
  "name": "Story Card",
  "storyCardVariant": "sidePanel",
  "hidePublicationDate": false,
  "hideReadTime": false,
  "hideRole": false,
  "hideDescription": false,
  "hideImage": false,
  "openInNewTab": false,
  "page": "<EDS content path for related story>",
  "language": "lang:none",
  "blockId": "id:"
}
```
**Note**: The related `page` path must be converted from AEM path to EDS content path:
- AEM: `/content/abbvie-com2/us/en/who-we-are/our-stories/SLUG`
- EDS: `/content/abbvie-nextgen-eds/corporate/abbvie-com/us/en/who-we-are/our-stories/SLUG`

---

## 4. Body Content Processing Order (par_12)

Walk `par_12` children **in insertion order**. For each child:

| AEM node type | Action |
|---|---|
| `container/v2` | Recurse into children (transparent wrapper) |
| `title/v2` | Emit `custom-title` block |
| `text/v2` | Detect content type → emit `text-container` block with correct variant |
| `image/v2` | Emit `custom-image` block |
| `separator/v2` | Emit `separator` block |
| `carousel/v2` | Emit `carousel` block (NOT used in story article — skip or handle separately) |
| `quote` | Emit `quote` block |
| `accordion/v2` | Emit `text-container` with `width-x-large,standard` (treat as references text) |

**Text content type detection**:
- `\r\n` only or empty → skip
- Contains `<i>` or `<em>` and length < 400 chars → caption → `spacing-bottom`
- Contains `<strong>References` OR `<ol>` footnote list → references → `width-x-large,standard`
- Otherwise → body text → `spacing-bottom,width-large`

---

## 5. What to Drop / Ignore

- `experiencefragmentHeader` / `experiencefragmentFooter` — skip
- `cq:styleIds` on any node — ignore
- `storyinfo` component → replace with `story-card (storyCardInfo)` 
- AEM `header/v2` (eyebrow) → replace with `text-container` containing `<p><strong>{eyebrow}</strong></p>`
- `separator` inside `par_13.container_copy_copy` — drop (not needed in EDS)
- AEM `container5` wrapper in par_13 — transparent, process children directly

---

## 6. Image URL Conversion

EDS delivery URL format:
```
https://delivery-p157365-e1665873.adobeaemcloud.com/adobe/assets/urn:aaid:aem:{UUID}/as/{filename}.avif?assetname={filename}.jpg
```

Since the UUID is not available in the AEM JSON, use this placeholder strategy:
- Store the AEM DAM path as the `image` value
- Mark with comment `// TODO: replace with delivery URL`
- The UUID can be looked up via AEM Assets API: `GET /adobe/assets/search?assetPath=/content/dam/...`

**Filename extraction** (for assetname param):
- Take last segment of DAM path: `/content/dam/abbvie-com2/.../wp-sponsorship-hero.jpg` → `wp-sponsorship-hero.jpg`

---

## 7. Link URL Conversion

| From (AEM) | To (EDS) |
|---|---|
| `/content/abbvie-com2/us/en/PATH` | `https://www.abbvie.com/PATH.html` |
| `/content/abbvie-com2/us/en/PATH.html` | `https://www.abbvie.com/PATH.html` |
| `https://...` (already absolute) | keep as-is |
| `mailto:...` | keep as-is |

**Content path conversion** (for story-card `page` field):
- AEM: `/content/abbvie-com2/us/en/PATH`
- EDS: `/content/abbvie-nextgen-eds/corporate/abbvie-com/us/en/PATH`

---

## 8. Node Naming Conventions

EDS node names use underscores and lowercase:
- `hero_container`, `cta`, `story_card`, `custom_title`, `text_container`
- Multiple same-type nodes get numeric suffix: `custom_title_2`, `text_container_3`
- Grid nodes: `grid_container`, `grid_section`, `grid_section_body`, `grid_section_right`
- Item child nodes: `hero_container_item`, `text_container_text`

---

## 9. Common Node Template (all blocks)

Every block shares these base fields:
```json
{
  "jcr:primaryType": "nt:unstructured",
  "sling:resourceType": "core/franklin/components/block/v1/block",
  "model": "<model-name>",
  "name": "<Display Name>",
  "aueComponentId": "<model-name>"
}
```

Every section shares:
```json
{
  "jcr:primaryType": "nt:unstructured",
  "sling:resourceType": "core/franklin/components/section/v1/section",
  "model": "section",
  "aueComponentId": "section",
  "language": "none"
}
```
