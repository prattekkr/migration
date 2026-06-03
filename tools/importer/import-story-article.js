/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: story-article (v4 — with edge case handling)
 *
 * Handles 133 story article pages with conditional logic for:
 * - Pages WITH or WITHOUT hero image
 * - Pages WITH or WITHOUT carousel
 * - Pages WITH or WITHOUT accordion/references
 * - Pages WITH or WITHOUT quote blocks
 * - Pages WITH or WITHOUT inline images
 * - Pages WITH or WITHOUT video embeds
 * - Pages WITH or WITHOUT media inquiries
 * - Pages with different heading levels (h2 vs h5)
 * - Pages with links in body text (preserved inline)
 * - Pages with image captions (italic text after images)
 *
 * Grid structure: 2-8-2 (centered narrow article)
 * Section 1: hero + intro (content-wide, medium-radius)
 * Section 2: grid-container (content-regular)
 * Section 3: grid-cols-2 (left spacer)
 * Section 4: body content (grid-section, grid-cols-8)
 * Section 5: grid-cols-2 (right spacer)
 */

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { appendMetadataBlock } from './parsers/utils/metadata.js';

// ═══════════════════════════════════════════════════════════════
// BLOCK BUILDERS (exact row counts per MIGRATION-SKILL.md)
// ═══════════════════════════════════════════════════════════════

function makeBlock(document, name, rows) {
  const table = document.createElement('table');
  const maxCols = Math.max(...rows.map(r => (Array.isArray(r) ? r : [r]).length));
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.colSpan = maxCols;
  th.textContent = name;
  tr.appendChild(th);
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach((cells) => {
    const row = document.createElement('tr');
    const arr = Array.isArray(cells) ? cells : [cells];
    arr.forEach((cell, i) => {
      const td = document.createElement('td');
      if (cell instanceof Node) td.appendChild(cell.cloneNode ? cell.cloneNode(true) : cell);
      else td.textContent = cell != null ? String(cell) : '';
      if (arr.length < maxCols && i === arr.length - 1) {
        td.colSpan = maxCols - arr.length + 1;
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}


// Section Metadata — uses style_customDynamicClass (matches reference JCR output)
// For grid-section/grid-container, also emits blockModelId row so md2jcr uses correct model
function makeSectionMetadata(document, styles, blockModelId) {
  const rows = [];
  if (blockModelId) {
    rows.push(['blockModelId', blockModelId]);
  }
  if (styles) {
    rows.push(['style_customDynamicClass', styles]);
  }
  return makeBlock(document, 'Section Metadata', rows);
}

// Hero Container (UPDATED MODEL)
// Parent model field groups (4): classes, blockId, language, analytics
// md2jcr consumes N parent rows then remaining = child items.
// IMPORTANT: field hints don't survive html2md; empty rows collapse in markdown.
// Solution: skip parent rows entirely — md2jcr will use template defaults.
// Put only the child item row with component ID prefix.
function makeHeroContainer(document, imgSrc, imgAlt, heightVariant) {
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc || '';
  img.alt = imgAlt || '';
  pic.appendChild(img);
  const variant = heightVariant || 'height-default';
  // Parent model field groups (4): classes, blockId, language, analytics
  // Must provide non-empty parent rows or they collapse in markdown.
  // Then item row with image for hero-container-item.
  return makeBlock(document, 'Hero Container', [
    [`${variant},overlay-height-short`], // [0] classes group → classes_customDynamicClass
    ['-'],              // [1] blockId
    ['none'],           // [2] language
    ['-'],              // [3] analytics_id
    [pic],              // [4] hero-container-item (image)
  ]);
}

// CTA — field groups (12 after collapsing):
//   [0] link (collapsed: linkText — extracted from <a> node href + text)
//   [1] aria-label
//   [2] ctaTarget
//   [3] iconVariation
//   [4] iconFont
//   [5] iconImage
//   [6] iconPosition
//   [7] ariaHidden
//   [8] classes (classes_customDynamicClass, classes_commonCustomClass)
//   [9] blockId
//   [10] language
//   [11] analytics (analytics_id)
// Note: CTA model has NO `classes` multiselect field, so parenthesized variants
// won't be stored by md2jcr. Use classes_customDynamicClass via field hint.
function makeCTA(document, text, url) {
  const a = document.createElement('a');
  a.href = url;
  a.textContent = text;
  return makeBlock(document, 'Cta', [
    [a],                      // [0] link (linkText collapsed)
    [''],                     // [1] aria-label
    ['_self'],                // [2] ctaTarget
    ['none'],                 // [3] iconVariation
    ['chevron'],              // [4] iconFont
    [''],                     // [5] iconImage
    ['before'],               // [6] iconPosition
    ['false'],                // [7] ariaHidden
    [''],                     // [8] warnOnDeparturePopupFragmentPath
    ['default-cta,back-cta'], // [9] classes group
    [''],                     // [10] blockId
    ['none'],                 // [11] language
    [''],                     // [12] analytics_id
  ]);
}

// Story Card — 12 rows per reference .md
function makeStoryCard(document, categoryHref, categoryJcrPath) {
  let categoryCell = '';
  if (categoryHref) {
    const a = document.createElement('a');
    a.href = categoryHref;
    a.textContent = categoryJcrPath || categoryHref;
    categoryCell = a;
  }
  return makeBlock(document, 'Story Card', [
    ['storyCardInfo'], ['false'], ['false'], ['true'], ['true'], ['true'],
    [''], [''], [categoryCell], ['false'], [''], [''],
  ]);
}

// Story Card (relatedContent variant) — 12 rows
function makeRelatedContentCard(document, href) {
  let storyPath = href || '';
  storyPath = storyPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
  storyPath = storyPath.replace(/\.html$/, '');
  if (storyPath && !storyPath.startsWith('/content/')) {
    storyPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${storyPath}`;
  }
  const a = document.createElement('a');
  a.href = storyPath;
  a.textContent = storyPath;
  return makeBlock(document, 'Story Card', [
    ['relatedContent'], ['true'], ['false'], ['true'], ['false'], ['false'],
    [''], [''], [a], ['false'], [''], [''],
  ]);
}

// Custom Title — field groups (5 after collapsing):
//   [0] title (collapsed: titleType — extracted from heading level h1→"h1")
//   [1] classes (classes_customDynamicClass, classes_commonCustomClass)
//   [2] blockId
//   [3] language
//   [4] analytics (analytics_id)
// titleType is auto-collapsed from heading node depth.
// Variants (h1-size, width-large) go to classes_customDynamicClass via field hint.
function makeCustomTitle(document, text, level, variants) {
  const h = document.createElement(`h${level}`);
  h.textContent = text;
  return makeBlock(document, 'Custom Title', [
    [h],             // [0] title (titleType collapsed from heading level)
    [variants],      // [1] classes group → plain text
    [''],            // [2] blockId
    ['none'],        // [3] language
    [''],            // [4] analytics_id
  ]);
}

// Text Container — filter allows: [text-container-image, text-container-text]
// md2jcr uses first cell text to identify which child component to use.
// If first cell matches an allowed component ID, that component is used.
// Otherwise falls back to FIRST allowed component (text-container-image) — WRONG!
// Solution: prefix each item row with "text-container-text" as component ID in first cell.
// Parent rows: skip entirely (template defaults will fill them).
function makeTextContainer(document, contentNode, variants) {
  // Combine all content into a single richtext cell
  const wrapper = document.createElement('div');
  if (contentNode && contentNode.querySelectorAll) {
    const paragraphs = contentNode.querySelectorAll('p, ul, ol, h2, h3, h4, h5, h6, blockquote');
    if (paragraphs.length > 0) {
      paragraphs.forEach((el) => {
        wrapper.appendChild(el.cloneNode(true));
      });
    } else {
      wrapper.innerHTML = contentNode.innerHTML || '';
    }
  } else if (contentNode) {
    wrapper.appendChild(contentNode.cloneNode ? contentNode.cloneNode(true) : contentNode);
  }

  // Parent model field groups (4): classes, blockId, language, analytics
  // Must provide non-empty parent rows or they collapse in markdown.
  // Then item row(s) with content.
  return makeBlock(document, 'Text Container', [
    [variants || '-'],  // [0] classes group → classes_customDynamicClass
    ['-'],              // [1] blockId
    ['none'],           // [2] language
    ['-'],              // [3] analytics_id
    [wrapper],          // [4] text-container-text item
  ]);
}

// Separator — 6 fields: showLine, classes_customDynamicClass, blockId, classes_commonCustomClass, language, analytics_id
function makeSeparator(document, height) {
  return makeBlock(document, `Separator (separator-height-${height || 24})`, [
    ['false'], [''], [''], [''], [''], [''],
  ]);
}

// Custom Image — field groups (17):
//   [0] image (collapsed: imageMimeType, imageAlt) — from <img> node
//   [1] getAltFromDAM
//   [2] imageIsDecorative
//   [3] caption
//   [4] getCaptionFromDAM
//   [5] displayCaptionBelowImage
//   [6] enableLink
//   [7] target
//   [8] clickBehavior
//   [9] modalPanelId
//   [10] enableWarnOnLeave
//   [11] warnOnLeavePath
//   [12] linkAriaLabel
//   [13] classes (classes_customDynamicClass, classes_commonCustomClass)
//   [14] blockId
//   [15] language
//   [16] analytics (analytics_id)
function makeCustomImage(document, src, alt, caption) {
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  pic.appendChild(img);
  return makeBlock(document, 'Custom Image', [
    [pic],       // [0] image (alt collapsed from img.alt, MimeType auto)
    ['false'],   // [1] getAltFromDAM
    ['false'],   // [2] imageIsDecorative
    [caption || ''], // [3] caption
    ['false'],   // [4] getCaptionFromDAM
    ['false'],   // [5] displayCaptionBelowImage
    ['false'],   // [6] enableLink
    [''],        // [7] target
    ['_self'],   // [8] clickBehavior
    [''],        // [9] modalPanelId
    ['false'],   // [10] enableWarnOnLeave
    [''],        // [11] warnOnLeavePath
    [''],        // [12] linkAriaLabel
    [''],        // [13] classes group
    [''],        // [14] blockId
    ['none'],    // [15] language
    [''],        // [16] analytics_id
  ]);
}

// Carousel — matching reference: 25 rows, showArrows=true at correct position
function makeCarousel(document, slideCount) {
  return makeBlock(document, 'Carousel (carousel-show-btn-margin, carousel-minimal)', [
    [String(slideCount || 2)], // totalSlides
    ['static'],                // carouselType
    [''],                      // rssFeedUrl
    [''],                      // numberOfItems
    ['false'],                 // autoplay
    ['3000'],                  // slideTransitionTime
    ['false'],                 // pauseOnHover
    [String(slideCount || 2)], // numberOfSlidesToShow
    ['false'],                 // bypassCarouselOnMobile
    ['1'],                     // startingSlideIndex
    ['false'],                 // centerActiveSlide
    ['false'],                 // enableLooping
    ['true'],                  // enableNextPreviousControls (arrows)
    ['true'],                  // enableDotNavigation
    [''],                      // carouselLabel
    [''],                      // previousButtonLabel
    [''],                      // nextButtonLabel
    [''],                      // playButtonLabel
    [''],                      // pauseButtonLabel
    [''],                      // tablistLabel
    ['false'],                 // itemLabel
    [''],                      // classes_customDynamicClass
    [''],                      // blockId
    [''],                      // classes_commonCustomClass
    [''],                      // language
  ]);
}

// Accordion — md2jcr groups classes_* fields into a single "classes" group.
// FieldGroup order (17 groups total for parent):
//   [0] blockHeading (1 field)
//   [1] classes (5 fields: allowMultipleOpen, showExpandCollapseAll, iconType, customDynamicClass, commonCustomClass)
//   [2] expandAllLabel
//   [3] collapseAllLabel
//   [4] expandAllIcon
//   [5] collapseAllIcon
//   [6] expandIcon
//   [7] collapseIcon
//   [8] expandAllIconImage
//   [9] collapseAllIconImage
//   [10] expandIconImage
//   [11] collapseIconImage
//   [12] ariaExpandAllLabel
//   [13] ariaCollapseAllLabel
//   [14] blockId
//   [15] language
//   [16] analytics_id
// After 17 parent rows → accordion-item children (each row = 1 item)
// accordion-item model: summary (text), text (richtext), classes_defaultOpen, ariaExpandLabel, ariaCollapseLabel
// Variant classes (accordion-icon-font, h5-size, width-large) go in header.
function makeAccordion(document, title, items) {
  const rows = [
    [title || ''],       // [0] blockHeading
    ['false'],           // [1] classes group (plain text, first field gets value)
    ['Expand All'],      // [2] expandAllLabel
    ['Collapse All'],    // [3] collapseAllLabel
    ['plus'],            // [4] expandAllIcon
    ['minus'],           // [5] collapseAllIcon
    ['plus'],            // [6] expandIcon
    ['minus'],           // [7] collapseIcon
    [''],                // [8] expandAllIconImage
    [''],                // [9] collapseAllIconImage
    [''],                // [10] expandIconImage
    [''],                // [11] collapseIconImage
    [''],                // [12] ariaExpandAllLabel
    [''],                // [13] ariaCollapseAllLabel
    [''],                // [14] blockId
    ['none'],            // [15] language
    [''],                // [16] analytics_id
  ];
  // Item rows: each row = one accordion-item
  // accordion-item fields: summary, text (richtext), classes_defaultOpen, ariaExpandLabel, ariaCollapseLabel
  (items || []).forEach((item) => {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = item.content || '';
    rows.push([item.summary || '', contentDiv]);
  });
  return makeBlock(document, 'Accordion (accordion-icon-font, h5-size, width-large)', rows);
}

// Quote — field GROUPS (after FieldGroup grouping, 13 groups):
//   [0] quoteVariant
//   [1] quotation (richtext)
//   [2] attributionName
//   [3] attributionRole
//   [4] attributionImage (collapsed: attributionImageMimeType)
//   [5] quoteFragment
//   [6] backgroundImage (collapsed: backgroundImageMimeType, backgroundImageAlt)
//   [7] backgroundImagePreset
//   [8] backgroundImageModifiers
//   [9] classes (classes_customDynamicClass, classes_commonCustomClass)
//   [10] blockId
//   [11] language
//   [12] analytics (analytics_id)
function makeQuote(document, text, authorName, authorTitle, authorImgSrc) {
  let imgEl = '';
  if (authorImgSrc) {
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = authorImgSrc;
    img.alt = authorName || '';
    pic.appendChild(img);
    imgEl = pic;
  }
  return makeBlock(document, 'Quote (quote-standard, quote-h4)', [
    ['quote-standard'], // [0] quoteVariant
    [text || ''],       // [1] quotation (richtext)
    [authorName || ''], // [2] attributionName
    [authorTitle || ''], // [3] attributionRole
    [imgEl],            // [4] attributionImage (MimeType auto-collapsed)
    [''],               // [5] quoteFragment
    [''],               // [6] backgroundImage (MimeType + Alt auto-collapsed)
    [''],               // [7] backgroundImagePreset
    [''],               // [8] backgroundImageModifiers
    [''],               // [9] classes group
    [''],               // [10] blockId
    ['none'],           // [11] language
    [''],               // [12] analytics_id
  ]);
}

// ═══════════════════════════════════════════════════════════════
// IMAGE URL NORMALIZER
// ═══════════════════════════════════════════════════════════════

function normalizeImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return '';
  if (src.includes('/content/dam/')) {
    const fn = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[?#].*/, '');
    return `https://abbvie.scene7.com/is/image/abbviecorp/${fn}`;
  }
  return src;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ROOT DETECTION
// ═══════════════════════════════════════════════════════════════

function findContentRoot(document) {
  // Strategy 1: .overlap-predecessor landmark
  const overlapEl = document.querySelector('.overlap-predecessor');
  if (overlapEl) return overlapEl.parentElement;

  // Strategy 2: Walk up from h1 to .aem-Grid
  const h1 = document.querySelector('h1');
  if (h1) {
    let el = h1;
    while (el.parentElement) {
      if ((el.parentElement.className || '').includes('aem-Grid')) return el.parentElement;
      el = el.parentElement;
    }
  }

  // Strategy 3: Fallback
  return document.querySelector('.aem-Grid.aem-Grid--12') || document.body;
}

// ═══════════════════════════════════════════════════════════════
// MAIN TRANSFORM
// ═══════════════════════════════════════════════════════════════

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    const contentRoot = findContentRoot(document);
    const allChildren = Array.from(contentRoot.children);
    const overlapIdx = allChildren.findIndex((el) => (el.className || '').includes('overlap-predecessor'));

    const heroContainer = overlapIdx > 0 ? allChildren[overlapIdx - 1] : allChildren[0];
    const introContainer = overlapIdx >= 0 ? allChildren[overlapIdx] : null;
    // Collect body sections after overlap-predecessor
    // Detect sidebar layout: grid-row with col-with-8 (main) + col-with-2 (sidebar card)
    let bodyContainer = null;
    let sidebarCard = null; // Related content card in right gutter
    if (overlapIdx >= 0 && overlapIdx + 1 < allChildren.length) {
      bodyContainer = document.createElement('div');
      for (let i = overlapIdx + 1; i < allChildren.length; i++) {
        const child = allChildren[i];
        const cls = child.className || '';
        if (cls.includes('experiencefragment')) break;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(child.tagName)) continue;

        // Detect 2-8-2 grid layout with sidebar
        const gridRow = child.querySelector('.grid-row');
        if (gridRow && !cls.includes('cmp-container-full-width')) {
          const cols = Array.from(gridRow.children).filter(c => (c.className || '').includes('col-with'));
          const col8 = cols.find(c => (c.className || '').includes('col-with-8'));
          const sidebarCol = cols.find(c => {
            const colCls = c.className || '';
            return (colCls.includes('col-with-2') || colCls.includes('col-with-3')) && c.querySelector('.cardpagestory');
          });

          if (col8 && sidebarCol) {
            // Use only col-8 for body content (sidebar card goes in right gutter)
            bodyContainer.appendChild(col8.cloneNode(true));

            // Extract sidebar card content for right gutter
            const sidebarCardEl = sidebarCol.querySelector('.cardpagestory');
            if (sidebarCardEl) {
              const link = sidebarCardEl.closest('a') || sidebarCardEl.querySelector('a[href]');
              const img = sidebarCardEl.querySelector('img');
              const heading = sidebarCardEl.querySelector('h4, h3, h5');
              const desc = sidebarCardEl.querySelector('p');
              sidebarCard = {
                href: link?.getAttribute('href') || '',
                imgSrc: normalizeImageUrl(img?.getAttribute('src') || img?.getAttribute('data-cmp-src') || ''),
                imgAlt: img?.getAttribute('alt') || '',
                heading: heading?.textContent?.trim() || '',
                description: desc?.textContent?.trim() || '',
              };
            }
            continue;
          }
        }

        bodyContainer.appendChild(child.cloneNode(true));
      }
    }

    const output = document.createElement('div');

    // ══════════════════════════════════════════════════════════
    // SECTION 1: HERO + INTRO
    // Edge cases: no hero image, no overlap, no back link
    // ══════════════════════════════════════════════════════════

    // HERO IMAGE OR VIDEO (conditional — some pages have no hero)
    let heroImgSrc = '';
    let heroImgAlt = '';
    let heroVideoUrl = '';
    let heightVariant = 'height-default';

    if (heroContainer) {
      // Check for Brightcove video in hero
      const videoEl = heroContainer.querySelector('[data-video-id], video-js, .video-js');
      if (videoEl) {
        const accountId = videoEl.getAttribute('data-account') || videoEl.getAttribute('data-account-id') || '2157889325001';
        const videoId = videoEl.getAttribute('data-video-id') || '';
        if (videoId) {
          heroVideoUrl = `https://players.brightcove.net/${accountId}/default_default/index.html?videoId=${videoId}`;
        }
      }

      // Get poster image (used as fallback or alongside video)
      const img = heroContainer.querySelector('img:not([src*="logo"]):not([src*="icon"])');
      if (img) {
        heroImgSrc = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
        heroImgAlt = img.getAttribute('alt') || '';
      }

      // Detect height from container classes
      const cls = heroContainer.className || '';
      if (cls.includes('height-tall')) heightVariant = 'height-tall';
      else if (cls.includes('height-short')) heightVariant = 'height-short';
    }

    // Generate hero block if we have an image
    // Note: Video is NOT placed in hero-container — it's handled by separate brightcove-video block
    if (heroImgSrc) {
      output.appendChild(makeHeroContainer(document, heroImgSrc, heroImgAlt, heightVariant));
    }

    // BACK CTA (conditional — not all pages have this)
    let backLinkUrl = '';
    let backLinkText = 'All Stories';
    if (introContainer) {
      const backLink = introContainer.querySelector('a[href*="/our-stories"]')
        || introContainer.querySelector('a[href*="/our-leaders"]')
        || introContainer.querySelector('.back-button a, a.back-button');
      if (backLink) {
        backLinkUrl = backLink.getAttribute('href') || '';
        backLinkText = backLink.textContent.trim().replace(/\s+/g, ' ') || 'Back';
      }
    }
    if (backLinkUrl) {
      output.appendChild(makeCTA(document, backLinkText, backLinkUrl));
    }

    // STORY CARD METADATA (conditional — detect date/category)
    let categoryPath = '';
    let hasMetadata = false;
    if (introContainer) {
      const fullText = introContainer.textContent || '';
      const dateMatch = fullText.match(/(\w+ \d{1,2}, \d{4})/);
      const readMatch = fullText.match(/(\d+)\s*Minute\s*Read/i);
      if (dateMatch || readMatch) {
        hasMetadata = true;
        // Find category link (not the back link)
        introContainer.querySelectorAll('a').forEach((a) => {
          const href = a.getAttribute('href') || '';
          if (href.includes('-stories') && !href.endsWith('/our-stories.html')) categoryPath = href;
          if (href.includes('-leaders') && !href.endsWith('/our-leaders.html')) categoryPath = href;
        });
      }
    }
    if (hasMetadata) {
      // Transform categoryPath to JCR format for the <a> text content
      let categoryJcrPath = categoryPath;
      if (categoryJcrPath) {
        categoryJcrPath = categoryJcrPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
        categoryJcrPath = categoryJcrPath.replace(/\.html$/, '');
        if (!categoryJcrPath.startsWith('/content/')) {
          categoryJcrPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${categoryJcrPath}`;
        }
      }
      output.appendChild(makeStoryCard(document, categoryPath, categoryJcrPath));
    }

    // TITLE (always present — h1)
    let titleText = '';
    if (introContainer) {
      const h1 = introContainer.querySelector('h1');
      if (h1) titleText = h1.textContent.trim();
    }
    if (!titleText) {
      const h1 = document.querySelector('h1');
      if (h1) titleText = h1.textContent.trim();
    }
    if (titleText) {
      output.appendChild(makeCustomTitle(document, titleText, 1, 'h1-size'));
    }

    // LEDE TEXT (conditional — first long paragraph after title)
    let ledeText = '';
    if (introContainer) {
      const allP = introContainer.querySelectorAll('p');
      for (const p of allP) {
        const text = p.textContent.trim();
        if (text.length > 40 && !text.match(/^\w+ \d{1,2}, \d{4}/) && !text.includes('Minute Read')) {
          ledeText = text;
          break;
        }
      }
    }
    if (ledeText) {
      const ledeDiv = document.createElement('div');
      ledeDiv.innerHTML = `<p>${ledeText}</p>`;
      output.appendChild(makeTextContainer(document, ledeDiv, 'body-unica-32-reg'));
    }

    // Close section 1
    output.appendChild(makeSectionMetadata(document, 'content-wide,medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTIONS 2-3: GRID CONTAINER + LEFT SPACER
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'content-regular', 'grid-container'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2', 'grid-section'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 4: BODY CONTENT (grid-section, grid-cols-8)
    // Edge cases handled per element type
    // ══════════════════════════════════════════════════════════

    if (bodyContainer) {
      // Collect ALL content-bearing elements in VISUAL POSITION ORDER
      // This fixes the carousel/content ordering issue caused by nested DOM depths
      const contentElements = bodyContainer.querySelectorAll(
        'h2, h3, h4, h5, .cmp-text, [role="region"]:has([role="tabpanel"]), .splide, ' +
        '.separator, [class*="separator"], .cmp-accordion, [aria-expanded], ' +
        '.cmp-image:not(.cmp-container__bg-image), .cmp-quote, blockquote, ' +
        '.cmp-video, .video.cmp-video-full-width, video-js[data-account], [data-video-id], ' +
        '.cardpagestory, .container:has(.cardpagestory)'
      );

      // Sort by vertical position (document order may differ from visual order in nested grids)
      const sortedElements = [...contentElements].sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.top - bRect.top;
      });

      const processedElements = new WeakSet();

      for (const child of sortedElements) {
        if (processedElements.has(child)) continue;
        // Skip if ancestor already processed
        let ancestorProcessed = false;
        let parent = child.parentElement;
        const childCls = child.className || '';
        // Don't skip accordion/carousel elements themselves — only their inner children
        const isAccordionOrCarousel = childCls.includes('cmp-accordion') ||
          (childCls.includes('splide') || child.getAttribute('role') === 'region');
        while (parent && parent !== bodyContainer) {
          if (processedElements.has(parent)) { ancestorProcessed = true; break; }
          // Skip text/heading elements that are INSIDE an accordion panel or carousel slide
          if (!isAccordionOrCarousel) {
            const parentCls = parent.className || '';
            if (parentCls.includes('cmp-accordion') || parentCls.includes('cmp-accordion__panel') ||
                parentCls.includes('splide__slide') || parentCls.includes('splide__list')) {
              ancestorProcessed = true; break;
            }
          }
          parent = parent.parentElement;
        }
        if (ancestorProcessed) continue;
        processedElements.add(child);

        const cls = child.className || '';
        const text = (child.textContent || '').trim();

        // Skip irrelevant elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK'].includes(child.tagName)) continue;
        if (cls.includes('experiencefragment')) continue;
        if (text.length < 3 && !child.querySelector('img, hr, video-js')) continue;

        // ── EDGE CASE: CAROUSEL (splide or region with tabpanels) ──
        if (cls.includes('carousel') || cls.includes('splide') ||
            child.getAttribute('role') === 'region' && child.querySelector('[role="tabpanel"]')) {
          const slides = child.querySelectorAll('[role="tabpanel"], .cmp-carousel__item, .splide__slide');
          // consumeSiblings=false — include images as rows IN the carousel
          const carouselBlock = makeCarousel(document, slides.length || 5);
          output.appendChild(carouselBlock);

          // Add slide images as custom-image blocks AFTER carousel (consumed as slides with consumeSiblings=true)
          slides.forEach((slide) => {
            const img = slide.querySelector('img');
            if (img) {
              const src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
              if (src) output.appendChild(makeCustomImage(document, src, img.getAttribute('alt') || '', ''));
            }
          });
          continue;
        }

        // ── EDGE CASE: ACCORDION/REFERENCES ──
        if (cls.includes('accordion') || child.querySelector('.cmp-accordion, [aria-expanded]')) {
          const items = [];
          const accItems = child.querySelectorAll('.cmp-accordion__item, button[aria-expanded], details');
          accItems.forEach((item) => {
            const summary = (item.querySelector('.cmp-accordion__button, summary') || item).textContent?.trim().substring(0, 200) || '';
            const panel = item.querySelector('.cmp-accordion__panel, [role="region"]') || item.nextElementSibling;
            if (summary && summary.length > 5) {
              items.push({ summary, content: panel?.innerHTML || '' });
            }
          });
          if (items.length > 0) {
            output.appendChild(makeAccordion(document, 'References', items));
          }
          continue;
        }

        // ── EDGE CASE: MEDIA INQUIRIES (always last before footer) ──
        if (/media\s*inquir|press\s*contact/i.test(text) && text.length < 500) {
          const link = child.querySelector('a[href*="mailto:"]');
          const div = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = 'Media inquiries:';
          div.appendChild(strong);
          div.appendChild(document.createTextNode(' '));
          if (link) {
            const a = document.createElement('a');
            a.href = link.getAttribute('href') || '';
            a.textContent = link.textContent.trim() || link.getAttribute('href').replace('mailto:', '');
            div.appendChild(a);
          }
          output.appendChild(makeTextContainer(document, div, 'spacing-bottom,width-x-large,body-unica-20-reg'));
          continue;
        }

        // ── EDGE CASE: QUOTE/BLOCKQUOTE ──
        const quoteEl = child.querySelector('.cmp-quote, blockquote, [class*="cmp-quote"]')
          || (cls.includes('cmp-quote') ? child : null);
        if (quoteEl || child.tagName === 'BLOCKQUOTE') {
          const qEl = quoteEl || child;
          // Extract quote text from .cmp-quote__text or first p element
          const qTextEl = qEl.querySelector('.cmp-quote__text, .cmp-quote__text-author-wrapper .cmp-quote__text');
          const qText = qTextEl?.textContent?.trim()
            || qEl.querySelector('p')?.textContent?.trim()
            || qEl.textContent.trim();
          // Extract author name and title separately
          const authorName = qEl.querySelector('.cmp-quote__author-name, [class*="author-name"]')?.textContent?.trim() || '';
          const authorTitle = qEl.querySelector('.cmp-quote__author-title, [class*="author-title"]')?.textContent?.trim() || '';
          // Extract author image if present — check multiple patterns
          const authorImg = qEl.querySelector('.cmp-quote__author-block img, .cmp-quote__author-image img, [class*="author-block"] img, [class*="author"] img, .cmp-quote img')
            || child.querySelector('[class*="author"] img, .cmp-quote__author-image img, img[class*="author"]');
          let authorImgSrc = '';
          if (authorImg) {
            authorImgSrc = normalizeImageUrl(authorImg.getAttribute('src') || authorImg.getAttribute('data-cmp-src') || authorImg.getAttribute('data-src') || '');
          }
          if (qText.length > 10) {
            output.appendChild(makeQuote(document, qText, authorName, authorTitle, authorImgSrc));
          }
          continue;
        }

        // ── EDGE CASE: YOUTUBE VIDEO (iframe) → Video block ──
        // Video model field GROUPS (after FieldGroup grouping):
        //   [0] uri
        //   [1] placeholderImage (collapsed: placeholderImageMimeType)
        //   [2] placeholderAlt
        //   [3] overlayTitle
        //   [4] overlayDescription
        //   [5] overlayBtnText
        //   [6] videoContentLayout
        //   [7] classes (overlayColor, overlayBtnStyle, customDynamicClass, commonCustomClass)
        //   [8] overlayButtonIconType
        //   [9] overlayButtonFontIcon
        //   [10] projectNumber
        //   [11] enableAutoplay
        //   [12] enableCaptions
        //   [13] enablePlayerControls
        //   [14] enableFullscreen
        //   [15] blockId
        //   [16] language
        //   [17] analytics_id
        const youtubeEl = child.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"]');
        if (youtubeEl) {
          const ytSrc = youtubeEl.getAttribute('src') || '';
          const a = document.createElement('a');
          a.href = ytSrc;
          a.textContent = ytSrc;
          // AbbVie video component structure: .cmp-video > .cmp-video__panel (poster+overlay) + .cmp-video__container (iframe)
          const cmpVideo = youtubeEl.closest('.cmp-video, .cmp-video-full-width, .video') || child;
          // Poster image in .cmp-video__image or .cmp-video__panel
          const posterImg = cmpVideo.querySelector('.cmp-video__image img, .cmp-video__panel img, img.cmp-image__image, img[class*="poster"], img[class*="thumbnail"]');
          const posterSrc = posterImg ? normalizeImageUrl(posterImg.getAttribute('src') || posterImg.getAttribute('data-cmp-src') || '') : '';
          const posterAlt = posterImg?.getAttribute('alt') || '';
          // Overlay title from heading or data-title
          const overlayHeading = cmpVideo.querySelector('.cmp-video__text-content [role="heading"], .cmp-video__text-content h2, .cmp-video__text-content h3');
          const overlayTitle = overlayHeading?.textContent?.trim() || cmpVideo.getAttribute('data-title') || youtubeEl.getAttribute('title') || '';
          // Overlay description from paragraph in text-content
          const overlayDescEl = cmpVideo.querySelector('.cmp-video__text-content p');
          const overlayDesc = overlayDescEl?.textContent?.trim() || '';
          // Play button text
          const playBtn = cmpVideo.querySelector('.cmp-video__text-content button, button[aria-label*="Watch"]');
          const overlayBtnText = playBtn?.textContent?.trim() || playBtn?.getAttribute('aria-label') || '';
          // Build poster cell
          let posterCell = '-';
          if (posterSrc) {
            const pic = document.createElement('picture');
            const pImg = document.createElement('img');
            pImg.src = posterSrc;
            pImg.alt = posterAlt;
            pic.appendChild(pImg);
            posterCell = pic;
          }
          // Video model field groups (18) — after renaming orphan suffix fields:
          // Fields renamed: overlayTitle→overlayHeading, overlayBtnText→overlayButtonLabel,
          //   placeholderAlt→placeholderAltLabel, overlayButtonIconType→overlayBtnIconVariation
          output.appendChild(makeBlock(document, 'Video', [
            [a],             // [0] uri
            [posterCell],    // [1] placeholderImage (+ collapsed MimeType)
            [posterAlt || '-'], // [2] placeholderAltLabel
            [overlayTitle || '-'], // [3] overlayHeading
            [overlayDesc || '-'],  // [4] overlayDescription
            [overlayBtnText || '-'], // [5] overlayButtonLabel
            ['none'],        // [6] videoContentLayout
            ['video-overlay-navy'], // [7] classes group
            ['icon-font'],   // [8] overlayBtnIconVariation
            ['play'],        // [9] overlayButtonFontIcon
            ['-'],           // [10] projectNumber
            ['false'],       // [11] enableAutoplay
            ['false'],       // [12] enableCaptions
            ['true'],        // [13] enablePlayerControls
            ['true'],        // [14] enableFullscreen
            ['-'],           // [15] blockId
            ['none'],        // [16] language
            ['-'],           // [17] analytics_id
          ]));
          continue;
        }

        // ── EDGE CASE: BRIGHTCOVE VIDEO ──
        const videoEl = child.querySelector('video-js, [data-video-id], [data-account]');
        if (videoEl) {
          const videoId = videoEl.getAttribute('data-video-id') || '';
          const accountId = videoEl.getAttribute('data-account') || videoEl.getAttribute('data-account-id') || '2157889325001';
          const playerId = videoEl.getAttribute('data-player') || 'default';
          const videoParent = videoEl.closest('.cmp-video, .video, [class*="video"]:not(.video-js)') || videoEl.parentElement;
          const overlayTitle = videoParent?.getAttribute('data-overlay-title')
            || videoParent?.previousElementSibling?.querySelector('h2, h3, h4')?.textContent?.trim()
            || child.querySelector('.cmp-title h2, h2, h3')?.textContent?.trim() || '';
          const watchLabel = videoParent?.getAttribute('data-watch-label')
            || child.querySelector('button[class*="watch"], .cmp-video__cta-text')?.textContent?.trim() || 'Watch Video';
          // Brightcove Video — 33 rows
          output.appendChild(makeBlock(document, 'Brightcove Video', [
            [''],              // [0] projectNumber
            [overlayTitle],    // [1] overlayTitle
            [''],              // [2] overlayDescription
            ['brightcove'],    // [3] posterType
            [''],              // [4] posterImage
            [''],              // [5] posterAlt
            ['none'],          // [6] colorOverlay
            [watchLabel],      // [7] overlayButtonText
            ['icon-font'],     // [8] overlayButtonIconType
            ['play'],          // [9] overlayButtonFontIcon
            [''],              // [10] overlayButtonImageIcon
            ['left'],          // [11] iconPosition
            ['single'],        // [12] playerType
            [accountId],       // [13] accountId
            [playerId],        // [14] playerId
            [videoId],         // [15] videoId
            [''],              // [16] playlistId
            [''],              // [17] defaultPlaylistVideoId
            ['carousel'],      // [18] playlistType
            ['none'],          // [19] videoContentLayout
            ['false'],         // [20] enablePlaylistThumbnailMetadata
            [''],              // [21] captionTitle
            [''],              // [22] captionDescription
            [''],              // [23] playButtonAriaLabel
            [''],              // [24] videoCaption
            ['false'],         // [25] enableAutoplay
            ['false'],         // [26] enableLoop
            ['false'],         // [27] enableCaptions
            ['false'],         // [28] enableVideoChapters
            ['false'],         // [29] enableRecommendedVideo
            ['true'],          // [30] enablePlayerControls
            ['false'],         // [31] enableSocialShare
            ['false'],         // [32] enableTranscript
          ]));
          continue;
        }

        // ── EDGE CASE: STANDALONE IMAGE (not with text) ──
        const imgEl = child.querySelector('img.cmp-image__image, .cmp-image img, img[data-cmp-src]');
        if (imgEl && !child.querySelector('h2, h3, h4, h5') && !child.querySelector('p:not(:has(img))')) {
          const src = normalizeImageUrl(imgEl.getAttribute('src') || imgEl.getAttribute('data-cmp-src') || '');
          if (src) {
            const alt = imgEl.getAttribute('alt') || '';
            const caption = child.querySelector('figcaption, .cmp-image__title, em')?.textContent?.trim() || '';
            output.appendChild(makeCustomImage(document, src, alt, caption));

            // EDGE CASE: Image followed by italic caption text
            if (caption) {
              const capDiv = document.createElement('div');
              const em = document.createElement('em');
              em.textContent = caption;
              capDiv.appendChild(em);
              output.appendChild(makeTextContainer(document, capDiv, 'standard,custom-class'));
            }
          }
          continue;
        }

        // ── EDGE CASE: SEPARATOR ──
        if (child.tagName === 'HR' || cls.includes('separator') || child.querySelector('hr, .cmp-separator')) {
          output.appendChild(makeSeparator(document, 24));
          continue;
        }

        // ── EDGE CASE: RELATED CONTENT CARDS (cardpagestory elements) ──
        const cardPageStories = child.querySelectorAll('.cardpagestory');
        if (cardPageStories.length > 0 && !cls.includes('carousel') && !cls.includes('splide')) {
          const relHeading = child.querySelector('h2, h3, h4, h5');
          if (relHeading) {
            output.appendChild(makeCustomTitle(document, relHeading.textContent.trim(), 5, 'h5-size,width-large'));
          }
          cardPageStories.forEach((card) => {
            const cardLink = card.closest('a') || card.querySelector('a[href]');
            const href = cardLink?.getAttribute('href') || '';
            if (href) {
              output.appendChild(makeRelatedContentCard(document, href));
            }
          });
          continue;
        }

        // ── HEADING ELEMENTS (direct h2-h5 nodes from sorted list) ──
        if (['H2', 'H3', 'H4', 'H5'].includes(child.tagName)) {
          output.appendChild(makeCustomTitle(document, child.textContent.trim(), 5, 'h5-size,width-large'));
          continue;
        }

        // ── TEXT CONTENT (.cmp-text or elements with paragraphs) ──
        const heading = child.querySelector('h2, h3, h4, h5');
        const textEls = child.querySelectorAll('p');

        // If this element has a heading, output it first
        if (heading) {
          output.appendChild(makeCustomTitle(document, heading.textContent.trim(), 5, 'h5-size,width-large'));
        }

        // Process paragraphs
        if (textEls.length > 0) {
          const div = document.createElement('div');
          let hasContent = false;
          let isCaption = false;

          textEls.forEach((p) => {
            const trimmed = p.textContent.trim();
            if (trimmed.length > 0) {
              const newP = document.createElement('p');
              newP.innerHTML = p.innerHTML;
              div.appendChild(newP);
              hasContent = true;
              // Detect italic caption: paragraph entirely in <em>/<i>
              const emEl = p.querySelector('em, i');
              if (emEl && emEl.textContent.trim().length > trimmed.length * 0.7 && trimmed.length < 300) {
                isCaption = true;
              }
            }
          });

          if (hasContent) {
            if (isCaption) {
              // Caption text — wider, italic style
              output.appendChild(makeTextContainer(document, div, 'standard,custom-class'));
            } else {
              output.appendChild(makeTextContainer(document, div, 'spacing-bottom,width-large'));
            }
          }
        }
      }
    }

    // ── RELATED CONTENT SECTION (after body — separate container with cards) ──
    // Some pages have a final .container.cmp-container-full-width with cardpagestory links
    if (overlapIdx >= 0) {
      for (let i = overlapIdx + 1; i < allChildren.length; i++) {
        const section = allChildren[i];
        const sCls = section.className || '';
        if (sCls.includes('experiencefragment')) break;
        if (sCls.includes('container') && sCls.includes('cmp-container-full-width')) {
          const sectionCards = section.querySelectorAll('.cardpagestory');
          if (sectionCards.length > 0) {
            const relHeading = section.querySelector('h2, h3, h4, h5');
            if (relHeading) {
              output.appendChild(makeCustomTitle(document, relHeading.textContent.trim(), 5, 'h5-size,width-large'));
            }
            sectionCards.forEach((card) => {
              const cardLink = card.closest('a') || card.querySelector('a[href]');
              const href = cardLink?.getAttribute('href') || '';
              if (href) {
                output.appendChild(makeRelatedContentCard(document, href));
              }
            });
          }
        }
      }
    }

    // Close section 4
    output.appendChild(makeSectionMetadata(document, 'grid-cols-8', 'grid-section'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 5: RIGHT SPACER (with sidebar card if present)
    // ══════════════════════════════════════════════════════════

    if (sidebarCard && sidebarCard.href) {
      // Story Card with sidePanel variant (matches xwalk reference)
      // Transform href to JCR path for categoryPath
      let categoryJcrPath = sidebarCard.href;
      categoryJcrPath = categoryJcrPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
      categoryJcrPath = categoryJcrPath.replace(/\.html$/, '');
      if (!categoryJcrPath.startsWith('/content/')) {
        categoryJcrPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${categoryJcrPath}`;
      }
      const categoryLink = document.createElement('a');
      categoryLink.href = sidebarCard.href;
      categoryLink.textContent = categoryJcrPath;

      // Story Card sidePanel — 12 rows per reference
      output.appendChild(makeBlock(document, 'Story Card', [
        ['sidePanel'], ['false'], ['false'], ['false'], ['false'], ['false'],
        [''], [''], [categoryLink], ['true'], [''], [''],
      ]));
    }
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2', 'grid-section'));

    // ══════════════════════════════════════════════════════════
    // PAGE METADATA (maps to JCR page properties via md2jcr)
    // ══════════════════════════════════════════════════════════

    // Extract metadata from source page <head>
    const pageTitle = (document.title || '').replace(/\s*\|\s*AbbVie\s*$/, '').trim();
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const ogImage = document.querySelector('meta[property="og:image:url"]')?.getAttribute('content') || '';
    const metaLang = document.querySelector('meta[name="language"]')?.getAttribute('content') || 'en';
    const metaCountry = document.querySelector('meta[name="country"]')?.getAttribute('content') || 'us';

    // Extract story-specific metadata from intro section
    let pubDate = '';
    let readTimeVal = '';
    let categoryText = '';
    if (introContainer) {
      const fullText = introContainer.textContent || '';
      const dateMatch = fullText.match(/(\w+ \d{1,2}, \d{4})/);
      if (dateMatch) pubDate = dateMatch[1];
      const readMatch = fullText.match(/(\d+)\s*Minute\s*Read/i);
      if (readMatch) readTimeVal = readMatch[1];
      introContainer.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();
        if (href.includes('-stories') && text !== 'All Stories' && !href.endsWith('/our-stories.html')) {
          categoryText = text;
        }
      });
    }

    // Build metadata block with JCR property names from page-metadata model
    const metaRows = [];
    if (pageTitle) metaRows.push(['jcr:title', pageTitle]);
    if (metaDesc) metaRows.push(['jcr:description', metaDesc]);
    if (ogImage) {
      const imgEl = document.createElement('img');
      imgEl.src = ogImage;
      metaRows.push(['image', imgEl]);
    }
    if (pubDate) metaRows.push(['publicationDate', pubDate]);
    if (readTimeVal) metaRows.push(['storyReadTime', readTimeVal]);
    if (categoryText) metaRows.push(['eyebrowText', categoryText]);
    if (pageTitle) metaRows.push(['cardTitle', pageTitle]);
    if (metaDesc) metaRows.push(['cardDescription', metaDesc]);
    metaRows.push(['template', 'story-article']);
    metaRows.push(['brand', 'abbvie']);

    if (metaRows.length > 0) {
      output.appendChild(document.createElement('hr'));
      output.appendChild(makeBlock(document, 'Metadata', metaRows));
    }

    // Final cleanup
    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });

    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
