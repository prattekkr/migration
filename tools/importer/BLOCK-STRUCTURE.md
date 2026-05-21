# Block Structure Reference (from manually migrated EDS pages)

## Page Layout (5-section grid: 2-8-2)

```
Section 1: Hero        → section-metadata (content-wide, medium-radius)
Section 2: Grid start  → section-metadata (grid-container, content-regular)
Section 3: Left spacer → section-metadata (grid-cols-2) [1 row, 1 col, empty]
Section 4: Body        → section-metadata (grid-section, grid-cols-8)
Section 5: Right spacer→ section-metadata (grid-cols-2) [1 row, 1 col, empty]
```

section-metadata with `language|none` uses 2 cols.
section-metadata spacers (grid-cols-2) use 1 col, empty.

---

## hero-container — 1 row × 6 cols
Variants: height-default, height-tall, overlay-height-short

```
Row 0: [image | (empty) | (empty) | (empty) | (empty) | (empty)]
```

---

## cta — 11 rows × 1 col
Variants: default-cta, back-cta

```
Row 0:  link (<a href="...">text</a>)
Row 1:  (empty) — aria-label
Row 2:  _self — target
Row 3:  none — iconVariation
Row 4:  chevron — iconFont
Row 5:  (empty) — iconImage
Row 6:  before — iconPosition
Row 7:  false — ariaHidden
Row 8:  (empty) — classes
Row 9:  none — language
Row 10: (empty) — blockId
```

---

## story-card — 12 rows × 1 col
No variants (plain "story-card")

```
Row 0:  storyCardInfo — variant
Row 1:  false — hidePublicationDate
Row 2:  false — hideReadTime
Row 3:  true — hideRole
Row 4:  true — hideDescription
Row 5:  true — hideImage
Row 6:  (empty) — id
Row 7:  (empty) — customClass
Row 8:  <a href="...">link</a> — page
Row 9:  false — openInNewTab
Row 10: (empty) — ctaLabel
Row 11: (empty) — analyticsInteractionId
```

---

## custom-title — 4 rows × 1 col
Variants: h1-size, h5-size, width-large, h3-size, book-weight

```
Row 0: <h1-h6 id="slug">Title text</h1-h6>
Row 1: id: (or empty for body headings)
Row 2: lang:none (or "none" for body)
Row 3: (empty) — classes
```

NOTE: Row 1 = "id:" for h1-size, empty for h5-size.
      Row 2 = "lang:none" for h1-size, "none" for h5-size.

---

## text-container (OUR FORMAT) — 5 rows (4×1col + 1×2col)
Variants: body-unica-32-reg, spacing-bottom, width-large, 
          width-x-large, body-unica-20-reg, section-padding, standard

```
Row 0: (empty) — classes group
Row 1: (empty) — blockId
Row 2: none — language
Row 3: (empty) — analytics_id
Row 4: [text-container-text | <richtext content>] — child item (2 cols)
```

---

## separator — 4 rows × 1 col
Variants: separator-height-24, separator-height-32, separator-height-48, separator-height-64

```
Row 0: false (or true) — showLine
Row 1: (empty) — classes
Row 2: none — language
Row 3: (empty) — blockId
```

---

## custom-image — 16 rows × 1 col
No variants (plain "custom-image")

```
Row 0:  <picture><img src="..." alt="..."></picture> — image
Row 1:  false — getAltFromDAM
Row 2:  false — imageIsDecorative
Row 3:  (empty) — caption
Row 4:  false — getCaptionFromDAM
Row 5:  false — displayCaptionBelowImage
Row 6:  false — enableLink
Row 7:  (empty) — target
Row 8:  _self — clickBehavior
Row 9:  (empty) — modalPanelId
Row 10: false — enableWarnOnLeave
Row 11: (empty) — warnOnLeavePath
Row 12: (empty) — linkAriaLabel
Row 13: (empty) — classes
Row 14: none — language
Row 15: (empty) — blockId
```

---

## carousel — 24 rows × 1 col
Variants: carousel-show-btn-margin, carousel-minimal

```
Row 0:  N — totalSlides
Row 1:  static — carouselType
Row 2:  (empty) — rssFeedUrl
Row 3:  (empty) — numberOfItems
Row 4:  false — autoplay
Row 5:  3000 — slideTransitionTime
Row 6:  false — pauseOnHover
Row 7:  1 — numberOfSlidesToShow
Row 8:  false — bypassCarouselOnMobile
Row 9:  1 — startingSlideIndex
Row 10: false — centerActiveSlide
Row 11: false — enableLooping
Row 12: true — enableNextPreviousControls
Row 13: true — enableDotNavigation
Row 14: (empty) — carouselLabel
Row 15: (empty) — previousButtonLabel
Row 16: (empty) — nextButtonLabel
Row 17: (empty) — playButtonLabel
Row 18: (empty) — pauseButtonLabel
Row 19: (empty) — tablistLabel
Row 20: false — itemLabel
Row 21: (empty) — classes
Row 22: none — language
Row 23: (empty) — blockId
```

Followed by N × custom-image blocks (one per slide).

---

## accordion — 16 config rows (1 col) + N item rows (5 cols)
Variants: accordion-icon-font, h5-size, width-large

Config rows:
```
Row 0:  title text (e.g. "References")
Row 1:  Expand All
Row 2:  Collapse All
Row 3:  plus — expandedIcon
Row 4:  minus — collapsedIcon
Row 5:  plus — expandedIconFont
Row 6:  minus — collapsedIconFont
Row 7:  (empty) — expandedImage
Row 8:  (empty) — collapsedImage
Row 9:  (empty) — openFirstItem
Row 10: (empty) — singleOpen
Row 11: (empty) — showExpandAll
Row 12: (empty) — id
Row 13: (empty) — customClass
Row 14: none — language
Row 15: (empty) — blockId
```

Item rows (5 cols each):
```
[heading-text | body-content | accordion-item | (empty) | (empty)]
```

---

## quote — 12 rows × 1 col
Variants: quote-standard, quote-h4, cmp-quote-xx-large

```
Row 0:  basic (or empty) — quoteVariant
Row 1:  <strong>quote text</strong> — quotation (richtext)
Row 2:  Author Name — attributionName
Row 3:  Author Role — attributionRole
Row 4:  <picture><img...></picture> (or empty) — attributionImage
Row 5:  (empty) — quoteFragment
Row 6:  (empty) — backgroundImage
Row 7:  (empty) — backgroundImagePreset
Row 8:  (empty) — backgroundImageModifiers
Row 9:  (empty) — classes
Row 10: none — language
Row 11: (empty) — blockId/analytics
```

---

## brightcove-video — 39 rows × 1 col
Variants: cmp-video-xx-large

(See parser for full row mapping — key rows: accountId=7, playerId=8, videoId=9)
