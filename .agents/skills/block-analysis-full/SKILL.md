# AbbVie EDS Block Analysis - Complete Reference

> Master reference for ALL blocks in the AbbVie NextGen EDS project.
> Use this when building import scripts to know which block to use, what rows it expects, and what CSS classes are available.

---

## Table of Contents

1. [breadcrumb](#breadcrumb)
2. [brightcove-podcast-player](#brightcove-podcast-player)
3. [brightcove-video](#brightcove-video)
4. [cards](#cards)
5. [columns](#columns)
6. [editorial-feed](#editorial-feed)
7. [embed](#embed)
8. [embed-form](#embed-form)
9. [eyebrow-text](#eyebrow-text)
10. [fact-card](#fact-card)
11. [footer](#footer)
12. [fragment](#fragment)
13. [header](#header)
14. [hero](#hero)
15. [linklist](#linklist)
16. [modal](#modal)
17. [navigation-content](#navigation-content)
18. [news-feed](#news-feed)
19. [pipeline](#pipeline)
20. [pipeline-utility-nav](#pipeline-utility-nav)
21. [press-releases](#press-releases)
22. [quote](#quote)
23. [search](#search)
24. [search-input](#search-input)
25. [social-media](#social-media)
26. [stock-ticker](#stock-ticker)
27. [story-cards](#story-cards)
28. [table](#table)
29. [tabs](#tabs)
30. [tag-utility-nav](#tag-utility-nav)
31. [teaser](#teaser)
32. [video](#video)

---

## breadcrumb

**Purpose:** Auto-generates breadcrumb navigation trail from the page's URL path hierarchy.

**applyCommonProps startIndex:** N/A (no applyCommonProps)

**Row Structure (8 rows):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | id | text | Optional element ID |
| 1 | customClass | text | Optional CSS class |
| 2 | homePagePath | aem-content/link | Root path for breadcrumb start |
| 3 | homeTitle | text | Override label for home item |
| 4 | enableBreadcrumb | boolean | Toggle visibility (default: true) |
| 5 | enableHiddenItems | boolean | Include hidden nav pages (default: false) |
| 6 | enableCurrentPage | boolean | Show current page as last item (default: true) |
| 7 | enableRedirectTitle | boolean | Use redirect target title (default: true) |

**Variant Classes:** None (single variant)

**Key CSS:**
- Mobile: vertical dropdown with chevron toggle button
- Tablet+ (>=744px): horizontal inline trail with chevron separators
- Class `open-breadcrumb` toggles mobile expanded state

**When to use:** Site navigation breadcrumb, typically placed inside hero blocks.

---

## brightcove-podcast-player

**Purpose:** Embeds a Brightcove audio-only player with podcast thumbnail and title in a card layout.

**applyCommonProps startIndex:** 5

**Row Structure (5 content rows + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | videoId | text | Brightcove video/audio ID |
| 1 | accountId | select | corporate/public/commercial |
| 2 | playerId | text | Brightcove player ID |
| 3 | podcastTitle | text | Display title (fallback: from API) |
| 4 | podcastThumbnail | reference | Thumbnail image |
| 5+ | common props | - | id, language, analyticsId |

**Variant Classes:** None

**Key CSS:**
- Card layout with border, flex row (thumbnail left, info right)
- Thumbnail: 74x76px mobile, 95x97px tablet+
- Custom Brightcove player styling (circular blue play button)
- Breakpoints: --bp-tablet (744px), --bp-desktop (1024px)

**When to use:** Podcast/audio content from Brightcove.

---

## brightcove-video

**Purpose:** Full-featured Brightcove video player with overlay, poster, playlist support, transcript, and analytics.

**applyCommonProps startIndex:** 45

**Row Structure (45 content rows + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | projectNumber | text | Tracking project number |
| 1 | overlayTitle | text | Pre-play overlay title |
| 2 | overlayDescription | richtext | Pre-play overlay description |
| 3 | posterType | select | brightcove/custom/color |
| 4 | posterImage | reference | Custom poster image |
| 5 | posterAlt | text | Poster alt text |
| 6 | colorOverlay | text | Solid color overlay hex |
| 7 | overlayButtonText | text | Play button label |
| 8-11 | icon fields | various | Button icon config |
| 12 | playerType | select | single/playlist/3d-video |
| 13 | accountId | select | Brightcove account |
| 14 | playerId | text | Player ID |
| 15 | videoId | text | Video ID (single) |
| 16 | playlistId | text | Playlist ID |
| 17 | defaultPlaylistVideoId | text | Default video in playlist |
| 18 | playlistType | select | carousel/cards |
| 19 | videoContentLayout | select | none/bottom/left/right |
| 20-44 | feature flags + transcript | various | Autoplay, loop, captions, transcript config |

**Dynamic Classes Applied in JS:**

| Class | Source | Description |
|-------|--------|-------------|
| `bcvideo-player-single` | playerType | Single video mode |
| `bcvideo-player-playlist` | playerType | Playlist mode |
| `bcvideo-content-none` | videoContentLayout | No content area |
| `bcvideo-content-bottom` | videoContentLayout | Content below video |
| `bcvideo-content-left` | videoContentLayout | Content left of video |
| `bcvideo-content-right` | videoContentLayout | Content right of video |
| `bcvideo-playlist-carousel` | playlistType | Carousel playlist layout |
| `bcvideo-playlist-cards` | playlistType | Cards grid playlist layout |
| `bcvideo-playlist-meta` | enablePlaylistThumbnailMetadata | Show title/duration on thumbnails |
| `bcvideo-autoplay` | enableAutoplay | Autoplay flag |
| `bcvideo-loop` | enableLoop | Loop flag |
| `bcvideo-chapters` | enableVideoChapters | Show chapters |
| `bcvideo-social` | enableSocialShare | Social share enabled |
| `video-minimal` | CSS picklist | Minimal overlay variant |

**Key CSS:**
- 16:9 aspect ratio container
- Navy overlay on poster (70% opacity)
- Desktop: side-by-side layout for left/right content
- Playlist cards: 1col mobile, 2col tablet, 3col desktop

**When to use:** Any Brightcove video embed (single, playlist, or 3D).

---

## cards

**Purpose:** Grid of content cards with image + body text. Supports video overlay, story variant, and stats dashboard.

**applyCommonProps startIndex:** N/A

**Row Structure:** Each row = one card with 2 cells (image | body content).

**Variant Classes (on block):**

| Class | Description |
|-------|-------------|
| `story` | Horizontal card with date/tag metadata, CTA |
| `cards-video` | Auto-added when body contains a video URL |
| `col-width-4` | Grid span 4 columns (per item) |
| `col-width-5` | Grid span 5 columns (per item) |
| `col-width-6` | Grid span 6 columns (per item) |
| `col-width-7` | Grid span 7 columns (per item) |

**Section-level Classes:**

| Class | Description |
|-------|-------------|
| `cards-stats` | Dark navy dashboard stats grid (auto-added when cards-wrapper is first child) |
| `related-card-section` | Horizontal teaser cards with image left, text right |
| `abbvie-related-cards` | Related cards variant (horizontal, no border) |
| `flxsection-col-10` | 10-column grid wrapper for story cards |

**Key CSS:**
- Default: 1col mobile, 2col tablet, responsive gap
- Stats: 1col mobile, 2col tablet, 4col desktop (complex grid positioning)
- Story: horizontal flex with image left (50%) on tablet+
- Video: navy overlay with centered play button

**When to use:** Multi-item content grids (news cards, story lists, stats dashboards, video galleries).

---

## columns

**Purpose:** Multi-column layout block. Detects column count from first row's children.

**applyCommonProps startIndex:** N/A

**Row Structure:** Each row has N children divs = N columns. Auto-adds class `columns-N-cols`.

**Variant Classes:**

| Class | Description |
|-------|-------------|
| `order-content-first-mobile` | Show text before image on mobile |
| `mb-none` | No bottom margin |
| `mb-tight` | Tight bottom margin (16-20px) |
| `mb-compact` | Compact bottom margin (32-40px) |
| `mb-spacious` | Spacious bottom margin (48-60px) |
| `mb-wide` | Wide bottom margin (66-100px) |
| `square-list` | Square bullet list styling |
| `bullet-list` | Disc bullet list styling |

**Key CSS:**
- Mobile: stacked (flex-direction: column)
- Tablet+: side-by-side (flex-direction: row)
- Image columns get `columns-img-col` class (order: 0)
- CTA links styled as text links (no button border)
- Inline links get blue gradient underline

**When to use:** Any two or three column layout (text + image, two text columns).

---

## editorial-feed

**Purpose:** Dynamic story/news feed that fetches child pages from index, with filtering, search, and pagination.

**applyCommonProps startIndex:** 16

**Row Structure (16 config rows + category items):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | listSource | text | news-and-pr / category-tag / story-pages |
| 1 | parentPage | link | Parent path for child pages |
| 2 | hideDescription | boolean | Hide card descriptions |
| 3 | hideTags | boolean | Hide category tags |
| 4 | hideImage | boolean | Hide card images |
| 5 | hideDate | boolean | Hide publication date |
| 6 | hideFilters | boolean | Hide filter/search UI |
| 7 | categoryTags | text | Comma-separated tag filter |
| 8 | match | text | any/all for tag matching |
| 9 | storyPagesToExclude | text/JSON | Paths to exclude |
| 10 | browseCategoriesPlaceholderText | text | Dropdown placeholder |
| 11 | searchPlaceholderText | text | Search input placeholder |
| 12 | searchIconType | select | none/icon-font/image |
| 13 | searchFontIcon | text | Icon name |
| 14 | searchImageIcon | reference | Icon image |
| 15 | ariaLabel | text | ARIA label for block |
| 16-18 | common props | - | id, customClass, language |
| 19+ | category items | rows | title + pagePath per item |

**Key CSS:**
- Vertical card stack (not grid)
- Tablet+: horizontal cards (image left 50%, content right)
- Category dropdown with listbox
- "Show More" button for pagination (5 per page)
- Empty state with orange error text

**When to use:** News/story listing pages with search and category filtering.

---

## embed

**Purpose:** Embeds videos (YouTube, Vimeo) and social posts (Twitter/X) with optional poster overlay.

**applyCommonProps startIndex:** N/A

**Row Structure (flexible):**
- Row with link/URL to embed
- Optional: picture element for poster
- Optional: heading (h2/h3) for overlay title
- Optional: paragraphs for description and button text

**Variant Classes:**

| Class | Source | Description |
|-------|--------|-------------|
| `embed-youtube` | auto | YouTube embed detected |
| `embed-vimeo` | auto | Vimeo embed detected |
| `embed-twitter` | auto | Twitter embed detected |

**Key CSS:**
- 16:9 aspect ratio
- Navy overlay when overlay content exists (same as columns-video)
- Overlay title: 24px mobile, 30px tablet, 40px desktop
- Watch button: white border, uppercase, icon font play triangle
- Section class `embed-container` sets max-width and padding

**When to use:** YouTube/Vimeo video embeds, Twitter/X embeds, any iframe embed.

---

## embed-form

**Purpose:** Loads and renders an AEM Adaptive Form via its published path using jQuery AJAX.

**applyCommonProps startIndex:** N/A

**Row Structure:** Single row with a link to the AEM form path (`/content/forms/...`).

**Key CSS:** Minimal (container class `embed-form-container`).

**When to use:** AEM Adaptive Forms that need to be embedded on EDS pages.

---

## eyebrow-text

**Purpose:** Uppercase eyebrow/label text used as a section header above content blocks.

**applyCommonProps startIndex:** 1

**Row Structure (1 content row + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | text content | richtext | The eyebrow text |
| 1+ | common props | - | id, customClass, language |

**Variant Classes:**

| Class | Description |
|-------|-------------|
| `mini` | Smaller size (12px), regular weight, no uppercase |
| `divider` | Blue top border accent line |
| `bold-font` | Force bold weight |
| `regular-font` | Force regular weight |
| `light-theme` | Default dark text |
| `dark-theme` | White text for dark backgrounds |
| `align-left` | Left text alignment |
| `align-center` | Center text alignment |
| `align-right` | Right text alignment |

**Width Classes:**

| Class | Grid Columns (Desktop) |
|-------|----------------------|
| `full-width` | span 12 |
| `width-x-large` | span 10 (start col 2) |
| `width-large` | span 9 (start col 2) |
| `width-medium` | span 8 (start col 3) |
| `width-small` | span 7 (start col 3) |
| `width-x-small` | span 6 (start col 4) |

**Key CSS:**
- Default: 16px mobile, 14px tablet+, bold, uppercase, letter-spacing
- Uses 12-column grid for width variants
- Width + alignment combinations supported (e.g., `width-medium align-right`)

**When to use:** Section labels/eyebrows above headings, category labels.

---

## fact-card

**Purpose:** Dashboard statistic card sourced from a Content Fragment (eyebrow, data point, suffix, description, image).

**applyCommonProps startIndex:** 4

**Row Structure (4 content rows + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | contentFragment | aem-content | Path to CF |
| 1 | hideImage | boolean | Hide card image |
| 2 | imagePreset | select | Smart Crop rendition |
| 3 | imageModifiers | text | Width/quality params |
| 4+ | common props | - | id, language, analyticsId |

**Variant/Theme Classes:**

| Class | Description |
|-------|-------------|
| `medium-theme` | Light blue background, transparent border |
| `medium-theme-stroke` | Light blue background + visible border |
| `light-theme-no-stroke` | White background, no border |
| `light-theme-stroke` | White background + border |
| `dark-theme` | Navy dark background, white text |
| `size-medium-vertical` | Tall card with image on top |
| `size-medium-horizontal` | Side-by-side layout (image left 50%) |
| `size-large` | Large card, no gap |
| `hide-image` | Hides the image |
| `show-image` | Shows the image |

**Section-level Class:**
- `fact-card-feature-grid` — 4-column dashboard grid (complex nth-child positioning)

**Key CSS:**
- Data point: 56px mobile, 64px tablet, 80px desktop (blue color)
- Eyebrow: uppercase, bold
- Grid: 1col mobile, 2col tablet, 4col desktop with row-spanning image cards

**When to use:** Statistics/KPI dashboard cards (e.g., "100+ Programs", "$7.7B Investment").

---

## footer

**Purpose:** Loads footer fragment and organizes content into a 4-column layout with back-to-top button.

**applyCommonProps startIndex:** N/A

**Row Structure:** N/A (loaded from `/footer` fragment path).

**Structure:**
- Column 1: Logo (picture)
- Column 2: Primary links (linklist blocks)
- Column 3: Secondary links (heading + linklist)
- Column 4: Tertiary links + copyright
- Bottom section: Legal links from second fragment section

**Key CSS classes:**
- `footer-columns` — flex container
- `footer-logo`, `footer-links-primary`, `footer-links-secondary`, `footer-links-tertiary`
- `footer-bottom` — bottom legal links
- `back-to-top` — scroll-to-top button

**When to use:** Global site footer (auto-loaded by EDS framework).

---

## fragment

**Purpose:** Includes content from another page path as an inline fragment (standard EDS pattern).

**Row Structure:** Single row with a link or text path to the fragment.

**When to use:** Reusing content across pages (shared sections, CTAs, sidebars).

---

## header

**Purpose:** Full mega-navigation with multi-level dropdowns, search, language links, and responsive hamburger menu.

**applyCommonProps startIndex:** N/A

**Structure:** Loaded from `/nav` fragment containing `navigation-content` blocks.

**Key CSS classes:**
- `nav-brand` — Logo section
- `nav-sections` — Main nav items
- `nav-tools` — Search + language
- `nav-hamburger` — Mobile menu toggle
- `nav-backdrop` — Dark overlay when menu open
- `hide-nav` / `show-nav` — Scroll-based header visibility
- `second-level-active` — Mobile submenu active

**When to use:** Global site header (auto-loaded by EDS framework).

---

## hero

**Purpose:** Hero banner with image background and white overlap text panel. Absorbs breadcrumb and press-releases blocks.

**applyCommonProps startIndex:** N/A

**Row Structure (2 rows):**

| Row | Field | Description |
|-----|-------|-------------|
| 0 | Image | Hero background image (promoted to section bg) |
| 1 | Text content | h1 heading, paragraphs, optional CTA link |

**Variant Classes (on block):**

| Class | Description |
|-------|-------------|
| `profile` | Navy band (no image), white overlap card |
| `landing` | Full-bleed image with dark gradient overlay |
| `light-font` | Roboto Light paragraph text |
| `no-padding` | Remove image container padding |

**Section-level Classes:**

| Class | Description |
|-------|-------------|
| `hero-container` | Standard hero section |
| `navy-overlap` | Navy background with rounded corner |
| `hero-navy` | Combined navy-overlap + hero-container |
| `hero-profile-section` | Profile variant section |
| `hero-landing-section` | Landing variant section |
| `height-tall` | Taller hero image area |
| `section-wide` | Full-width (no side padding) |
| `large-radius` | Large border-top-left-radius |
| `medium-radius` | Medium border-top-left-radius |
| `purple-overlap` | Purple background instead of navy (profile) |

**Key CSS:**
- White overlap panel with border-top-left-radius
- Navy-overlap: negative margins, rounded corner section
- Landing: absolute positioned image, gradient ::after overlay, white text
- Profile: no image, navy band, white overlap card
- Responsive h1: 30px mobile, 40px tablet, 64px desktop

**When to use:** Page hero banners (standard, profile pages, landing/homepage).

---

## linklist

**Purpose:** Highly configurable link list with multiple variants, layouts, child-page auto-population, icons, tags, modals, and carousel mode.

**applyCommonProps startIndex:** N/A (custom config reading)

**Row Structure (18 config rows + item rows):**

Config rows 0-17:
| Row | Field | Description |
|-----|-------|-------------|
| 0 | id | Block ID |
| 1 | customClass | Custom CSS class |
| 2 | variant | standard/rows-with-arrows/icons/detailed-list/carousel/footer-primary/footer-legal |
| 3 | linkSource | custom/child-pages |
| 4 | parentPage | Parent path for child pages |
| 5 | childDepth | How deep to scan (1-10) |
| 6 | excludeCurrentPage | boolean |
| 7 | enableDescription | boolean |
| 8 | enableTags | boolean |
| 9 | enableSubtitle | boolean |
| 10 | enableDate | boolean |
| 11 | orderBy | content-tree/title/last-modified/published |
| 12 | sortOrder | asc/desc |
| 13 | maxItems | Max items (1-500) |
| 14 | layout | single-column/two-columns-stack/two-columns-nostack |
| 15 | fontIcon | Block-level icon (for icons variant) |
| 16 | language | lang:code |
| 17 | ariaLabel | ARIA label for nav |

Each item row has 18 fields (id, class, cookieConsent, link, openInNewTab, linkText, subtitle, description, categoryTags, iconType, fontIcon, imageIcon, iconPosition, iconLink, enableConfirmationModal, confirmationModalType, modalId, language, ariaLabel).

**Variant Classes:**

| Class | Description |
|-------|-------------|
| `linklist--standard` | Default vertical list |
| `linklist--rows-with-arrows` | Rows with right arrow, border-bottom separator |
| `linklist--icons` | Inline row with icons, wrapping |
| `linklist--detailed-list` | Bordered rows with subtitle + description |
| `linklist--carousel` | Horizontal scroll with snap, prev/next buttons |
| `linklist--footer-primary` | Large heading-style links (F37 Lineca 40px) |
| `linklist--footer-legal` | Small uppercase legal links, inline wrap |

**Layout Classes (on `<ul>`):**

| Class | Description |
|-------|-------------|
| `linklist-layout--single-column` | Single column (default) |
| `linklist-layout--two-columns-stack` | 1col mobile, 2col tablet grid |
| `linklist-layout--two-columns-nostack` | Always 2col grid |

**Background Color Support (section classes):**
- `bg-071d49`, `bg-666b7a`, `bg-8a2ecc`, `bg-a86bde`, `bg-0066f5`, `bg-cf451c`, `bg-338700` — White text on dark backgrounds

**When to use:** Navigation lists, footer links, related content, sidebar navigation, icon-based social links.

---

## modal

**Purpose:** Dialog/modal system that loads content from fragment paths. Used by linklist for confirmation modals.

**applyCommonProps startIndex:** N/A

**Usage:** Programmatic — `createModal(contentNodes, opts)` and `openModal(path, opts)` functions.

**Key CSS classes:**
- `modal-content` — Dialog content wrapper
- `close-button` — X close button
- `modal-open` — Body class when modal is active

**When to use:** Confirmation dialogs, content overlays, departure warnings.

---

## navigation-content

**Purpose:** Building block for the header mega-navigation. Contains nav items, search config, and language links.

**Row Structure:** Variable — used internally by header block.

**Data attributes:** `data-type="navigation-content"`, `data-type="logo"`, `data-type="search"`, `data-type="language-links"`

**When to use:** Only within the nav fragment consumed by the header block.

---

## news-feed

**Purpose:** News article feed (similar to editorial-feed but news-specific).

**When to use:** News listing pages.

---

## pipeline

**Purpose:** Interactive pharmaceutical pipeline table showing drug candidates with phases, targets, molecules, and therapeutic areas.

**applyCommonProps startIndex:** N/A (custom reading)

**Row Structure (22+ config rows):**

| Row | Field | Description |
|-----|-------|-------------|
| 0 | shareText | Share button tooltip |
| 1 | shareConfirm | Share confirmation text |
| 2 | targetHeader | Column header for "Target" |
| 3 | moleculeHeader | Column header for "Molecule" |
| 4 | pronunciationHeader | Column header for "Pronunciation" |
| 5-16 | column headers | Pharma + Device column configs |
| 17-20 | icon fields | Share/speaker icons |
| 21-22 | no results | Headline + subheading when empty |

Data loaded from Content Fragment API.

**Key CSS classes:**
- Phase bar visualization (colored segments)
- Responsive table with horizontal scroll
- Filter/search integration

**When to use:** R&D pipeline pages showing drug development stages.

---

## pipeline-utility-nav

**Purpose:** Utility navigation bar for the pipeline page (filter controls, view toggles).

**When to use:** Pipeline page utility/filter bar.

---

## press-releases

**Purpose:** RSS-fed press release carousel with date and title cards, prev/next navigation.

**Row Structure:**
- Optional `numberOfItems` field (default: 3)
- Fetches from config `pressReleaseUrl` RSS feed

**Key CSS classes:**
- `press-carousel` — Carousel wrapper
- `press-carousel-track` — Scrollable track
- `press-card` — Individual release card
- `press-date` — Publication date
- `press-title` — Release title
- `press-arrow`, `press-prev`, `press-next` — Navigation buttons

**When to use:** Homepage or landing page press release carousels.

---

## quote

**Purpose:** Blockquote with attribution, sourced from Content Fragments or direct authoring. Supports background images.

**applyCommonProps startIndex:** 10

**Row Structure (10 content rows + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | quoteType | select | Type of quote |
| 1 | quotation | richtext | The quote text |
| 2 | attributionName | text | Person's name |
| 3 | attributionTitle | text | Person's title/role |
| 4 | attributionImage | reference | Person's photo |
| 5 | quoteFragment | aem-content | Path to quote CF |
| 6 | backgroundImage | reference | Background image |
| 7 | backgroundImagePreset | select | Image preset |
| 8 | backgroundImageModifiers | text | Image params |
| 9 | backgroundImageAlt | text | Background alt text |
| 10+ | common props | - | id, language, analyticsId |

**When to use:** Testimonials, pull quotes, executive quotes with attribution.

---

## search

**Purpose:** Full search results page with query highlighting, pagination, and result cards with images.

**applyCommonProps startIndex:** N/A

**When to use:** Search results page (`/search-results`).

---

## search-input

**Purpose:** Standalone search input field that redirects to the search results page.

**When to use:** Search forms outside the header navigation.

---

## social-media

**Purpose:** Social media icon links (each row = icon image + URL).

**applyCommonProps startIndex:** 0

**Row Structure:** Each row has 2 cells:
- Cell 0: Icon image (img/picture)
- Cell 1: Social media URL

**Key CSS classes:**
- `social-link-item` — Individual link wrapper
- Images open in new tab with `noopener noreferrer`

**When to use:** Social media icon bars in footer or sidebar.

---

## stock-ticker

**Purpose:** Real-time stock price display with change indicator and timestamp (NYSE: ABBV).

**Row Structure:** Config rows for API endpoint and display settings.

**Key CSS classes:**
- `last-trade-decimal` — Integer portion of price
- `last-trade-fraction` — Decimal portion of price
- Formatted timestamp with timezone

**When to use:** Investor relations pages, header utility bars.

---

## story-cards

**Purpose:** Multi-card story layout using the story-card sub-block pattern. Supports Content Fragment-based cards.

**applyCommonProps startIndex:** N/A

**Row Structure:** Each row is either a `story-card-item` (from UE) or a legacy card row with image + body cells.

**Key CSS:**
- Uses same styling as `story-card` block
- Grid: 1col mobile, 2col tablet, 3col desktop
- Hover zoom on card images

**When to use:** Story/article card grids (multi-card sections).

---

## table

**Purpose:** Converts block rows/columns into a semantic HTML `<table>` element.

**applyCommonProps startIndex:** N/A

**Row Structure:** First row = header (th), remaining rows = body (td).

**Variant Classes:**

| Class | Description |
|-------|-------------|
| `no-header` | Skip thead generation, all rows are tbody |

**When to use:** Data tables, comparison tables, specification tables.

---

## tabs

**Purpose:** Tabbed content interface with ARIA roles (tablist, tab, tabpanel).

**applyCommonProps startIndex:** N/A

**Row Structure:** Each row = one tab. First cell = tab title (heading), remaining = tab panel content.

**Key CSS classes:**
- `tabs-list` — Horizontal tab button bar (role=tablist)
- `tabs-tab` — Individual tab button (role=tab)
- `tabs-panel` — Tab content panel (role=tabpanel)
- `aria-hidden` / `aria-selected` for show/hide state

**When to use:** Tabbed content sections (e.g., "Overview | Details | Downloads").

---

## tag-utility-nav

**Purpose:** Tag-based utility navigation bar for filtering content by category tags.

**When to use:** Category/tag filter bars on listing pages.

---

## teaser

**Purpose:** Two-column teaser with eyebrow, title left, description + CTA right.

**applyCommonProps startIndex:** 7

**Row Structure (7 content rows + common props):**

| Row | Field | Type | Description |
|-----|-------|------|-------------|
| 0 | eyebrow | text/strong | Uppercase label above content |
| 1 | title | heading (h3) | Left column heading |
| 2 | description | paragraph | Right column text |
| 3 | buttonText | text | CTA button label |
| 4 | buttonURL | link | CTA destination |
| 5 | clickType | text | _self / _blank |
| 6 | ariaLabel | text | Accessible label |
| 7+ | common props | - | id, classes, language |

**Variant Classes (from picklist):**

| Class | Description |
|-------|-------------|
| `teaser-external-link` | External link styling |
| `teaser-internal-link` | Internal link styling |

**Key CSS classes:**
- `teaser-eyebrow` — Uppercase label
- `teaser-content` — Flex row container
- `teaser-left` — Title column
- `teaser-right` — Description + button column

**When to use:** Section teasers with eyebrow + heading + description + CTA.

---

## video

**Purpose:** Self-hosted video player (MP4/WebM) with poster, overlay, and autoplay support. Alternative to Brightcove.

**applyCommonProps startIndex:** Variable (depends on field count)

**Row Structure:** Config rows for video URL, poster image, overlay title/description, autoplay, loop, controls.

**Key features:**
- Poster overlay with play button
- Content layout options (none/bottom/left/right)
- Autoplay + loop support
- Icon configuration for play button

**When to use:** Self-hosted video content (non-Brightcove MP4/WebM files).

---

## Common Patterns

### applyCommonProps

Many blocks use `applyCommonProps(block, startIndex)` which reads 3 rows starting at `startIndex`:
- `startIndex + 0`: blockId (sets `block.id`)
- `startIndex + 1`: language (sets `block.lang`)
- `startIndex + 2`: analyticsId (sets `data-analytics-id`)

### Section Metadata

Section styling is controlled via Section Metadata block:
- `style` field maps to CSS classes on the section
- `background` field for background images
- Section wrapper class: `.section.{style-value}`

### Responsive Breakpoints

All blocks use these custom media queries:
- `--bp-tablet`: >= 744px
- `--bp-desktop`: >= 1024px
- `--bp-wide`: >= 1280px (used rarely)

### Icon System

Icons use `createIcon(source, type, options)`:
- `type: 'icon-font'` — CSS icon font class (e.g., `icon-abbvie-chevron-down`)
- `type: 'image'` — `<img>` element from URL/reference
- `type: 'svg'` — Inline SVG

### Image References

AEM author images resolve via `resolveImageReference(element)` which converts `<a>` references to `<picture>/<img>` elements.

---

## Example: Import Script Block Table Format

```html
<table>
  <tr><th colspan="2">Block Name (variant)</th></tr>
  <tr><td>Row 0 content</td></tr>
  <tr><td>Row 1 content</td></tr>
  ...
</table>
```

For blocks with startIndex-based common props, always include the blockId/language/analyticsId rows (can be empty).
