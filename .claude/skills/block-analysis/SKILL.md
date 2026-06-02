# AbbVie EDS Block Analysis - Complete xwalk Property Reference

> Definitive reference for building import scripts that produce correct EDS block tables.
> Every field, every option, every default value from the component model JSON files.
> Generated: 2026-05-27

---

## Responsive Breakpoints (from styles/tokens.css)

| Token | Breakpoint | Description |
|---|---|---|
| `--bp-tablet` | `min-width: 744px` | Tablet and above |
| `--bp-desktop` | `min-width: 1024px` | Desktop and above |
| `--bp-wide` | `min-width: 1440px` | Wide desktop |
| `--bp-container-md` | `width <= 1330px` | Medium container cap |
| `--bp-container-lg` | `width <= 1440px` | Large container cap |

---

## Common Properties (shared across most blocks)

Sourced from `models/_common-properties.json`. Most blocks include these via `"...": "../../models/_common-properties.json#/common-prop"`.

### Fields

| Name | Component | valueType | Label | Description | Default |
|---|---|---|---|---|---|
| `blockId` | text | string | ID | Unique identifier for this block (no spaces) | `""` |
| `classes_commonCustomClass` | text | string | Custom Class | Custom CSS class to apply to this block | — |
| `language` | select | string | Language | Language attribute for the block | `"none"` |
| `analytics_id` | text (readOnly) | string | Analytics Interaction ID | Analytics tracking ID | `""` |

### Language Options (from models/_language.json)

`none`, `bg`, `zh`, `zh-TW`, `cs`, `da`, `nl`, `en`, `fi`, `fr`, `de`, `el`, `he`, `hu`, `it`, `ja`, `ko`, `no`, `pl`, `pt`, `ru`, `sk`, `sl`, `es`, `sv`, `tr`, `uk`

---

## 1. Hero Container

**Block name:** `hero-container`
**Title:** Hero Container
**Source JSON:** `blocks/hero-container/_hero-container.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** Yes (hero-container-item)

### xwalk Template Fields (Block Level)

```json
{
  "name": "Hero Container",
  "model": "hero-container",
  "filter": "hero-container"
}
```

### xwalk Template Fields (Item Level)

```json
{
  "name": "Hero Container Item",
  "model": "hero-container-item",
  "image": "",
  "imageAlt": "",
  "videoUrl": "",
  "text": "",
  "bgColor": "",
  "ctaLabel": "",
  "ctaUrl": ""
}
```

### Model Fields (hero-container - block level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `classes` | multiselect | string | Style | `""` | `landing` (Landing full-bleed extra tall + bottom padding), `height-short` (Height: Short), `height-default` (Height: Default), `height-tall` (Height: Tall), `height-xx-tall` (Height: XX-Tall) | — |
| `classes_overlayHeight` | select | string | Overlay Content Height | `""` | `""` (Default content height), `overlay-height-short` (Short), `overlay-height-default` (Default Height), `overlay-height-tall` (Tall), `overlay-height-xx-tall` (XX-Tall) | — |

### Model Fields (hero-container-item - item level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `image` | custom-asset-namespace:custom-asset | string | Background Image | — | — | — |
| `imageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `imageAlt` | text | string | Image Alt Text | `""` | — | — |
| `videoUrl` | text | string | Background Video URL (.mp4) | `""` | — | — |
| `text` | richtext | string | Overlay Text (title, description, CTA) | `""` | — | — |
| `bgColor` | select | string | Background Color / Style | `""` | `""` (None - image only), `dark` (Dark gradient overlay), `navy` (Navy solid dark blue), `purple` (Purple) | — |
| `ctaLabel` | text | string | Anchor Link Label | `""` | — | — |
| `ctaUrl` | aem-content | string | Anchor Link URL | `""` | — | — |

### CSS Classes (variant classes from multiselect)

- `landing` - Landing page variant (full-bleed, extra tall + bottom padding)
- `height-short` - Short hero height
- `height-default` - Default hero height
- `height-tall` - Tall hero height
- `height-xx-tall` - Extra extra tall hero height
- `overlay-height-short` - Short overlay content min-height
- `overlay-height-default` - Default overlay content min-height
- `overlay-height-tall` - Tall overlay content min-height
- `overlay-height-xx-tall` - XX-Tall overlay content min-height

### Responsive CSS

- **Tablet (744px+):** Hero section uses responsive grid layout
- **Desktop (1024px+):** Full 12-column grid, container max-width 133rem, overlay card overlaps hero
- **Desktop + Container MD:** Additional constraints at container medium breakpoint

### Row Mapping (plain.html block table — per item)

⚠️ CRITICAL: Each TABLE ROW = one hero item (for sessionStorage rotation).
Each row has 6 CELLS (columns), NOT 6 separate rows!

| Cell | Field | Content |
|---|---|---|
| 0 | image | `<picture>` element with background image |
| 1 | videoUrl | Video URL text (mp4 path) or empty |
| 2 | text | Rich HTML content (headings, paragraphs, CTAs) |
| 3 | bgColor | Color value: `dark`, `navy`, `purple`, or empty |
| 4 | ctaLabel | CTA button label text |
| 5 | ctaUrl | `<a>` element with CTA link URL |

**Import script pattern:**
```javascript
// CORRECT — 1 row with 6 cells = 1 hero item
makeBlock(document, 'Hero Container (height-default, overlay-height-short)', [
  [pictureElement, '', '', '', '', ''],
]);

// WRONG — 6 rows = 6 hero items (5 empty = rotation shows blank)
makeBlock(document, 'Hero Container (...)', [
  [pictureElement], [''], [''], [''], [''], [''],
]);
```

### Usage Notes

Use for full-width hero sections at the top of pages. Supports background images, background videos, text overlays with CTAs, and color treatments. Multiple items enable rotation (one shown per page load via sessionStorage). The hero can have an overlapping content card below it.

The hero-container JS collects ALL sibling blocks after itself in the same section and wraps them as `.hero-container-section-overlay` — the white card that overlaps the bottom of the hero image.

---

## 2. Brightcove Video

**Block name:** `brightcove-video`
**Title:** Brightcove Video
**Source JSON:** `blocks/brightcove-video/_brightcove-video.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Brightcove Video",
  "model": "brightcove-video",
  "filter": "brightcove-video",
  "projectNumber": "",
  "overlayTitle": "",
  "overlayDescription": "",
  "playerType": "single",
  "accountId": "2157889325001",
  "playerId": "",
  "videoId": "",
  "playlistId": "",
  "defaultPlaylistVideoId": "",
  "posterType": "brightcove",
  "posterImage": "",
  "posterAlt": "",
  "colorOverlay": "none",
  "overlayButtonText": "Watch Video",
  "overlayButtonIconType": "icon-font",
  "overlayButtonFontIcon": "play",
  "overlayButtonImageIcon": "",
  "iconPosition": "left",
  "videoContentLayout": "none",
  "playlistType": "carousel",
  "enablePlaylistThumbnailMetadata": false,
  "captionTitle": "",
  "captionDescription": "",
  "enableAutoplay": false,
  "enableLoop": false,
  "enableCaptions": false,
  "enableVideoChapters": false,
  "enableRecommendedVideo": false,
  "enablePlayerControls": true,
  "enableSocialShare": false,
  "enableTranscript": false,
  "transcriptType": "brightcove",
  "showTranscriptLabel": "transcript",
  "hideTranscriptLabel": "transcript",
  "transcriptButtonIconType": "icon-font",
  "transcriptShowFontIcon": "play",
  "transcriptShowImageIcon": "",
  "transcriptHideFontIcon": "play",
  "transcriptHideImageIcon": "",
  "transcriptClickBehavior": "new-tab",
  "modalHiddenPanelId": "",
  "transcriptLink": "",
  "transcriptLinkIconPosition": "after",
  "playButtonAriaLabel": "",
  "videoCaption": "",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `projectNumber` | text | string | Project Number | `""` | — | — |
| `overlayTitle` | text | string | Overlay Title | `""` | — | — |
| `overlayDescription` | richtext | string | Overlay Description | `""` | — | — |
| `posterType` | select | string | Poster Type | `"brightcove"` | `brightcove` (Brightcove), `color` (Color), `custom` (Custom) | — |
| `posterImage` | custom-asset-namespace:custom-asset | string | Poster Image | — | — | posterType === "custom" |
| `posterImageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `posterAlt` | text | string | Poster Alt Text | `""` | — | posterType === "custom" |
| `colorOverlay` | select | string | Color Overlay | `"none"` | `none` (None), `#071D49` (Navy solid dark blue) | posterType === "color" |
| `overlayButtonText` | text | string | Overlay Button Text | `"Watch Video"` | — | — |
| `overlayButtonIconType` | select | string | Overlay Button Icon Type | `"icon-font"` | `icon-font` (Icon Font), `image` (Image) | — |
| `overlayButtonFontIcon` | text | string | Overlay Button Font Icon | `"play"` | — | overlayButtonIconType === "icon-font" |
| `overlayButtonImageIcon` | reference | string | Overlay Button Image Icon | — | — | overlayButtonIconType === "image" |
| `iconPosition` | select | string | Icon Position | `"left"` | `left` (Left), `right` (Right) | — |
| `playerType` | select | string | Player Type | `"single"` | `single` (Single), `playlist` (Playlist), `3d-video` (3D Video) | — |
| `accountId` | select | string | Brightcove Account ID | `"2157889325001"` | `2157889325001` (Corporate), `public` (Public), `commercial` (Commercial) | — |
| `playerId` | text | string | Brightcove Player ID | `""` | — | accountId in ["2157889325001", "public"] |
| `videoId` | text | string | Brightcove Video ID | `""` | — | playerType in ["single", "3d-video"] |
| `playlistId` | text | string | Brightcove Playlist ID | `""` | — | playerType === "playlist" |
| `defaultPlaylistVideoId` | text | string | Default Playlist Video ID | `""` | — | playerType === "playlist" |
| `playlistType` | select | string | Playlist Type | `"carousel"` | `carousel` (Carousel), `cards` (Cards) | playerType === "playlist" |
| `videoContentLayout` | select | string | Video Content Layout | `"none"` | `none` (None), `bottom` (Bottom), `left` (Left), `right` (Right) | — |
| `enablePlaylistThumbnailMetadata` | boolean | boolean | Enable Playlist Thumbnail Metadata | `false` | — | playerType === "playlist" |
| `captionTitle` | text | string | Caption Text | `""` | — | — |
| `captionDescription` | text | string | Caption Description | `""` | — | — |
| `playButtonAriaLabel` | text | string | Play Button ARIA Label | `""` | — | — |
| `videoCaption` | text | string | Video Caption | `""` | — | — |
| `enableAutoplay` | boolean | boolean | Enable Autoplay | `false` | — | — |
| `enableLoop` | boolean | boolean | Enable Loop | `false` | — | — |
| `enableCaptions` | boolean | boolean | Enable Captions | `false` | — | — |
| `enableVideoChapters` | boolean | boolean | Enable Video Chapters | `false` | — | — |
| `enableRecommendedVideo` | boolean | boolean | Enable Recommended Video | `false` | — | — |
| `enablePlayerControls` | boolean | boolean | Enable Player Controls | `true` | — | — |
| `enableSocialShare` | boolean | boolean | Enable Social Share | `false` | — | — |
| `enableTranscript` | boolean | boolean | Enable Transcript | `false` | — | — |
| `transcriptType` | select | string | Transcript Type | `"brightcove"` | `brightcove` (Brightcove), `custom` (Custom) | enableTranscript === true |
| `showTranscriptLabel` | text | string | Show Transcript Link Label | `"transcript"` | — | enableTranscript === true |
| `hideTranscriptLabel` | text | string | Hide Transcript Link Label | `"transcript"` | — | enableTranscript === true AND transcriptType === "brightcove" |
| `transcriptClickBehavior` | select | string | Transcript Click Behavior | `"new-tab"` | `new-tab` (New Tab), `modal` (Modal), `hidden-panel` (Hidden Panel) | enableTranscript === true AND transcriptType === "custom" |
| `modalHiddenPanelId` | text | string | Modal/Hidden Panel ID | `""` | — | enableTranscript === true AND transcriptType === "custom" |
| `transcriptLink` | aem-content | string | Transcript Link | — | — | enableTranscript === true AND transcriptType === "custom" |
| `transcriptButtonIconType` | select | string | Transcript Button Icon Type | `"icon-font"` | `icon-font` (Icon Font), `image` (Image) | enableTranscript === true |
| `transcriptShowFontIcon` | text | string | Transcript Show Font Icon | `"play"` | — | enableTranscript === true AND transcriptButtonIconType === "icon-font" |
| `transcriptShowImageIcon` | reference | string | Transcript Show Image Icon | — | — | enableTranscript === true AND transcriptButtonIconType === "image" |
| `transcriptHideFontIcon` | text | string | Transcript Hide Font Icon | `"play"` | — | enableTranscript === true AND transcriptButtonIconType === "icon-font" AND transcriptType === "brightcove" |
| `transcriptHideImageIcon` | reference | string | Transcript Hide Image Icon | — | — | enableTranscript === true AND transcriptButtonIconType === "image" AND transcriptType === "brightcove" |
| `transcriptLinkIconPosition` | select | string | Transcript Link Icon Position | `"after"` | `before` (Before), `after` (After) | enableTranscript === true |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from video-picklist-config) | — |

### CSS Classes

Dynamic classes loaded from `video-picklist-config` AEM node. Specific options determined at runtime from the AEM configuration.

### Responsive CSS

- **Desktop (1024px+):** Video player resizes, content layout adjusts (left/right layouts side-by-side)
- **Tablet (744px+):** Intermediate sizing for player and overlays
- **Wide (1440px+):** Maximum width constraints

### Row Mapping (plain.html block table)

The brightcove-video block uses a single-row key-value configuration approach. Each template field maps to a sequential row in the block table output.

### Usage Notes

Use for embedding Brightcove-hosted videos with full player controls, playlists, chapters, transcripts, social sharing, and autoplay. Supports single videos, playlists (carousel/card layouts), and 3D video. Has extensive overlay customization (title, description, button with icon).

---

## 3. CTA (Call to Action)

**Block name:** `cta`
**Title:** Cta
**Source JSON:** `blocks/cta/_cta.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Cta",
  "model": "cta",
  "link": "/link",
  "linkText": "Button",
  "linkAriaLabel": "",
  "ctaTarget": "_self",
  "iconVariation": "none",
  "iconFont": "",
  "iconImage": "",
  "ariaHidden": false,
  "iconPosition": "after",
  "classes_customDynamicClass": "default-cta",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `linkText` | text | — | Button Text | — | — | — |
| `link` | aem-content | — | Target | — | — | — |
| `aria-label` | text | string | ARIA Label | — | — | — |
| `ctaTarget` | select | string | Click Behavior | `"_self"` | `_self` (Same Tab), `_blank` (New Tab) | — |
| `iconVariation` | select | string | Icon Type | `"none"` | `none` (None), `icon-font` (Icon Font), `image` (Image) | — |
| `iconFont` | text | string | Button Font Icon | `""` | — | iconVariation === "icon-font" |
| `iconImage` | reference | string | Button Image Icon | — | — | iconVariation === "image" |
| `iconPosition` | select | string | Icon Position | `"after"` | `before` (Before), `after` (After) | iconVariation in ["icon-font", "image"] |
| `ariaHidden` | boolean | boolean | Prevent screen readers from announcing this CTA | `false` | — | — |
| `warnOnDeparturePopupFragmentPath` | aem-content | string | Warn on Departure Modal Path | — | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from cta-picklist-config) | — |

### CSS Classes

Dynamic classes loaded from `cta-picklist-config` AEM node. Known variants:
- `default-cta` - Bordered button (blue border, blue text, fills blue on hover)
- `external-cta` - Text link with external arrow icon
- `internal-cta` - Uppercase text link with arrow icon
- `back-cta` - Text link with back arrow
- `popup-close` - Hidden text, icon-only close button

### Responsive CSS

CTA is inline/flex and responsive by nature. No specific breakpoint overrides in its own CSS.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | content | `<p class="button-container"><a class="button" href="{link}">{linkText}</a></p>` |
| 1 | ariaLabel | Text or empty |
| 2 | ctaTarget | `_self` or `_blank` |
| 3 | iconVariation | `none`, `icon-font`, or `image` |
| 4 | iconFont | Icon name text or empty |
| 5 | iconImage | Image reference or empty |
| 6 | iconPosition | `before` or `after` |
| 7 | ariaHidden | `true` or `false` |
| 8 | warnOnDeparturePopupFragmentPath | AEM content path to departure modal or empty |

### Usage Notes

Use for standalone call-to-action buttons/links. Supports same-tab/new-tab navigation, icon fonts or image icons positioned before/after text, aria-hidden for decorative CTAs, and warn-on-departure modal for external links. Default template class is `default-cta`.

---

## 4. Custom Title

**Block name:** `custom-title`
**Title:** Custom Title
**Source JSON:** `blocks/custom-title/_custom-title.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Custom Title",
  "model": "custom-title",
  "filter": "custom-title",
  "title": "",
  "titleType": "h1",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `title` | text | string | Text | `""` | — | — |
| `titleType` | select | string | Semantic Heading | `"h1"` | `h1` (H1), `h2` (H2), `h3` (H3), `h4` (H4), `h5` (H5), `h6` (H6) | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from title-picklist-config) | — |

### CSS Classes

Dynamic classes loaded from `title-picklist-config` AEM node. Known variants:
- `align-left`, `align-center`, `align-right` - Text alignment
- `h1-size` through `h5-size` - Visual size decoupled from semantic level
- `book-weight` - Lighter font weight
- `medium-weight` - Bold/extrabold font weight
- `format-outdented` - First letter brand accent blue
- `format-raised` - First letter scaled up (drop-cap)
- `light-theme` - Navy text (default)
- `dark-theme` - White text
- `full-width`, `width-x-large`, `width-large`, `width-medium`, `width-small`, `width-x-small`, `width-xx-small`, `width-xxx-small` - Grid width

### Responsive CSS

Uses the shared 12-column grid system. Width classes apply at desktop breakpoint.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | heading | `<h{n}>{title}</h{n}>` where n = titleType value |

### Usage Notes

Use for standalone headings that need independent control over semantic level, visual size, alignment, width, and font weight. The heading element in row 0 determines both the text and semantic level.

---

## 5. Text Container

**Block name:** `text-container`
**Title:** Text Container
**Source JSON:** `blocks/text-container/_text-container.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** Yes (text-container-image, text-container-text)

### xwalk Template Fields (Block Level)

```json
{
  "name": "Text Container",
  "model": "text-container",
  "filter": "text-container",
  "language": "none",
  "blockId": ""
}
```

### xwalk Template Fields (Image Item)

```json
{
  "name": "Text Container Image",
  "model": "text-container-image"
}
```

### xwalk Template Fields (Text Item)

```json
{
  "name": "Text Container Text",
  "model": "text-container-text",
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur volutpat consequat dui, sit amet ..."
}
```

### Model Fields (text-container - block level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Text Block Styles | `""` | (dynamic from text-picklist-config) | — |

### Model Fields (text-container-image)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `image` | custom-asset-namespace:custom-asset | string | Image | — | — | — |
| `imageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `imageAlt` | text | string | Alt Text | `""` | — | — |

### Model Fields (text-container-text)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `text` | richtext | string | Text | `""` | — | — |

### CSS Classes

Dynamic classes loaded from `text-picklist-config` AEM node. Known variants:
- `align-left`, `align-center`, `align-right`, `align-justify` - Text alignment
- `text-ltr`, `text-rtl` - Text direction
- `light-font` - Lighter font weight
- `light-theme`, `dark-theme` - Color theme
- `single-column`, `two-columns` - Layout columns
- `h3-size` - Override h2 to h3 visual size
- `anchor-link` - Single uppercase bold link style
- `anchor-link--multiple` - Multiple inline links
- `spacing-bottom` - Extra bottom margin
- `content-center` - Centered in parent grid
- `full-width`, `width-x-large`, `width-large`, `width-medium`, `width-small`, `width-x-small`, `width-xx-small`, `width-xxx-small` - Grid width

### Responsive CSS

- **Tablet (744px+):** Two-column layout becomes side-by-side, width classes start applying
- **Desktop (1024px+):** Full 12-column grid positioning with width classes

### Row Mapping (plain.html block table)

Each row is a content item (text or image):

| Row | Field | Content |
|---|---|---|
| N | text | Rich HTML content (paragraphs, lists, links) |
| N | image | `<picture>` element with alt text |

Items alternate freely between text and image items.

### Usage Notes

Use for rich text body content sections with optional inline images. Supports multi-column layouts, text alignment, direction, and the full width grid system. Each row can be either text content or an image.

---

## 6. Custom Image

**Block name:** `custom-image`
**Title:** Custom Image
**Source JSON:** `blocks/custom-image/_custom-image.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Custom Image",
  "model": "custom-image",
  "imageAlt": "",
  "getAltFromDAM": false,
  "imageIsDecorative": false,
  "caption": "",
  "getCaptionFromDAM": false,
  "displayCaptionBelowImage": false,
  "enableLink": false,
  "target": "",
  "clickBehavior": "_self",
  "modalPanelId": "",
  "enableWarnOnLeave": false,
  "warnOnLeavePath": "",
  "linkAriaLabel": "",
  "analyticsInteractionId": "",
  "blockId": "",
  "classes_commonCustomClass": "",
  "language": "none"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `image` | custom-asset-namespace:custom-asset | string | Image | — | — | — |
| `imageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `imageAlt` | text | string | Alternative Text | `""` | — | — (required) |
| `getAltFromDAM` | boolean | boolean | Get alternative text from DAM | `false` | — | — |
| `imageIsDecorative` | boolean | boolean | Image is decorative | `false` | — | — |
| `caption` | text | string | Caption | `""` | — | — |
| `getCaptionFromDAM` | boolean | boolean | Get caption from DAM | `false` | — | — |
| `displayCaptionBelowImage` | boolean | boolean | Enable caption as text under image | `false` | — | — |
| `enableLink` | boolean | boolean | Enable Link | `false` | — | — |
| `target` | aem-content | string | Target | `""` | — | enableLink === true |
| `clickBehavior` | select | string | Click Behavior | `"_self"` | `_self` (Same Tab), `_blank` (New Tab), `modal` (Modal), `hidden-panel` (Hidden Panel) | enableLink === true |
| `modalPanelId` | text | string | Modal/Hidden Panel ID | `""` | — | enableLink === true AND (clickBehavior === "modal" OR clickBehavior === "hidden-panel") |
| `enableWarnOnLeave` | boolean | boolean | Enable Warn on Leave Modal | `false` | — | enableLink === true |
| `warnOnLeavePath` | aem-content | string | Warn on leave modal path | `""` | — | enableLink === true AND enableWarnOnLeave === true |
| `linkAriaLabel` | text | string | Link Aria Label | `""` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from image-picklist-config) | — |

### CSS Classes

Dynamic classes loaded from `image-picklist-config` AEM node. Known variants:
- `cmp-image--rounded` - Circular crop (border-radius: 50%, aspect-ratio: 1/1)
- `cmp-image--abbvie-logo` - Constrained to logo dimensions (1.6rem height)
- `add-margins` - Responsive left/right margins

### Responsive CSS

- **Tablet (744px+):** Margin adjustments for `add-margins` class
- **Desktop (1024px+):** Further margin refinement
- **Wide (1440px+):** Maximum width constraints

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | image | `<picture>` element with image |
| 1 | getAltFromDAM | `true` or `false` |
| 2 | imageIsDecorative | `true` or `false` |
| 3 | caption | Caption text |
| 4 | getCaptionFromDAM | `true` or `false` |
| 5 | displayCaptionBelowImage | `true` or `false` |
| 6 | enableLink | `true` or `false` |
| 7 | target | Link URL/path or empty |
| 8 | clickBehavior | `_self`, `_blank`, `modal`, or `hidden-panel` |
| 9 | modalPanelId | ID string or empty |
| 10 | enableWarnOnLeave | `true` or `false` |
| 11 | warnOnLeavePath | AEM path or empty |
| 12 | linkAriaLabel | Accessible label text or empty |

### Usage Notes

Use for standalone images with optional captioning, linking, click behaviors (same tab, new tab, modal, hidden panel), warn-on-leave modals, and accessibility labeling. Supports decorative image marking and DAM metadata inheritance.

---

## 7. Carousel

**Block name:** `carousel`
**Title:** Carousel
**Source JSON:** `blocks/carousel/_carousel.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No (uses sibling blocks or inline rows as slides)

### xwalk Template Fields

```json
{
  "name": "Carousel",
  "model": "carousel",
  "filter": "carousel"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `totalSlides` | number | number | Total Number of Slides/Items | — | min: 0 | — |
| `carouselType` | select | string | Carousel Type | `"static"` | `static` (static), `dynamic` (dynamic) | — |
| `rssFeedUrl` | text | string | RSS Feed URL | `""` | — | carouselType === "dynamic" |
| `numberOfItems` | number | number | Number of Items | — | — | carouselType === "dynamic" |
| `autoplay` | boolean | boolean | Automatically transition slides (Autoplay) | `false` | — | — |
| `slideTransitionTime` | number | number | Slide transition time (ms) | `3000` | — | autoplay === true |
| `pauseOnHover` | boolean | boolean | Enable pause on hover | `false` | — | autoplay === true |
| `numberOfSlidesToShow` | number | number | Number of Slides to show | `1` | min: 1, max: 3 | — |
| `bypassCarouselOnMobile` | boolean | boolean | Bypass Carousel on Mobile | `false` | — | — |
| `startingSlideIndex` | number | number | Starting slide (index) | `1` | — | — |
| `centerActiveSlide` | boolean | boolean | Center the active slide | `false` | — | — |
| `enableLooping` | boolean | boolean | Enable Looping | `false` | — | — |
| `enableNextPreviousControls` | boolean | boolean | Enable Next/Previous controls | `true` | — | — |
| `enableDotNavigation` | boolean | boolean | Enable Dot Navigation | `true` | — | — |
| `carouselLabel` | text | string | Label (aria-label for carousel) | `""` | — | — |
| `previousButtonLabel` | text | string | Previous (aria-label for previous button) | `""` | — | — |
| `nextButtonLabel` | text | string | Next (aria-label for next button) | `""` | — | — |
| `playButtonLabel` | text | string | Play (aria-label for Play button) | `""` | — | — |
| `pauseButtonLabel` | text | string | Pause (aria-label for Pause button) | `""` | — | — |
| `tablistLabel` | text | string | Tablist (aria-label for navigation list) | `""` | — | — |
| `itemLabel` | boolean | boolean | Set item (aria-label from slide title) | `false` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from carousel-picklist-config) | — |

### CSS Classes

Dynamic classes loaded from `carousel-picklist-config` AEM node. Known variants:
- `carousel-default` - Peek carousel (center slide 96% width, partial sides visible, looping)
- `carousel-minimal` - Full-width slides, minimal chrome
- `carousel-vertical` - Vertical scroll with next-title button
- `dark` - Dark theme
- `carousel-show-btn-margin` - Bottom margin for button clearance
- `carousel-hide-btn-margin` - No bottom margin
- `no-bottom-margin` - Removes all bottom margin

### Responsive CSS

Carousel uses inline responsive design. `bypassCarouselOnMobile` renders items as stacked list on small screens.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | totalSlides | Number (0 for inline rows) |
| 1 | carouselType | `static` or `dynamic` |
| 2 | rssFeedUrl | URL or empty |
| 3 | numberOfItems | Number or empty |
| 4 | autoplay | `true` or `false` |
| 5 | slideTransitionTime | Number in ms |
| 6 | pauseOnHover | `true` or `false` |
| 7 | numberOfSlidesToShow | Number (1-3) |
| 8 | bypassCarouselOnMobile | `true` or `false` |
| 9 | startingSlideIndex | 1-based number |
| 10 | centerActiveSlide | `true` or `false` |
| 11 | enableLooping | `true` or `false` |
| 12 | enableNextPreviousControls | `true` or `false` |
| 13 | enableDotNavigation | `true` or `false` |
| 14 | carouselLabel | Aria-label text |
| 15 | previousButtonLabel | Aria-label text |
| 16 | nextButtonLabel | Aria-label text |
| 17 | playButtonLabel | Aria-label text |
| 18 | pauseButtonLabel | Aria-label text |
| 19 | tablistLabel | Aria-label text |
| 20 | itemLabel | `true` or `false` |
| 21 | (variant class) | CSS class or empty |
| 22+ | Slide rows | Each row: col0 = image, col1 = content |

### Usage Notes

Use for rotating content panels (image + text). Supports static slides (authored inline or from sibling blocks) and dynamic slides (from RSS feed). Extensive ARIA labeling support for accessibility. Can be bypassed on mobile for better usability.

---

## 8. Accordion

**Block name:** `accordion`
**Title:** Accordion
**Source JSON:** `blocks/accordion/_accordion.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** Yes (accordion-item)

### xwalk Template Fields (Block Level)

```json
{
  "name": "Accordion",
  "model": "accordion",
  "filter": "accordion",
  "language": "none",
  "blockId": ""
}
```

### xwalk Template Fields (Item Level)

```json
{
  "name": "Accordion Item",
  "model": "accordion-item",
  "summary": "Lorem Ipsum doloer sit",
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur volutpat consequat dui, sit amet ..."
}
```

### Model Fields (accordion - block level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `blockHeading` | text | string | Block Heading | `""` | — | — |
| `classes_allowMultipleOpen` | boolean | boolean | Allow multiple Accordion Items open | `false` | — | — |
| `classes_showExpandCollapseAll` | boolean | boolean | Show Expand/Collapse all button | `false` | — | — |
| `expandAllLabel` | text | string | Expand All text | `"Expand All"` | — | classes_showExpandCollapseAll === true |
| `collapseAllLabel` | text | string | Collapse All text | `"Collapse All"` | — | classes_showExpandCollapseAll === true |
| `classes_iconType` | select | string | Icon Type | `"accordion-icon-font"` | `accordion-icon-font` (Icon Font), `accordion-icon-image` (Image) | — |
| `expandAllIcon` | text | string | Expand All Font Icon | `"plus"` | — | classes_showExpandCollapseAll === true AND classes_iconType === "accordion-icon-font" |
| `collapseAllIcon` | text | string | Collapse All Font Icon | `"minus"` | — | classes_showExpandCollapseAll === true AND classes_iconType === "accordion-icon-font" |
| `expandIcon` | text | string | Expand Font Icon | `"plus"` | — | classes_iconType === "accordion-icon-font" |
| `collapseIcon` | text | string | Collapse Font Icon | `"minus"` | — | classes_iconType === "accordion-icon-font" |
| `expandAllIconImage` | reference | string | Expand All Image Icon | — | — | classes_showExpandCollapseAll === true AND classes_iconType === "accordion-icon-image" |
| `collapseAllIconImage` | reference | string | Collapse All Image Icon | — | — | classes_showExpandCollapseAll === true AND classes_iconType === "accordion-icon-image" |
| `expandIconImage` | reference | string | Expand Image Icon | — | — | classes_iconType === "accordion-icon-image" |
| `collapseIconImage` | reference | string | Collapse Image Icon | — | — | classes_iconType === "accordion-icon-image" |
| `ariaExpandAllLabel` | text | string | Aria Expand All Label | `""` | — | — |
| `ariaCollapseAllLabel` | text | string | Aria Collapse All Label | `""` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from accordion-picklist-config) | — |

### Model Fields (accordion-item)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `summary` | text | string | Item Heading Text | `""` | — | — |
| `text` | richtext | string | Item Description Text | `""` | — | — |
| `classes_defaultOpen` | boolean | boolean | Default To Open | `false` | — | — |
| `ariaExpandLabel` | text | string | Aria Expand Label | `""` | — | — |
| `ariaCollapseLabel` | text | string | Aria Collapse Label | `""` | — | — |

### CSS Classes

Dynamic classes from `accordion-picklist-config` AEM node. Known variants:
- `showexpandcollapseall` - Shows expand/collapse all button (from classes_showExpandCollapseAll)
- `allowmultipleopen` - Multiple items open simultaneously (from classes_allowMultipleOpen)
- `accordion-icon-font` - Icon font indicators (from classes_iconType)
- `accordion-icon-image` - Image indicators (from classes_iconType)
- `dark-theme`, `light-theme` - Color theme
- `margin-0`, `margin-bottom-0` - Spacing overrides
- `h2-size` through `h6-size` - Heading size overrides
- `full-width`, `width-x-large`, `width-large`, `width-medium`, `width-small`, `width-x-small`, `width-xx-small`, `width-xxx-small` - Grid width
- `align-left`, `align-center`, `align-right` - Alignment

### Responsive CSS

Uses shared 12-column grid system for width classes.

### Row Mapping (plain.html block table)

**Configuration rows (first 13):**

| Row | Field | Content |
|---|---|---|
| 0 | blockHeading | Heading text or empty |
| 1 | expandAllLabel | "Expand All" or custom text |
| 2 | collapseAllLabel | "Collapse All" or custom text |
| 3 | expandAllIcon | Icon font name (e.g., "plus") |
| 4 | collapseAllIcon | Icon font name (e.g., "minus") |
| 5 | expandIcon | Icon font name (e.g., "plus") |
| 6 | collapseIcon | Icon font name (e.g., "minus") |
| 7 | expandAllIconImage | Image reference or empty |
| 8 | collapseAllIconImage | Image reference or empty |
| 9 | expandIconImage | Image reference or empty |
| 10 | collapseIconImage | Image reference or empty |
| 11 | ariaExpandAllLabel | Aria text or empty |
| 12 | ariaCollapseAllLabel | Aria text or empty |

**Item rows (after config, each row is one accordion item with multiple columns):**

| Column | Field | Content |
|---|---|---|
| 0 | summary | Heading/label (in `<h3>` or similar) |
| 1 | text | Rich HTML body content |
| 2 | classes | Item classes (e.g., "accordion-item defaultopen") |
| 3 | ariaExpandLabel | Aria text for expand |
| 4 | ariaCollapseLabel | Aria text for collapse |

### Usage Notes

Use for expandable/collapsible content sections (FAQ, details). Supports single-open or multi-open mode, expand/collapse all button, icon fonts or image icons, heading text above the accordion, and per-item default-open state.

---

## 9. Separator

**Block name:** `separator`
**Title:** Separator
**Source JSON:** `blocks/separator/_separator.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Separator",
  "model": "separator",
  "filter": "separator"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `showLine` | boolean | boolean | Show Line | `false` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Separator Block Styles | `""` | (dynamic from separator-picklist-config) | — |

### CSS Classes

Dynamic classes from `separator-picklist-config` AEM node. Known variants:
- `separator-height-1` through `separator-height-144` - Height/spacing values (1, 8, 16, 24, 32, 48, 64, 80, 96, 112, 128, 144)
- `separator-standard` - No visible border (spacer only)
- `separator-divider` - Visible hairline border-bottom
- `light-theme` - Gray line color
- `dark-theme` - White line color
- `add-margin-separator` - Responsive left/right margins

### Responsive CSS

Minimal responsive behavior. Separator is a block-level spacer/divider.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | showLine | `true` or `false` |

### Usage Notes

Use for vertical spacing between content sections or as a visible horizontal rule/divider. Height classes control the amount of spacing. The `showLine` field determines whether a visible `<hr>` line is rendered.

---

## 10. Story Card

**Block name:** `story-card`
**Title:** Story Card
**Source JSON:** `blocks/story-card/_story-card.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Story Card",
  "model": "story-card",
  "storyCardVariant": "cardInfo",
  "hidePublicationDate": false,
  "hideReadTime": false,
  "hideRole": false,
  "hideDescription": false,
  "hideImage": false,
  "page": "",
  "openInNewTab": false,
  "analyticsInteractionId": "",
  "language": "lang:none",
  "blockId": "id:"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `storyCardVariant` | select | string | Story Card Type | `"cardInfo"` | `cardInfo` (Card Info), `storyCardInfo` (Story Card Info), `leaderInfo` (Leader Info), `sidePanel` (Side Panel), `relatedContent` (Related Content) | — |
| `hidePublicationDate` | boolean | boolean | Hide Publication Date | `false` | — | — |
| `hideReadTime` | boolean | boolean | Hide Read/Watch Time | `false` | — | — |
| `hideRole` | boolean | boolean | Hide Title | `false` | — | — |
| `hideDescription` | boolean | boolean | Hide Description | `false` | — | — |
| `hideImage` | boolean | boolean | Hide Image | `false` | — | — |
| `id` | text | string | Id | `""` | — | — |
| `customClass` | text | string | Custom Class | `""` | — | — |
| `page` | aem-content | string | Page | — | — | — (required) |
| `openInNewTab` | boolean | boolean | Open in New Tab | `false` | — | — |
| `ctaLabel` | text | string | CTA Text | `""` | — | — |
| `analyticsInteractionId` | text (readOnly) | string | Analytics Interaction ID | `""` | — | — |

### CSS Classes

No static multiselect classes. Variant is controlled by `storyCardVariant` field value.

### Responsive CSS

- **Mobile:** flex-direction: column-reverse (content below image)
- **Tablet:** Stacked or side-by-side depending on variant
- **Desktop:** Row layout with 50/50 content/image for most variants

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | storyCardVariant | `cardInfo`, `storyCardInfo`, `leaderInfo`, `sidePanel`, `relatedContent` |
| 1 | hidePublicationDate | `true` or `false` |
| 2 | hideReadTime | `true` or `false` |
| 3 | hideRole | `true` or `false` |
| 4 | hideDescription | `true` or `false` |
| 5 | hideImage | `true` or `false` |
| 6 | id | Block ID text or empty |
| 7 | customClass | CSS classes or empty |
| 8 | page | `<a href="/path-to-story">Link</a>` |
| 9 | openInNewTab | `true` or `false` |
| 10 | ctaLabel | CTA button text or empty |
| 11 | (unused) | empty |
| 12 | language | Language code or empty |

### Usage Notes

Use for linking to story/article pages with automatic metadata display (title, description, image, date, read time from the content index). Supports five layout variants for different contexts (grid cards, leader profiles, side panels, related content). The `page` field references the story page path and metadata is resolved from the site index.

---

## 11. Quote

**Block name:** `quote`
**Title:** Quote
**Source JSON:** `blocks/quote/_quote.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Quote",
  "model": "quote",
  "id": "",
  "customClass": "",
  "quoteVariant": "basic",
  "backgroundImageAlt": "",
  "classes_theme": "quote-none",
  "classes_contentAlignment": "quote-align-none",
  "classes_contentWidth": "quote-content-col-none",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `quoteVariant` | select | string | Quote Type | `"basic"` | `basic` (Basic), `content-fragment` (Content Fragment) | — (required) |
| `quotation` | richtext | string | Quote Text | `""` | — | quoteVariant in ["basic"] |
| `attributionName` | text | string | Attribution Name | `""` | — | quoteVariant in ["basic"] |
| `attributionRole` | text | string | Attribution Title | `""` | — | quoteVariant in ["basic"] |
| `attributionImage` | custom-asset-namespace:custom-asset | string | Attribution Image | — | — | quoteVariant in ["basic"] |
| `attributionImageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `quoteFragment` | aem-content | string | Quote Fragment | — | — | quoteVariant in ["content-fragment"] |
| `backgroundImage` | custom-asset-namespace:custom-asset | string | Background Image | — | — | — |
| `backgroundImageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `backgroundImagePreset` | select | string | Background Image Preset | `""` | `""` (None), `Feature` (Feature), `Hero` (Hero), `Responsive` (Responsive), `Square` (Square), `Tall` (Tall), `VideoThumbnail` (VideoThumbnail) | — |
| `backgroundImageModifiers` | text | string | Background Image Modifiers | — | — | — |
| `backgroundImageAlt` | text | string | Background Image Alt Text | `""` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from quote-picklist-config) | — |

### CSS Classes

Dynamic classes from `quote-picklist-config` AEM node. Template default classes:
- `classes_theme`: `quote-none` (default)
- `classes_contentAlignment`: `quote-align-none` (default)
- `classes_contentWidth`: `quote-content-col-none` (default)

### Responsive CSS

Uses shared grid system. Quote adapts between stacked and side-by-side layouts at breakpoints.

### Row Mapping (plain.html block table)

For "basic" variant, the rows map to quote content fields. For "content-fragment" variant, a fragment reference is used.

### Usage Notes

Use for displaying quotations with attribution (name, title, image) and optional background images. Supports basic authored quotes or Content Fragment-sourced quotes. Background images support preset renditions (Feature, Hero, Responsive, Square, Tall, VideoThumbnail).

---

## 12. Video (Native)

**Block name:** `video`
**Title:** Video
**Source JSON:** `blocks/video/_video.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Video",
  "model": "video",
  "filter": "video",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `uri` | aem-content | string | Video | — | — | — |
| `placeholderImage` | custom-asset-namespace:custom-asset | string | Poster Image | — | — | — |
| `placeholderImageMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `placeholderAlt` | text | string | Poster Alt Text | `""` | — | — |
| `overlayTitle` | text | string | Overlay Title | `""` | — | — |
| `overlayDescription` | text | string | Overlay Description | `""` | — | — |
| `overlayBtnText` | text | — | Overlay Button Text | — | — | — |
| `videoContentLayout` | select | string | Content Position | `"none"` | `none` (None - overlay), `bottom` (Bottom), `left` (Left), `right` (Right) | — |
| `classes_overlayColor` | select | string | Color Overlay | `"video-overlay-navy"` | `video-overlay-navy` (Navy Overlay), `video-overlay-gray` (Gray Overlay), `video-overlay-purple` (Purple Overlay) | — |
| `classes_overlayBtnStyle` | select | string | Overlay Button Style | `"video-btn-outline"` | `video-btn-outline` (Outline), `video-btn-solid` (Solid), `video-btn-ghost` (Ghost) | — |
| `overlayButtonIconType` | select | string | Overlay Button Icon Type | `"icon-font"` | `icon-font` (Icon Font), `image` (Image) | — |
| `overlayButtonFontIcon` | text | string | Overlay Button Font Icon | `"play"` | — | overlayButtonIconType === "icon-font" |
| `projectNumber` | text | string | Project Number | `""` | — | — |
| `enableAutoplay` | boolean | boolean | Enable Autoplay | `false` | — | — |
| `enableCaptions` | boolean | boolean | Enable Captions | `false` | — | — |
| `enablePlayerControls` | boolean | boolean | Enable Player Controls | `true` | — | — |
| `enableFullscreen` | boolean | boolean | Allow Fullscreen | `true` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from video-picklist-config) | — |

### CSS Classes

Dynamic classes from `video-picklist-config` AEM node. Built-in class options:
- `video-overlay-navy` - Navy color overlay (from classes_overlayColor)
- `video-overlay-gray` - Gray color overlay
- `video-overlay-purple` - Purple color overlay
- `video-btn-outline` - Outline button style (from classes_overlayBtnStyle)
- `video-btn-solid` - Solid button style
- `video-btn-ghost` - Ghost button style

### Responsive CSS

- **Tablet (744px+):** Video player responsive sizing, overlay adjustments
- **Desktop (1024px+):** Left/right content layouts become side-by-side
- **Wide (1440px+):** Maximum width constraints

### Row Mapping (plain.html block table)

The video block uses field-per-row mapping for its configuration properties.

### Usage Notes

Use for native/self-hosted video playback with poster images, overlay content (title, description, button), color overlays, and player controls. Simpler than Brightcove Video — use when you do not need Brightcove-specific features (playlists, chapters, transcripts, social share). Supports content position layouts (bottom, left, right of video).

---

## 13. Eyebrow Text

**Block name:** `eyebrow-text`
**Title:** Eyebrow Text
**Source JSON:** `blocks/eyebrow-text/_eyebrow-text.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Eyebrow Text",
  "model": "eyebrow-text",
  "filter": "eyebrow-text",
  "text": "Eyebrow label"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `text` | richtext | string | Text | `""` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Text Block Styles | `""` | (dynamic from eyebrow-text-picklist-config) | — |

### CSS Classes

Dynamic classes from `eyebrow-text-picklist-config` AEM node.

### Responsive CSS

- **Tablet (744px+):** Font size and spacing adjustments
- **Desktop (1024px+):** Full desktop styling

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | text | Rich HTML content (typically a short label/tag line) |

### Usage Notes

Use for small label/category text that appears above a heading or content section (e.g., "Our Purpose", "Latest News"). Default template text is "Eyebrow label". Supports rich text formatting.

---

## 14. Columns

**Block name:** `columns`
**Title:** Columns
**Source JSON:** `blocks/columns/_columns.json`
**Resource Type:** `core/franklin/components/columns/v1/columns`
**Has Child Items:** Yes (column items containing text, image, button, title)

### xwalk Template Fields

```json
{
  "columns": "2",
  "rows": "1"
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `columns` | text | number | Columns | `""` | — | — |
| `rows` | text | number | Rows | `""` | — | — |
| `classes_marginBottom` | select | string | Bottom Spacing | `""` | `""` (Default), `mb-none` (None), `mb-tight` (Tight), `mb-compact` (Compact), `mb-spacious` (Spacious), `mb-wide` (Extra Wide), `custom-mb-col` (custom-mb-col) | — |
| `classes_order` | select | string | Content Order (Mobile) | `""` | `""` (Default), `order-content-first-mobile` (Content then Image) | — |
| `classes_text` | select | string | Text Styles | `""` | `""` (None), `square-list` (List Style Type Square), `bullet-list` (List Style Type bullet) | — |

### CSS Classes (from select fields)

- `mb-none` - No bottom margin
- `mb-tight` - Tight bottom margin
- `mb-compact` - Compact bottom margin
- `mb-spacious` - Spacious bottom margin
- `mb-wide` - Extra wide bottom margin
- `custom-mb-col` - Custom bottom margin
- `order-content-first-mobile` - Content before image on mobile
- `square-list` - Square list style type
- `bullet-list` - Bullet list style type

### Filters

The columns block accepts:
- `column` items, which in turn accept: `text`, `image`, `button`, `title` components

### Responsive CSS

Columns stack on mobile and flow side-by-side on tablet/desktop breakpoints.

### Row Mapping (plain.html block table)

Columns uses the standard EDS columns resource type. Each row represents a table row, and each cell within represents a column. Content within cells can include text, images, buttons, and titles.

### Usage Notes

Use for multi-column layouts (default 2 columns, 1 row). Supports responsive stacking, mobile content reordering, bottom spacing control, and list style overrides. This is the standard EDS columns component (not a custom block).

---

## 15. LinkList

**Block name:** `linklist`
**Title:** LinkList
**Source JSON:** `blocks/linklist/_linklist.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** Yes (linklist-item)

### xwalk Template Fields (Block Level)

```json
{
  "name": "LinkList",
  "model": "linklist",
  "filter": "linklist",
  "linkSource": "custom",
  "variant": "standard",
  "layout": "single-column",
  "orderBy": "content-tree",
  "sortOrder": "asc",
  "childDepth": 1,
  "maxItems": 25
}
```

### xwalk Template Fields (Item Level)

```json
{
  "name": "LinkList Item",
  "model": "linklist-item",
  "classes": "linklist-item",
  "linkText": "",
  "iconType": "none",
  "openInNewTab": false,
  "cookieConsentLink": false,
  "enableConfirmationModal": false,
  "confirmationModalType": "standard",
  "iconPosition": "before"
}
```

### Model Fields (linklist - block level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `id` | text | string | Id | `""` | — | — |
| `customClass` | text | string | Custom Class | `""` | — | — |
| `variant` | select | string | Variant | `"standard"` | `standard` (Standard), `rows-with-arrows` (Rows with Arrows), `icons` (Icons), `footer-primary` (Footer - primary), `footer-legal` (Footer - legal), `detailed-list` (Detailed list), `carousel` (Carousel) | — |
| `linkSource` | select | string | Link Source | `"custom"` | `child-pages` (Child Pages), `icons` (Icons), `custom` (Custom) | — |
| `parentPage` | aem-content | string | Parent Page | `""` | — | linkSource === "child-pages" |
| `childDepth` | number | number | Child Depth | `1` | min: 1, max: 10 | linkSource === "child-pages" |
| `excludeCurrentPage` | boolean | boolean | Exclude Current Page | `true` | — | linkSource === "child-pages" |
| `enableDescription` | boolean | boolean | Enable Description | `false` | — | linkSource === "child-pages" AND variant !== "detailed-list" |
| `enableTags` | boolean | boolean | Enable Tags | `false` | — | linkSource === "child-pages" |
| `enableSubtitle` | boolean | boolean | Enable Subtitle | `false` | — | linkSource === "child-pages" AND variant !== "detailed-list" |
| `enableDate` | boolean | boolean | Enable Date | `false` | — | linkSource === "child-pages" |
| `orderBy` | select | string | Order By | `"content-tree"` | `content-tree` (Content Tree), `title` (Title), `last-modified` (Last Modified), `published` (Published) | linkSource === "child-pages" |
| `sortOrder` | select | string | Sort Order | `"asc"` | `asc` (Ascending), `desc` (Descending) | linkSource === "child-pages" |
| `maxItems` | number | number | Max Items | `25` | min: 1, max: 500 | linkSource === "child-pages" |
| `layout` | select | string | Layout | `"single-column"` | `single-column` (Single Column), `two-columns-stack` (Two Columns - stack on mobile), `two-columns-nostack` (Two columns - do not stack on mobile) | linkSource === "child-pages" |
| `fontIcon` | text | string | Icon | `""` | — | variant === "icons" OR linkSource === "child-pages" |
| `ariaLabel` | text | string | ARIA Label | `""` | — | — |

### Model Fields (linklist-item)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `id` | text | string | Id | `""` | — | — |
| `customClass` | text | string | Custom Class | `""` | — | — |
| `cookieConsentLink` | boolean | boolean | Cookie Consent Link | `false` | — | — |
| `link` | aem-content | string | Link | `""` | — | cookieConsentLink === false |
| `openInNewTab` | boolean | boolean | Open in a new tab | `false` | — | cookieConsentLink === false |
| `linkText` | text | string | Link Text | `""` | — | — |
| `subtitle` | text | string | Subtitle | `""` | — | — |
| `description` | richtext | string | Description | `""` | — | — |
| `categoryTags` | aem-tag | string[] | Category Tags | `[]` | namespace: "corporate" | — |
| `iconType` | select | string | Icon Type | `"none"` | `none` (None), `font` (Icon Font), `image` (Image) | — |
| `fontIcon` | text | string | Font Icon | `""` | — | iconType === "font" |
| `imageIcon` | custom-asset-namespace:custom-asset | string | Image Icon | `""` | — | iconType === "image" |
| `imageIconMimeType` | custom-asset-namespace:custom-asset-mimetype | string | — | — | — | — |
| `iconPosition` | select | string | Icon Position | `"before"` | `before` (Before), `after` (After) | iconType in ["font", "image"] |
| `iconLink` | aem-content | string | Icon Link | `""` | — | iconType in ["font", "image"] |
| `enableConfirmationModal` | boolean | boolean | Enable Confirmation Modal | `false` | — | — |
| `confirmationModalType` | select | string | Type of confirmation modal | `"standard"` | `standard` (Standard), `exit-modal` (Exit modal) | enableConfirmationModal === true |
| `modalId` | text | string | Modal ID / Path | `""` | — | enableConfirmationModal === true |
| `ariaLabel` | text | string | Aria Label | `""` | — | — |

### CSS Classes

No static multiselect. Variant controlled by `variant` field. Layout controlled by `layout` field.

### Responsive CSS

- Single-column layout is always single column
- Two-columns-stack stacks on mobile, side-by-side on tablet+
- Two-columns-nostack maintains two columns even on mobile

### Row Mapping (plain.html block table)

Block-level configuration rows followed by item rows (one per link).

### Usage Notes

Use for navigation link lists, footer links, sidebar navigation, and content listings. Supports three link sources: Custom (authored items), Child Pages (auto-generated from site index), and Icons. Seven visual variants available for different contexts. Item-level features include icons, subtitles, descriptions, tags, cookie consent links, and confirmation modals.

---

## 16. Teaser

**Block name:** `teaser`
**Title:** Teaser
**Source JSON:** `blocks/teaser/_teaser.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Teaser",
  "model": "teaser",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `eyebrow` | richtext | string | Eyebrow | `""` | — | — |
| `title` | richtext | string | Title | `""` | — | — |
| `description` | richtext | string | Description | `""` | — | — |
| `buttonText` | text | string | Button Text | `""` | — | — |
| `buttonURL` | aem-content | string | Button URL | `""` | — | — |
| `clickType` | select | string | Click Type | `"_self"` | `_self` (Same Tab), `_blank` (New Tab) | — |
| `ariaLabel` | text | string | Aria Label | `""` | — | — |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from teaser-picklist-config) | — |

### CSS Classes

Dynamic classes from `teaser-picklist-config` AEM node.

### Responsive CSS

Teaser adapts to container width. Responsive behavior depends on variant styling.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | eyebrow | Rich text (small label above title) |
| 1 | title | Rich text (main heading) |
| 2 | description | Rich text (body content) |
| 3 | buttonText | Button label text |
| 4 | buttonURL | `<a>` element with link URL |
| 5 | clickType | `_self` or `_blank` |
| 6 | ariaLabel | Accessible label text |

### Usage Notes

Use for promotional content blocks that combine eyebrow text, title, description, and a CTA button. Suitable for feature highlights, promotional cards, and content teasers. Supports rich text for eyebrow, title, and description fields.

---

## 17. Fact Card

**Block name:** `fact-card`
**Title:** Fact Card
**Source JSON:** `blocks/fact-card/_fact-card.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** No

### xwalk Template Fields

```json
{
  "name": "Fact Card",
  "model": "fact-card",
  "language": "none",
  "blockId": ""
}
```

### Model Fields

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `contentFragment` | aem-content | string | Content Fragment | — | — | — |
| `hideImage` | boolean | boolean | Hide Image | `false` | — | — |
| `imagePreset` | select | string | Image Preset | `""` | `""` (None), `Feature` (Feature), `Hero` (Hero), `Responsive` (Responsive), `Square` (Square), `Tall` (Tall), `VideoThumbnail` (VideoThumbnail) | hideImage === false |
| `imageModifiers` | text | string | Image Modifiers | `""` | — | hideImage === false |
| `classes_customDynamicClass` | ngaem:dynamic-picklist | string | Select Block Styles | `""` | (dynamic from fact-card-picklist-config) | — |

### CSS Classes

Dynamic classes from `fact-card-picklist-config` AEM node.

### Responsive CSS

Fact card is typically used within grid/carousel contexts and adapts to container width.

### Row Mapping (plain.html block table)

| Row | Field | Content |
|---|---|---|
| 0 | contentFragment | `<a>` element referencing the content fragment path |
| 1 | hideImage | `true` or `false` |
| 2 | imagePreset | Preset name or empty |
| 3 | imageModifiers | Modifier parameters or empty |

### Usage Notes

Use for data-driven statistic/fact display cards sourced from Content Fragments. The content fragment provides eyebrow, data point, suffix, description, and image. Supports image preset renditions (Feature, Hero, Responsive, Square, Tall, VideoThumbnail) and additional image transformation modifiers.

---

## 18. Cards

**Block name:** `cards`
**Title:** Cards
**Source JSON:** `blocks/cards/_cards.json`
**Resource Type:** `core/franklin/components/block/v1/block`
**Has Child Items:** Yes (card)

### xwalk Template Fields (Block Level)

```json
{
  "name": "Cards",
  "model": "cards",
  "filter": "cards"
}
```

### xwalk Template Fields (Item Level)

```json
{
  "name": "Card",
  "model": "card"
}
```

### Model Fields (cards - block level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `classes` | multiselect | string | Style | `""` | `story` (Story), `col-width-4` (Small Card - 4 Columns), `col-width-5` (Medium Card - 5 Columns), `col-width-6` (Large Card - 6 Columns), `col-width-7` (Extra Large Card - 7 Columns) | — |

### Model Fields (card - item level)

| Name | Component | valueType | Label | Default | Options | Conditions |
|---|---|---|---|---|---|---|
| `image` | reference | string | Image | — | — | — |
| `text` | richtext | string | Text | `""` | — | — |

### CSS Classes (from multiselect)

- `story` - Story card variant
- `col-width-4` - Small card (4-column grid width)
- `col-width-5` - Medium card (5-column grid width)
- `col-width-6` - Large card (6-column grid width)
- `col-width-7` - Extra large card (7-column grid width)

Note: Card Width Style options are grouped under a "Card Width Style" category in the multiselect.

### Responsive CSS

- **Tablet (744px+):** Cards begin flowing in multi-column grid
- **Desktop (1024px+):** Full grid layout with column width variants applied

### Row Mapping (plain.html block table)

Each row represents one card item:

| Column | Field | Content |
|---|---|---|
| 0 | image | `<picture>` element with card image |
| 1 | text | Rich HTML content (title, description, links) |

### Usage Notes

Use for grid layouts of content cards (image + text). Supports story variant for story-style cards and column width variants to control card size in the grid. Each card is a simple image + rich text combination. Filter allows only `card` items as children.

---

## Cross-Block Reference: Width System

All blocks that support width use the same 12-column grid system:

| Class | Tablet Cols | Desktop Cols | Notes |
|---|---|---|---|
| `full-width` | — | 12 | Full width |
| `width-x-large` | — | 10 (start 2) | Slight margins |
| `width-large` | — | 9 (start 2) | Centered via translateX |
| `width-medium` | 8 (start 1) | 8 (start 3) | — |
| `width-small` | 7 (start 1) | 7 (start 3) | — |
| `width-x-small` | 6 (start 2) | 6 (start 4) | — |
| `width-xx-small` | 5 (start 2) | 5 (start 4) | Centered via translateX |
| `width-xxx-small` | 4 (start 3) | 4 (start 5) | — |

Combined with alignment:
- `align-left`: shifts grid-column-start leftward (usually to 1)
- `align-right`: shifts grid-column-start rightward
- Default (no alignment): centered

---

## Cross-Block Reference: Theme System

| Class | Text Color | Background Context |
|---|---|---|
| `light-theme` | Navy/default (`--corp-color-text-default`) | Light/white background sections |
| `dark-theme` | White (`--color-white`) | Dark/navy background sections |

---

## Cross-Block Reference: Section Metadata Integration

Blocks are placed inside sections. Section backgrounds are controlled by `Section Metadata` block:

```html
<div class="section-metadata">
  <div><div>style</div><div>dark</div></div>
  <div><div>background</div><div><picture>...</picture></div></div>
</div>
```

Style values: `dark`, `navy`, `purple`, `highlight`, `accent` (map to CSS custom properties on section).

---

## Cross-Block Reference: Dynamic Picklist Classes

Many blocks use `ngaem:dynamic-picklist` components that load CSS classes from AEM configuration nodes at runtime. The `sourceAEMNodeName` field identifies the configuration node:

| Block | Picklist Config Node |
|---|---|
| hero-container | (uses static multiselect) |
| brightcove-video | `video-picklist-config` |
| cta | `cta-picklist-config` |
| custom-title | `title-picklist-config` |
| text-container | `text-picklist-config` |
| custom-image | `image-picklist-config` |
| carousel | `carousel-picklist-config` |
| accordion | `accordion-picklist-config` |
| separator | `separator-picklist-config` |
| quote | `quote-picklist-config` |
| video | `video-picklist-config` |
| eyebrow-text | `eyebrow-text-picklist-config` |
| teaser | `teaser-picklist-config` |
| fact-card | `fact-card-picklist-config` |
| cards | (uses static multiselect) |

---

## Cross-Block Reference: Common Field Patterns

### Image Fields

Blocks that accept images use this pattern:
```
image: custom-asset-namespace:custom-asset (the DAM reference)
imageMimeType: custom-asset-namespace:custom-asset-mimetype (auto-populated)
imageAlt: text (manual alt text)
```

### Link Fields

Blocks use `aem-content` component for internal AEM links and path resolution.

### Boolean Fields as CSS Classes

Fields prefixed with `classes_` contribute their value as CSS classes when true:
- `classes_allowMultipleOpen` → `allowmultipleopen` class
- `classes_showExpandCollapseAll` → `showexpandcollapseall` class
- `classes_defaultOpen` → `defaultopen` class
- `classes_overlayColor` → value becomes the class (e.g., `video-overlay-navy`)
- `classes_overlayBtnStyle` → value becomes the class (e.g., `video-btn-outline`)
- `classes_iconType` → value becomes the class (e.g., `accordion-icon-font`)
- `classes_marginBottom` → value becomes the class (e.g., `mb-tight`)
- `classes_order` → value becomes the class (e.g., `order-content-first-mobile`)
- `classes_text` → value becomes the class (e.g., `square-list`)
- `classes_theme` → value becomes the class (e.g., `quote-none`)
- `classes_contentAlignment` → value becomes the class
- `classes_contentWidth` → value becomes the class
- `classes_commonCustomClass` → value becomes arbitrary custom class
- `classes_customDynamicClass` → comma-separated dynamic classes from picklist

### Filter System

Blocks with child items use filters to restrict allowed children:

| Block | Allowed Children |
|---|---|
| hero-container | hero-container-item |
| text-container | text-container-image, text-container-text |
| accordion | accordion-item |
| cards | card |
| linklist | linklist-item |
| columns | column (which accepts text, image, button, title) |

---

## Import Script Quick Reference

When building parsers for the import script, use this checklist:

1. **Identify the block** from source DOM (cmp-* classes)
2. **Map fields** to the row positions documented above
3. **Apply variant classes** to the block table header cell
4. **Preserve accessibility** (aria-labels, alt text, roles)
5. **Extract analytics** data attributes
6. **Handle images** with proper `<picture>` elements
7. **Handle links** with proper `<a>` elements for aem-content fields
8. **Boolean values** output as text: `"true"` or `"false"`
9. **Empty fields** output as empty `<div>` elements
10. **Common properties** (blockId, language, analyticsId) go in trailing rows per block convention
